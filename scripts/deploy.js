const { ethers } = require("hardhat");

// Agent wallet address (AI agent that calls registerInvoice, executePayment, etc.)
const AGENT_WALLET = "0xCBbd16c9697C6b0FB8a67C475b71F7cAC9BE716F";

// Spend limits (in cUSD with 18 decimals)
const MAX_PER_TX  = ethers.parseUnits("500",  18); // 500 cUSD per transaction
const MAX_DAILY   = ethers.parseUnits("5000", 18); // 5000 cUSD per day

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer :", deployer.address);
  console.log("Network  :", (await ethers.provider.getNetwork()).name);
  console.log("─".repeat(60));

  // ── 1. MockCUSD ────────────────────────────────────────────────────────────
  console.log("\n[1/5] Deploying MockCUSD...");
  const MockCUSD = await ethers.getContractFactory("MockCUSD");
  const mockCUSD = await MockCUSD.deploy();
  await mockCUSD.waitForDeployment();
  console.log("  MockCUSD    :", await mockCUSD.getAddress());

  // ── 2. ReceiptStore ────────────────────────────────────────────────────────
  console.log("\n[2/5] Deploying ReceiptStore...");
  const ReceiptStore = await ethers.getContractFactory("ReceiptStore");
  const receiptStore = await ReceiptStore.deploy();
  await receiptStore.waitForDeployment();
  console.log("  ReceiptStore:", await receiptStore.getAddress());

  // ── 3. SmartSettle ─────────────────────────────────────────────────────────
  console.log("\n[3/5] Deploying SmartSettle...");
  const SmartSettle = await ethers.getContractFactory("SmartSettle");
  const smartSettle = await SmartSettle.deploy(
    await mockCUSD.getAddress(),
    await receiptStore.getAddress(),
    AGENT_WALLET,
    MAX_PER_TX
  );
  await smartSettle.waitForDeployment();
  console.log("  SmartSettle :", await smartSettle.getAddress());

  // ── 4. Wire ReceiptStore → SmartSettle ────────────────────────────────────
  console.log("\n[4/5] Wiring ReceiptStore.setSmartSettle()...");
  const tx1 = await receiptStore.setSmartSettle(await smartSettle.getAddress());
  await tx1.wait();
  console.log("  Done. ReceiptStore now trusts SmartSettle.");

  // ── 5. MockProvider ────────────────────────────────────────────────────────
  console.log("\n[5/5] Deploying MockProvider (BESCOM, 8% discount)...");
  const MockProvider = await ethers.getContractFactory("MockProvider");
  const mockProvider = await MockProvider.deploy(
    await mockCUSD.getAddress(),
    "BESCOM",
    800 // 8% in basis points
  );
  await mockProvider.waitForDeployment();
  console.log("  MockProvider:", await mockProvider.getAddress());

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("═".repeat(60));
  console.log("MockCUSD     :", await mockCUSD.getAddress());
  console.log("ReceiptStore :", await receiptStore.getAddress());
  console.log("SmartSettle  :", await smartSettle.getAddress());
  console.log("MockProvider :", await mockProvider.getAddress());
  console.log("Agent Wallet :", AGENT_WALLET);
  console.log("─".repeat(60));
  console.log("\nAdd these to your .env:");
  console.log(`MOCK_CUSD_ADDRESS=${await mockCUSD.getAddress()}`);
  console.log(`RECEIPT_STORE_ADDRESS=${await receiptStore.getAddress()}`);
  console.log(`SMART_SETTLE_ADDRESS=${await smartSettle.getAddress()}`);
  console.log(`MOCK_PROVIDER_ADDRESS=${await mockProvider.getAddress()}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
