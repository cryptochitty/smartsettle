const { expect }       = require("chai");
const { ethers }       = require("hardhat");
const { time }         = require("@nomicfoundation/hardhat-network-helpers");

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const toWei   = (n) => ethers.parseUnits(String(n), 18);
const WEEK    = 7 * 24 * 60 * 60;

function makeInvoiceId()  { return ethers.keccak256(ethers.randomBytes(32)); }
function makeInvoiceHash(){ return ethers.keccak256(ethers.toUtf8Bytes("invoice-pdf-content")); }

// ─────────────────────────────────────────────────────────────────────────────
describe("SmartSettle", function () {
  let smartSettle, receiptStore, mockCUSD;
  let owner, agent, user, provider;

  const MAX_PAYMENT = toWei(500);

  beforeEach(async function () {
    [owner, agent, user, provider] = await ethers.getSigners();

    // Deploy
    const MockCUSD     = await ethers.getContractFactory("MockCUSD");
    const ReceiptStore = await ethers.getContractFactory("ReceiptStore");
    const SmartSettle  = await ethers.getContractFactory("SmartSettle");

    mockCUSD     = await MockCUSD.deploy();
    receiptStore = await ReceiptStore.deploy();
    smartSettle  = await SmartSettle.deploy(
      await mockCUSD.getAddress(),
      await receiptStore.getAddress(),
      agent.address,
      MAX_PAYMENT
    );

    // Wire ReceiptStore → SmartSettle
    await receiptStore.setSmartSettle(await smartSettle.getAddress());

    // Fund user and approve SmartSettle
    await mockCUSD.mint(user.address, toWei(10_000));
    await mockCUSD.connect(user).approve(await smartSettle.getAddress(), toWei(10_000));
  });

  // ── Deployment ──────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("sets cUSD, receiptStore, agentWallet, maxPayment correctly", async function () {
      expect(await smartSettle.cUSD()).to.equal(await mockCUSD.getAddress());
      expect(await smartSettle.receiptStore()).to.equal(await receiptStore.getAddress());
      expect(await smartSettle.agentWallet()).to.equal(agent.address);
      expect(await smartSettle.maxPaymentAmount()).to.equal(MAX_PAYMENT);
    });

    it("reverts on zero cUSD address", async function () {
      const SmartSettle = await ethers.getContractFactory("SmartSettle");
      await expect(
        SmartSettle.deploy(ethers.ZeroAddress, await receiptStore.getAddress(), agent.address, MAX_PAYMENT)
      ).to.be.revertedWith("SmartSettle: zero cUSD address");
    });

    it("reverts on zero receiptStore address", async function () {
      const SmartSettle = await ethers.getContractFactory("SmartSettle");
      await expect(
        SmartSettle.deploy(await mockCUSD.getAddress(), ethers.ZeroAddress, agent.address, MAX_PAYMENT)
      ).to.be.revertedWith("SmartSettle: zero receiptStore");
    });

    it("reverts on zero agent address", async function () {
      const SmartSettle = await ethers.getContractFactory("SmartSettle");
      await expect(
        SmartSettle.deploy(await mockCUSD.getAddress(), await receiptStore.getAddress(), ethers.ZeroAddress, MAX_PAYMENT)
      ).to.be.revertedWith("SmartSettle: zero agent address");
    });

    it("reverts on zero maxPaymentAmount", async function () {
      const SmartSettle = await ethers.getContractFactory("SmartSettle");
      await expect(
        SmartSettle.deploy(await mockCUSD.getAddress(), await receiptStore.getAddress(), agent.address, 0)
      ).to.be.revertedWith("SmartSettle: zero max payment");
    });
  });

  // ── registerInvoice ─────────────────────────────────────────────────────────
  describe("registerInvoice()", function () {
    it("stores invoice with correct fields", async function () {
      const id    = makeInvoiceId();
      const hash  = makeInvoiceHash();
      const due   = (await time.latest()) + WEEK;

      await smartSettle.connect(agent).registerInvoice(
        id, hash, user.address, provider.address, toWei(100), due, "BESCOM", "Utility"
      );

      const inv = await smartSettle.getInvoice(id);
      expect(inv.invoiceHash).to.equal(hash);
      expect(inv.payer).to.equal(user.address);
      expect(inv.provider).to.equal(provider.address);
      expect(inv.originalAmount).to.equal(toWei(100));
      expect(inv.dueDate).to.equal(due);
      expect(inv.providerName).to.equal("BESCOM");
      expect(inv.category).to.equal("Utility");
      expect(inv.status).to.equal(1); // REGISTERED
    });

    it("emits InvoiceRegistered event", async function () {
      const id  = makeInvoiceId();
      const due = (await time.latest()) + WEEK;

      await expect(
        smartSettle.connect(agent).registerInvoice(
          id, makeInvoiceHash(), user.address, provider.address, toWei(100), due, "BESCOM", "Utility"
        )
      ).to.emit(smartSettle, "InvoiceRegistered")
        .withArgs(id, user.address, provider.address, toWei(100), "BESCOM");
    });

    it("appends invoiceId to user's list", async function () {
      const id  = makeInvoiceId();
      const due = (await time.latest()) + WEEK;

      await smartSettle.connect(agent).registerInvoice(
        id, makeInvoiceHash(), user.address, provider.address, toWei(100), due, "BESCOM", "Utility"
      );

      const ids = await smartSettle.getUserInvoices(user.address);
      expect(ids).to.include(id);
    });

    it("reverts if caller is not agent", async function () {
      const due = (await time.latest()) + WEEK;
      await expect(
        smartSettle.connect(user).registerInvoice(
          makeInvoiceId(), makeInvoiceHash(), user.address, provider.address, toWei(100), due, "X", "Y"
        )
      ).to.be.revertedWith("SmartSettle: caller is not agent");
    });

    it("reverts if invoice already registered", async function () {
      const id  = makeInvoiceId();
      const due = (await time.latest()) + WEEK;
      await smartSettle.connect(agent).registerInvoice(
        id, makeInvoiceHash(), user.address, provider.address, toWei(100), due, "X", "Y"
      );
      await expect(
        smartSettle.connect(agent).registerInvoice(
          id, makeInvoiceHash(), user.address, provider.address, toWei(100), due, "X", "Y"
        )
      ).to.be.revertedWith("SmartSettle: invoice already registered");
    });

    it("reverts if due date is in the past", async function () {
      const pastDue = (await time.latest()) - 1;
      await expect(
        smartSettle.connect(agent).registerInvoice(
          makeInvoiceId(), makeInvoiceHash(), user.address, provider.address, toWei(100), pastDue, "X", "Y"
        )
      ).to.be.revertedWith("SmartSettle: due date in past");
    });

    it("reverts if amount is zero", async function () {
      const due = (await time.latest()) + WEEK;
      await expect(
        smartSettle.connect(agent).registerInvoice(
          makeInvoiceId(), makeInvoiceHash(), user.address, provider.address, 0, due, "X", "Y"
        )
      ).to.be.revertedWith("SmartSettle: zero amount");
    });

    it("reverts if amount exceeds maxPaymentAmount", async function () {
      const due = (await time.latest()) + WEEK;
      await expect(
        smartSettle.connect(agent).registerInvoice(
          makeInvoiceId(), makeInvoiceHash(), user.address, provider.address, toWei(501), due, "X", "Y"
        )
      ).to.be.revertedWith("SmartSettle: exceeds max payment");
    });

    it("reverts if payer is zero address", async function () {
      const due = (await time.latest()) + WEEK;
      await expect(
        smartSettle.connect(agent).registerInvoice(
          makeInvoiceId(), makeInvoiceHash(), ethers.ZeroAddress, provider.address, toWei(100), due, "X", "Y"
        )
      ).to.be.revertedWith("SmartSettle: zero payer");
    });
  });

  // ── recordNegotiatedOffer ───────────────────────────────────────────────────
  describe("recordNegotiatedOffer()", function () {
    let invoiceId;

    beforeEach(async function () {
      invoiceId = makeInvoiceId();
      const due = (await time.latest()) + WEEK;
      await smartSettle.connect(agent).registerInvoice(
        invoiceId, makeInvoiceHash(), user.address, provider.address, toWei(100), due, "BESCOM", "Utility"
      );
    });

    it("records offer and sets status to NEGOTIATED", async function () {
      await smartSettle.connect(agent).recordNegotiatedOffer(invoiceId, toWei(92), "Loyalty 8%");
      const inv = await smartSettle.getInvoice(invoiceId);
      expect(inv.negotiatedAmount).to.equal(toWei(92));
      expect(inv.status).to.equal(2); // NEGOTIATED
    });

    it("emits OfferAccepted with correct savings", async function () {
      await expect(
        smartSettle.connect(agent).recordNegotiatedOffer(invoiceId, toWei(92), "Loyalty 8%")
      ).to.emit(smartSettle, "OfferAccepted")
        .withArgs(invoiceId, toWei(92), toWei(8), "Loyalty 8%");
    });

    it("reverts if not agent", async function () {
      await expect(
        smartSettle.connect(user).recordNegotiatedOffer(invoiceId, toWei(92), "X")
      ).to.be.revertedWith("SmartSettle: caller is not agent");
    });

    it("reverts if invoice not in REGISTERED state", async function () {
      await smartSettle.connect(agent).recordNegotiatedOffer(invoiceId, toWei(92), "8%");
      await expect(
        smartSettle.connect(agent).recordNegotiatedOffer(invoiceId, toWei(90), "10%")
      ).to.be.revertedWith("SmartSettle: invoice not in REGISTERED state");
    });

    it("reverts if negotiatedAmount exceeds original", async function () {
      await expect(
        smartSettle.connect(agent).recordNegotiatedOffer(invoiceId, toWei(101), "X")
      ).to.be.revertedWith("SmartSettle: negotiated exceeds original");
    });

    it("reverts if negotiatedAmount is zero", async function () {
      await expect(
        smartSettle.connect(agent).recordNegotiatedOffer(invoiceId, 0, "X")
      ).to.be.revertedWith("SmartSettle: zero negotiated amount");
    });
  });

  // ── executePayment ──────────────────────────────────────────────────────────
  describe("executePayment()", function () {
    let invoiceId;

    beforeEach(async function () {
      invoiceId = makeInvoiceId();
      const due = (await time.latest()) + WEEK;
      await smartSettle.connect(agent).registerInvoice(
        invoiceId, makeInvoiceHash(), user.address, provider.address, toWei(100), due, "BESCOM", "Utility"
      );
      await smartSettle.connect(agent).recordNegotiatedOffer(invoiceId, toWei(92), "Loyalty 8%");
    });

    it("transfers cUSD from user to provider", async function () {
      const providerBefore = await mockCUSD.balanceOf(provider.address);
      const userBefore     = await mockCUSD.balanceOf(user.address);

      await smartSettle.connect(agent).executePayment(invoiceId);

      expect(await mockCUSD.balanceOf(provider.address)).to.equal(providerBefore + toWei(92));
      expect(await mockCUSD.balanceOf(user.address)).to.equal(userBefore - toWei(92));
    });

    it("sets invoice status to PAID and records paidAt", async function () {
      await smartSettle.connect(agent).executePayment(invoiceId);
      const inv = await smartSettle.getInvoice(invoiceId);
      expect(inv.status).to.equal(3); // PAID
      expect(inv.paidAt).to.be.gt(0);
    });

    it("increments totalSaved and totalPayments", async function () {
      await smartSettle.connect(agent).executePayment(invoiceId);
      expect(await smartSettle.totalSaved()).to.equal(toWei(8));
      expect(await smartSettle.totalPayments()).to.equal(1);
    });

    it("emits PaymentExecuted with correct fields", async function () {
      const tx = await smartSettle.connect(agent).executePayment(invoiceId);
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        l => l.fragment && l.fragment.name === "PaymentExecuted"
      );
      expect(event).to.not.be.undefined;
      expect(event.args.amountPaid).to.equal(toWei(92));
      expect(event.args.amountSaved).to.equal(toWei(8));
    });

    it("stores receipt in ReceiptStore", async function () {
      await smartSettle.connect(agent).executePayment(invoiceId);
      const receiptData = await receiptStore.getReceiptByInvoice(invoiceId);
      expect(receiptData.paidAmount).to.equal(toWei(92));
      expect(receiptData.savedAmount).to.equal(toWei(8));
      expect(receiptData.payer).to.equal(user.address);
      expect(receiptData.provider).to.equal(provider.address);
    });

    it("reverts if invoice not in NEGOTIATED state", async function () {
      const id2 = makeInvoiceId();
      const due = (await time.latest()) + WEEK;
      await smartSettle.connect(agent).registerInvoice(
        id2, makeInvoiceHash(), user.address, provider.address, toWei(50), due, "X", "Y"
      );
      await expect(
        smartSettle.connect(agent).executePayment(id2)
      ).to.be.revertedWith("SmartSettle: invoice not negotiated");
    });

    it("reverts if called twice (already PAID)", async function () {
      await smartSettle.connect(agent).executePayment(invoiceId);
      await expect(
        smartSettle.connect(agent).executePayment(invoiceId)
      ).to.be.revertedWith("SmartSettle: invoice not negotiated");
    });

    it("reverts if payer has no cUSD allowance", async function () {
      // Revoke user's approval
      await mockCUSD.connect(user).approve(await smartSettle.getAddress(), 0);
      await expect(
        smartSettle.connect(agent).executePayment(invoiceId)
      ).to.be.reverted;
    });

    it("reverts if not agent", async function () {
      await expect(
        smartSettle.connect(user).executePayment(invoiceId)
      ).to.be.revertedWith("SmartSettle: caller is not agent");
    });
  });

  // ── cancelInvoice ───────────────────────────────────────────────────────────
  describe("cancelInvoice()", function () {
    let invoiceId;

    beforeEach(async function () {
      invoiceId = makeInvoiceId();
      const due = (await time.latest()) + WEEK;
      await smartSettle.connect(agent).registerInvoice(
        invoiceId, makeInvoiceHash(), user.address, provider.address, toWei(100), due, "X", "Y"
      );
    });

    it("sets status to CANCELLED and emits event", async function () {
      await expect(
        smartSettle.connect(agent).cancelInvoice(invoiceId, "provider unresponsive")
      ).to.emit(smartSettle, "InvoiceCancelled").withArgs(invoiceId, "provider unresponsive");

      const inv = await smartSettle.getInvoice(invoiceId);
      expect(inv.status).to.equal(4); // CANCELLED
    });

    it("reverts if already cancelled", async function () {
      await smartSettle.connect(agent).cancelInvoice(invoiceId, "first");
      await expect(
        smartSettle.connect(agent).cancelInvoice(invoiceId, "second")
      ).to.be.revertedWith("SmartSettle: already cancelled");
    });

    it("reverts if invoice is already PAID", async function () {
      await smartSettle.connect(agent).recordNegotiatedOffer(invoiceId, toWei(92), "8%");
      await smartSettle.connect(agent).executePayment(invoiceId);
      await expect(
        smartSettle.connect(agent).cancelInvoice(invoiceId, "too late")
      ).to.be.revertedWith("SmartSettle: cannot cancel paid invoice");
    });
  });

  // ── Admin ────────────────────────────────────────────────────────────────────
  describe("Admin functions", function () {
    it("owner can rotate agent wallet", async function () {
      const [,,, , newAgent] = await ethers.getSigners();
      await expect(smartSettle.connect(owner).setAgentWallet(newAgent.address))
        .to.emit(smartSettle, "AgentWalletUpdated")
        .withArgs(agent.address, newAgent.address);
      expect(await smartSettle.agentWallet()).to.equal(newAgent.address);
    });

    it("non-owner cannot rotate agent wallet", async function () {
      const [,,, , newAgent] = await ethers.getSigners();
      await expect(
        smartSettle.connect(agent).setAgentWallet(newAgent.address)
      ).to.be.reverted;
    });

    it("owner can update maxPaymentAmount", async function () {
      await expect(smartSettle.connect(owner).setMaxPaymentAmount(toWei(1000)))
        .to.emit(smartSettle, "MaxPaymentUpdated")
        .withArgs(MAX_PAYMENT, toWei(1000));
      expect(await smartSettle.maxPaymentAmount()).to.equal(toWei(1000));
    });

    it("reverts setMaxPaymentAmount with zero", async function () {
      await expect(
        smartSettle.connect(owner).setMaxPaymentAmount(0)
      ).to.be.revertedWith("SmartSettle: zero max payment");
    });
  });

  // ── View functions ───────────────────────────────────────────────────────────
  describe("View functions", function () {
    it("checkAllowance returns payer's allowance for SmartSettle", async function () {
      const allowance = await smartSettle.checkAllowance(user.address);
      expect(allowance).to.equal(toWei(10_000));
    });

    it("getInvoice returns empty invoice for unknown id", async function () {
      const inv = await smartSettle.getInvoice(makeInvoiceId());
      expect(inv.status).to.equal(0); // NONE
    });
  });

  // ── Full flow integration ────────────────────────────────────────────────────
  describe("Full flow", function () {
    it("register → negotiate → pay → receipt stored with correct savings", async function () {
      const invoiceId = makeInvoiceId();
      const due = (await time.latest()) + WEEK;

      // 1. Register
      await smartSettle.connect(agent).registerInvoice(
        invoiceId, makeInvoiceHash(), user.address, provider.address,
        toWei(200), due, "Airtel", "Internet"
      );

      // 2. Negotiate (10% discount)
      await smartSettle.connect(agent).recordNegotiatedOffer(invoiceId, toWei(180), "Early Payment 10%");

      // 3. Pay
      await smartSettle.connect(agent).executePayment(invoiceId);

      // 4. Verify on-chain receipt
      const receipt = await receiptStore.getReceiptByInvoice(invoiceId);
      expect(receipt.originalAmount).to.equal(toWei(200));
      expect(receipt.paidAmount).to.equal(toWei(180));
      expect(receipt.savedAmount).to.equal(toWei(20));
      expect(receipt.providerName).to.equal("Airtel");
      expect(receipt.category).to.equal("Internet");

      // 5. Verify global stats
      expect(await smartSettle.totalSaved()).to.equal(toWei(20));
      expect(await smartSettle.totalPayments()).to.equal(1);
    });
  });
});
