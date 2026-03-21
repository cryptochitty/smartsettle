const { expect } = require("chai");
const { ethers } = require("hardhat");

const toWei = (n) => ethers.parseUnits(String(n), 18);

// ─────────────────────────────────────────────────────────────────────────────
describe("ReceiptStore", function () {
  let receiptStore, authorized;
  let owner, stranger, payer, provider;

  // Sample receipt params
  const invoiceId     = ethers.keccak256(ethers.toUtf8Bytes("inv-001"));
  const invoiceHash   = ethers.keccak256(ethers.toUtf8Bytes("invoice-file"));
  const originalAmt   = toWei(100);
  const paidAmt       = toWei(92);
  const savedAmt      = toWei(8);
  const providerName  = "BESCOM";
  const category      = "Utility";

  beforeEach(async function () {
    [owner, authorized, payer, provider, stranger] = await ethers.getSigners();

    const ReceiptStore = await ethers.getContractFactory("ReceiptStore");
    receiptStore = await ReceiptStore.deploy();

    // Set an authorized caller (simulates SmartSettle)
    await receiptStore.setSmartSettle(authorized.address);
  });

  // ── Deployment ──────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("deploys with owner set correctly", async function () {
      expect(await receiptStore.owner()).to.equal(owner.address);
    });

    it("starts with zero receipts", async function () {
      expect(await receiptStore.totalReceipts()).to.equal(0);
    });
  });

  // ── setSmartSettle ──────────────────────────────────────────────────────────
  describe("setSmartSettle()", function () {
    it("owner can set SmartSettle address", async function () {
      const fresh = await (await ethers.getContractFactory("ReceiptStore")).deploy();
      await expect(fresh.setSmartSettle(authorized.address))
        .to.emit(fresh, "SmartSettleUpdated")
        .withArgs(ethers.ZeroAddress, authorized.address);
      expect(await fresh.smartSettle()).to.equal(authorized.address);
    });

    it("reverts for non-owner", async function () {
      await expect(
        receiptStore.connect(stranger).setSmartSettle(stranger.address)
      ).to.be.reverted;
    });

    it("reverts for zero address", async function () {
      const fresh = await (await ethers.getContractFactory("ReceiptStore")).deploy();
      await expect(
        fresh.setSmartSettle(ethers.ZeroAddress)
      ).to.be.revertedWith("ReceiptStore: zero address");
    });
  });

  // ── storeReceipt ────────────────────────────────────────────────────────────
  describe("storeReceipt()", function () {
    async function store(overrides = {}) {
      return receiptStore.connect(authorized).storeReceipt(
        overrides.invoiceId    ?? invoiceId,
        overrides.invoiceHash  ?? invoiceHash,
        overrides.payer        ?? payer.address,
        overrides.provider     ?? provider.address,
        overrides.originalAmt  ?? originalAmt,
        overrides.paidAmt      ?? paidAmt,
        overrides.savedAmt     ?? savedAmt,
        overrides.providerName ?? providerName,
        overrides.category     ?? category
      );
    }

    it("stores receipt and returns a non-zero receiptId", async function () {
      const tx = await store();
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "ReceiptStored");
      expect(event.args.receiptId).to.not.equal(ethers.ZeroHash);
    });

    it("increments totalReceipts", async function () {
      await store();
      expect(await receiptStore.totalReceipts()).to.equal(1);
    });

    it("emits ReceiptStored with correct fields", async function () {
      await expect(store())
        .to.emit(receiptStore, "ReceiptStored")
        .withArgs(
          // receiptId is dynamic, use anyValue
          (v) => v !== ethers.ZeroHash,
          invoiceId,
          payer.address,
          paidAmt,
          savedAmt
        );
    });

    it("maps invoiceId → receiptId correctly", async function () {
      await store();
      const receiptId = await receiptStore.invoiceToReceipt(invoiceId);
      expect(receiptId).to.not.equal(ethers.ZeroHash);
    });

    it("only authorized SmartSettle can call storeReceipt", async function () {
      await expect(
        receiptStore.connect(stranger).storeReceipt(
          invoiceId, invoiceHash, payer.address, provider.address,
          originalAmt, paidAmt, savedAmt, providerName, category
        )
      ).to.be.revertedWith("ReceiptStore: caller is not SmartSettle");
    });

    it("reverts on duplicate receipt for same invoiceId", async function () {
      await store();
      await expect(store()).to.be.revertedWith("ReceiptStore: receipt already exists");
    });

    it("reverts if paidAmount is zero", async function () {
      await expect(store({ paidAmt: 0 }))
        .to.be.revertedWith("ReceiptStore: zero paid amount");
    });

    it("reverts if paidAmount exceeds originalAmount", async function () {
      await expect(store({ paidAmt: toWei(101), savedAmt: 0 }))
        .to.be.revertedWith("ReceiptStore: paid > original");
    });

    it("reverts if payer is zero address", async function () {
      await expect(store({ payer: ethers.ZeroAddress }))
        .to.be.revertedWith("ReceiptStore: zero payer");
    });

    it("reverts if provider is zero address", async function () {
      await expect(store({ provider: ethers.ZeroAddress }))
        .to.be.revertedWith("ReceiptStore: zero provider");
    });
  });

  // ── Read functions ──────────────────────────────────────────────────────────
  describe("Read functions", function () {
    let receiptId;

    beforeEach(async function () {
      const tx = await receiptStore.connect(authorized).storeReceipt(
        invoiceId, invoiceHash, payer.address, provider.address,
        originalAmt, paidAmt, savedAmt, providerName, category
      );
      const receipt = await tx.wait();
      const event   = receipt.logs.find(l => l.fragment?.name === "ReceiptStored");
      receiptId = event.args.receiptId;
    });

    it("getReceipt() returns correct data", async function () {
      const r = await receiptStore.getReceipt(receiptId);
      expect(r.invoiceId).to.equal(invoiceId);
      expect(r.payer).to.equal(payer.address);
      expect(r.provider).to.equal(provider.address);
      expect(r.originalAmount).to.equal(originalAmt);
      expect(r.paidAmount).to.equal(paidAmt);
      expect(r.savedAmount).to.equal(savedAmt);
      expect(r.providerName).to.equal(providerName);
      expect(r.blockNumber).to.be.gt(0);
    });

    it("getReceipt() reverts for unknown receiptId", async function () {
      await expect(
        receiptStore.getReceipt(ethers.ZeroHash)
      ).to.be.revertedWith("ReceiptStore: receipt not found");
    });

    it("getReceiptByInvoice() resolves by invoiceId", async function () {
      const r = await receiptStore.getReceiptByInvoice(invoiceId);
      expect(r.paidAmount).to.equal(paidAmt);
    });

    it("getReceiptByInvoice() reverts for unknown invoiceId", async function () {
      const unknownId = ethers.keccak256(ethers.toUtf8Bytes("nope"));
      await expect(
        receiptStore.getReceiptByInvoice(unknownId)
      ).to.be.revertedWith("ReceiptStore: no receipt for invoice");
    });

    it("getUserReceiptIds() returns correct list", async function () {
      const ids = await receiptStore.getUserReceiptIds(payer.address);
      expect(ids).to.include(receiptId);
    });

    it("getUserReceipts() returns full receipt data", async function () {
      const receipts = await receiptStore.getUserReceipts(payer.address);
      expect(receipts.length).to.equal(1);
      expect(receipts[0].paidAmount).to.equal(paidAmt);
    });

    it("verifyReceipt() returns true for valid data", async function () {
      const valid = await receiptStore.verifyReceipt(receiptId, invoiceId, payer.address, paidAmt);
      expect(valid).to.be.true;
    });

    it("verifyReceipt() returns false for wrong paidAmount", async function () {
      const valid = await receiptStore.verifyReceipt(receiptId, invoiceId, payer.address, toWei(50));
      expect(valid).to.be.false;
    });
  });
});
