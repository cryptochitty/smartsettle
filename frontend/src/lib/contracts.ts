export const ADDRESSES = {
  celo: {
    SMART_SETTLE:  (process.env.NEXT_PUBLIC_SMART_SETTLE_ADDRESS  || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    AGENT_WALLET:  (process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS  || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    RECEIPT_STORE: (process.env.NEXT_PUBLIC_RECEIPT_STORE_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    CUSD:          "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`,
  },
  // Even if we aren't using Sepolia, we define it to prevent 'undefined' crashes
  celoSepolia: {
    SMART_SETTLE:  (process.env.NEXT_PUBLIC_SMART_SETTLE_ADDRESS  || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    AGENT_WALLET:  (process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS  || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    RECEIPT_STORE: (process.env.NEXT_PUBLIC_RECEIPT_STORE_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    CUSD:          "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`,
  }
};

export const CUSD_ABI = [
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
] as const;

export const SMART_SETTLE_ABI = [
  { name: "getUserInvoices", type: "function", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ name: "", type: "bytes32[]" }] },
  { name: "totalSaved", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "totalPayments", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
] as const;

export const AGENT_WALLET_ABI = [
  { name: "deposit", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "withdraw", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "getBalance", type: "function", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
] as const;
