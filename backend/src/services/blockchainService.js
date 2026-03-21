const { createPublicClient, createWalletClient, http, parseUnits, formatUnits, keccak256, toHex } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const path = require("path");
const fs   = require("fs");

// ── Chain definition ──────────────────────────────────────────────────────────
const celoSepolia = {
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org"] },
  },
};

// ── Clients ───────────────────────────────────────────────────────────────────
const publicClient = createPublicClient({
  chain:     celoSepolia,
  transport: http(),
});

function getWalletClient() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY not set in environment");
  const account = privateKeyToAccount(`0x${pk.replace(/^0x/, "")}`);
  return createWalletClient({ account, chain: celoSepolia, transport: http() });
}

// ── Load deployment manifest ──────────────────────────────────────────────────
function loadAddresses() {
  const manifestPath = path.join(__dirname, "../../../deployments/celoSepolia.json");
  if (!fs.existsSync(manifestPath)) {
    // Fall back to env vars
    return {
      SmartSettle:  process.env.SMART_SETTLE_ADDRESS,
      AgentWallet:  process.env.AGENT_WALLET_ADDRESS,
      ReceiptStore: process.env.RECEIPT_STORE_ADDRESS,
      MockProvider: process.env.MOCK_PROVIDER_ADDRESS,
      cUSD:         process.env.MOCK_CUSD_ADDRESS,
    };
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return manifest.contracts;
}

// ── ABIs (minimal) ────────────────────────────────────────────────────────────
const SMART_SETTLE_ABI = [
  { name: "registerInvoice",     type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "invoiceId",      type: "bytes32" },
      { name: "invoiceHash",    type: "bytes32" },
      { name: "payer",          type: "address" },
      { name: "provider",       type: "address" },
      { name: "originalAmount", type: "uint256" },
      { name: "dueDate",        type: "uint256" },
      { name: "providerName",   type: "string"  },
      { name: "category",       type: "string"  },
    ], outputs: [] },
  { name: "recordNegotiatedOffer", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "invoiceId",        type: "bytes32" },
      { name: "negotiatedAmount", type: "uint256" },
      { name: "discountLabel",    type: "string"  },
    ], outputs: [] },
  { name: "executePayment", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "invoiceId", type: "bytes32" }], outputs: [] },
  { name: "getInvoice", type: "function", stateMutability: "view",
    inputs: [{ name: "invoiceId", type: "bytes32" }],
    outputs: [{ name: "", type: "tuple", components: [
      { name: "invoiceHash",      type: "bytes32" },
      { name: "provider",         type: "address" },
      { name: "payer",            type: "address" },
      { name: "originalAmount",   type: "uint256" },
      { name: "negotiatedAmount", type: "uint256" },
      { name: "dueDate",          type: "uint256" },
      { name: "registeredAt",     type: "uint256" },
      { name: "paidAt",           type: "uint256" },
      { name: "status",           type: "uint8"   },
      { name: "providerName",     type: "string"  },
      { name: "category",         type: "string"  },
    ]}] },
  { name: "getUserInvoices", type: "function", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bytes32[]" }] },
];

const RECEIPT_STORE_ABI = [
  { name: "getUserReceipts", type: "function", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "tuple[]", components: [
      { name: "invoiceId",      type: "bytes32" },
      { name: "invoiceHash",    type: "bytes32" },
      { name: "payer",          type: "address" },
      { name: "provider",       type: "address" },
      { name: "originalAmount", type: "uint256" },
      { name: "paidAmount",     type: "uint256" },
      { name: "savedAmount",    type: "uint256" },
      { name: "timestamp",      type: "uint256" },
      { name: "blockNumber",    type: "uint256" },
      { name: "providerName",   type: "string"  },
      { name: "category",       type: "string"  },
    ]}] },
  { name: "totalSaved", type: "function", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "uint256" }] },
];

// ── On-chain helpers ──────────────────────────────────────────────────────────

async function registerInvoiceOnChain({ invoiceId, invoiceHash, payer, provider, providerName, originalAmountUSD, dueDate, category }) {
  const addrs        = loadAddresses();
  const walletClient = getWalletClient();
  const amount       = parseUnits(originalAmountUSD.toString(), 18);
  // Use explicit provider if given, otherwise fall back to MockProvider (testnet), then agent address
  const providerAddr = provider || addrs.MockProvider || walletClient.account.address;

  const hash = await walletClient.writeContract({
    address:      addrs.SmartSettle,
    abi:          SMART_SETTLE_ABI,
    functionName: "registerInvoice",
    args: [invoiceId, invoiceHash, payer, providerAddr, amount, BigInt(dueDate), providerName, category],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

async function recordOffer({ invoiceId, negotiatedAmountUSD, discountLabel }) {
  const addrs        = loadAddresses();
  const walletClient = getWalletClient();
  const amount       = parseUnits(negotiatedAmountUSD.toString(), 18);

  const hash = await walletClient.writeContract({
    address: addrs.SmartSettle, abi: SMART_SETTLE_ABI,
    functionName: "recordNegotiatedOffer",
    args: [invoiceId, amount, discountLabel],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

async function executePaymentOnChain(invoiceId) {
  const addrs        = loadAddresses();
  const walletClient = getWalletClient();

  const hash = await walletClient.writeContract({
    address: addrs.SmartSettle, abi: SMART_SETTLE_ABI,
    functionName: "executePayment", args: [invoiceId],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { txHash: hash, blockNumber: Number(receipt.blockNumber) };
}

async function getInvoicesForWallet(walletAddress) {
  const addrs = loadAddresses();
  const ids   = await publicClient.readContract({
    address: addrs.SmartSettle, abi: SMART_SETTLE_ABI,
    functionName: "getUserInvoices", args: [walletAddress],
  });
  const invoices = await Promise.all(ids.map(async (id) => {
    const inv = await publicClient.readContract({
      address: addrs.SmartSettle, abi: SMART_SETTLE_ABI,
      functionName: "getInvoice", args: [id],
    });
    const STATUS = ["NONE","REGISTERED","NEGOTIATED","PAID","CANCELLED"];
    return {
      id,
      providerName:     inv.providerName,
      category:         inv.category,
      payer:            inv.payer,
      provider:         inv.provider,
      originalAmount:   formatUnits(inv.originalAmount, 18),
      negotiatedAmount: inv.negotiatedAmount > 0n ? formatUnits(inv.negotiatedAmount, 18) : undefined,
      dueDate:          Number(inv.dueDate),
      registeredAt:     Number(inv.registeredAt),
      paidAt:           inv.paidAt > 0n ? Number(inv.paidAt) : undefined,
      status:           STATUS[inv.status] || "NONE",
    };
  }));
  return invoices;
}

async function getReceiptsForWallet(walletAddress) {
  const addrs    = loadAddresses();
  const receipts = await publicClient.readContract({
    address: addrs.ReceiptStore, abi: RECEIPT_STORE_ABI,
    functionName: "getUserReceipts", args: [walletAddress],
  });
  return receipts.map((r) => ({
    invoiceId:      r.invoiceId,
    payer:          r.payer,
    provider:       r.provider,
    providerName:   r.providerName,
    category:       r.category,
    originalAmount: formatUnits(r.originalAmount, 18),
    paidAmount:     formatUnits(r.paidAmount, 18),
    savedAmount:    formatUnits(r.savedAmount, 18),
    timestamp:      Number(r.timestamp),
    blockNumber:    Number(r.blockNumber),
  }));
}

module.exports = {
  registerInvoiceOnChain,
  recordOffer,
  executePaymentOnChain,
  getInvoicesForWallet,
  getReceiptsForWallet,
};
