const { expect }  = require("chai");
const { ethers }  = require("hardhat");
const { time }    = require("@nomicfoundation/hardhat-network-helpers");

const toWei   = (n) => ethers.parseUnits(String(n), 18);
const ONE_DAY = 24 * 60 * 60;

// ─────────────────────────────────────────────────────────────────────────────
describe("AgentWallet", function () {
  let agentWallet, mockCUSD;
  let owner, agent, smartSettle, user, recipient, stranger;

  const MAX_PER_TX  = toWei(500);
  const MAX_DAILY   = toWei(2000);

  beforeEach(async function () {
    [owner, agent, smartSettle, user, recipient, stranger] = await ethers.getSigners();

    const MockCUSD    = await ethers.getContractFactory("MockCUSD");
    const AgentWallet = await ethers.getContractFactory("AgentWallet");

    mockCUSD    = await MockCUSD.deploy();
    agentWallet = await AgentWallet.deploy(
      await mockCUSD.getAddress(),
      agent.address,
      MAX_PER_TX,
      MAX_DAILY
    );

    // Wire SmartSettle
    await agentWallet.connect(owner).setSmartSettle(smartSettle.address);

    // Fund user and approve AgentWallet for deposits
    await mockCUSD.mint(user.address, toWei(10_000));
    await mockCUSD.connect(user).approve(await agentWallet.getAddress(), toWei(10_000));
  });

  // ── Deployment ──────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("sets cUSD, agent, and limits correctly", async function () {
      expect(await agentWallet.cUSD()).to.equal(await mockCUSD.getAddress());
      expect(await agentWallet.agent()).to.equal(agent.address);
      expect(await agentWallet.maxPerTransaction()).to.equal(MAX_PER_TX);
      expect(await agentWallet.maxDailySpend()).to.equal(MAX_DAILY);
    });

    it("reverts if daily limit < per-tx limit", async function () {
      const AgentWallet = await ethers.getContractFactory("AgentWallet");
      await expect(
        AgentWallet.deploy(await mockCUSD.getAddress(), agent.address, toWei(500), toWei(100))
      ).to.be.revertedWith("AgentWallet: daily < per-tx");
    });

    it("reverts on zero cUSD address", async function () {
      const AgentWallet = await ethers.getContractFactory("AgentWallet");
      await expect(
        AgentWallet.deploy(ethers.ZeroAddress, agent.address, MAX_PER_TX, MAX_DAILY)
      ).to.be.revertedWith("AgentWallet: zero cUSD");
    });

    it("reverts on zero agent address", async function () {
      const AgentWallet = await ethers.getContractFactory("AgentWallet");
      await expect(
        AgentWallet.deploy(await mockCUSD.getAddress(), ethers.ZeroAddress, MAX_PER_TX, MAX_DAILY)
      ).to.be.revertedWith("AgentWallet: zero agent");
    });
  });

  // ── deposit ─────────────────────────────────────────────────────────────────
  describe("deposit()", function () {
    it("credits user balance and emits Deposited", async function () {
      await expect(agentWallet.connect(user).deposit(toWei(1000)))
        .to.emit(agentWallet, "Deposited")
        .withArgs(user.address, toWei(1000));

      expect(await agentWallet.getBalance(user.address)).to.equal(toWei(1000));
      expect(await agentWallet.totalDeposited()).to.equal(toWei(1000));
    });

    it("transfers cUSD into the contract", async function () {
      await agentWallet.connect(user).deposit(toWei(1000));
      expect(await agentWallet.contractBalance()).to.equal(toWei(1000));
    });

    it("reverts on zero deposit", async function () {
      await expect(agentWallet.connect(user).deposit(0))
        .to.be.revertedWith("AgentWallet: zero deposit");
    });
  });

  // ── withdraw ────────────────────────────────────────────────────────────────
  describe("withdraw()", function () {
    beforeEach(async function () {
      await agentWallet.connect(user).deposit(toWei(1000));
    });

    it("returns cUSD to user and emits Withdrawn", async function () {
      const before = await mockCUSD.balanceOf(user.address);
      await expect(agentWallet.connect(user).withdraw(toWei(500)))
        .to.emit(agentWallet, "Withdrawn")
        .withArgs(user.address, toWei(500));
      expect(await mockCUSD.balanceOf(user.address)).to.equal(before + toWei(500));
    });

    it("decrements balance and totalDeposited", async function () {
      await agentWallet.connect(user).withdraw(toWei(400));
      expect(await agentWallet.getBalance(user.address)).to.equal(toWei(600));
      expect(await agentWallet.totalDeposited()).to.equal(toWei(600));
    });

    it("reverts on zero withdrawal", async function () {
      await expect(agentWallet.connect(user).withdraw(0))
        .to.be.revertedWith("AgentWallet: zero withdrawal");
    });

    it("reverts if withdrawal exceeds balance", async function () {
      await expect(agentWallet.connect(user).withdraw(toWei(1001)))
        .to.be.revertedWith("AgentWallet: insufficient balance");
    });
  });

  // ── spend ───────────────────────────────────────────────────────────────────
  describe("spend()", function () {
    const invoiceId = ethers.keccak256(ethers.toUtf8Bytes("inv-001"));

    beforeEach(async function () {
      await agentWallet.connect(user).deposit(toWei(2000));
    });

    it("transfers cUSD to recipient and emits SpendExecuted", async function () {
      const before = await mockCUSD.balanceOf(recipient.address);
      await expect(
        agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(100), invoiceId)
      ).to.emit(agentWallet, "SpendExecuted")
        .withArgs(recipient.address, toWei(100), invoiceId);
      expect(await mockCUSD.balanceOf(recipient.address)).to.equal(before + toWei(100));
    });

    it("debits user balance and updates dailySpent", async function () {
      await agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(100), invoiceId);
      expect(await agentWallet.getBalance(user.address)).to.equal(toWei(1900));
      expect(await agentWallet.dailySpent()).to.equal(toWei(100));
    });

    it("only SmartSettle can call spend", async function () {
      await expect(
        agentWallet.connect(stranger).spend(user.address, recipient.address, toWei(100), invoiceId)
      ).to.be.revertedWith("AgentWallet: caller is not SmartSettle");
    });

    it("reverts if amount exceeds per-tx limit", async function () {
      await expect(
        agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(501), invoiceId)
      ).to.be.revertedWith("AgentWallet: exceeds per-tx limit");
    });

    it("reverts if user has insufficient balance", async function () {
      await agentWallet.connect(user).withdraw(toWei(2000)); // drain
      await expect(
        agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(100), invoiceId)
      ).to.be.revertedWith("AgentWallet: insufficient user balance");
    });

    it("reverts if daily limit would be exceeded", async function () {
      // Top up so balance > daily limit (2000), allowing us to hit the cap
      await mockCUSD.mint(user.address, toWei(1000));
      await mockCUSD.connect(user).approve(await agentWallet.getAddress(), toWei(1000));
      await agentWallet.connect(user).deposit(toWei(1000)); // total deposited: 3000

      const id2 = ethers.keccak256(ethers.toUtf8Bytes("inv-002"));
      const id3 = ethers.keccak256(ethers.toUtf8Bytes("inv-003"));
      const id4 = ethers.keccak256(ethers.toUtf8Bytes("inv-004"));
      const id5 = ethers.keccak256(ethers.toUtf8Bytes("inv-005"));
      await agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(500), invoiceId);
      await agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(500), id2);
      await agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(500), id3);
      await agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(500), id4);
      // dailySpent = 2000 = maxDailySpend; this one pushes over
      await expect(
        agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(1), id5)
      ).to.be.revertedWith("AgentWallet: daily limit exceeded");
    });

    it("resets daily window after 24 hours", async function () {
      // Fill today's limit
      const id2 = ethers.keccak256(ethers.toUtf8Bytes("inv-002"));
      const id3 = ethers.keccak256(ethers.toUtf8Bytes("inv-003"));
      const id4 = ethers.keccak256(ethers.toUtf8Bytes("inv-004"));
      await agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(500), invoiceId);
      await agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(500), id2);
      await agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(500), id3);
      await agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(500), id4);

      // Advance 24 hours
      await time.increase(ONE_DAY + 1);
      await mockCUSD.mint(user.address, toWei(1000));
      await mockCUSD.connect(user).approve(await agentWallet.getAddress(), toWei(1000));
      await agentWallet.connect(user).deposit(toWei(1000));

      // Should succeed now — window reset
      const id5 = ethers.keccak256(ethers.toUtf8Bytes("inv-005"));
      await expect(
        agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(100), id5)
      ).to.emit(agentWallet, "DailyWindowReset");

      expect(await agentWallet.dailySpent()).to.equal(toWei(100));
    });

    it("reverts for zero recipient", async function () {
      await expect(
        agentWallet.connect(smartSettle).spend(user.address, ethers.ZeroAddress, toWei(100), invoiceId)
      ).to.be.revertedWith("AgentWallet: zero recipient");
    });
  });

  // ── remainingDailyCapacity ───────────────────────────────────────────────────
  describe("remainingDailyCapacity()", function () {
    const invoiceId = ethers.keccak256(ethers.toUtf8Bytes("inv-001"));

    it("starts at maxDailySpend", async function () {
      expect(await agentWallet.remainingDailyCapacity()).to.equal(MAX_DAILY);
    });

    it("decreases after a spend", async function () {
      await agentWallet.connect(user).deposit(toWei(500));
      await agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(200), invoiceId);
      expect(await agentWallet.remainingDailyCapacity()).to.equal(toWei(1800));
    });

    it("returns maxDailySpend after window resets", async function () {
      await agentWallet.connect(user).deposit(toWei(500));
      await agentWallet.connect(smartSettle).spend(user.address, recipient.address, toWei(200), invoiceId);
      await time.increase(ONE_DAY + 1);
      expect(await agentWallet.remainingDailyCapacity()).to.equal(MAX_DAILY);
    });
  });

  // ── Admin ───────────────────────────────────────────────────────────────────
  describe("Admin functions", function () {
    it("owner can rotate agent address", async function () {
      const [,,,,,, newAgent] = await ethers.getSigners();
      await expect(agentWallet.connect(owner).setAgent(newAgent.address))
        .to.emit(agentWallet, "AgentUpdated")
        .withArgs(agent.address, newAgent.address);
      expect(await agentWallet.agent()).to.equal(newAgent.address);
    });

    it("owner can update spend limits", async function () {
      await expect(agentWallet.connect(owner).setLimits(toWei(1000), toWei(5000)))
        .to.emit(agentWallet, "LimitsUpdated")
        .withArgs(toWei(1000), toWei(5000));
      expect(await agentWallet.maxPerTransaction()).to.equal(toWei(1000));
      expect(await agentWallet.maxDailySpend()).to.equal(toWei(5000));
    });

    it("setLimits reverts if daily < per-tx", async function () {
      await expect(
        agentWallet.connect(owner).setLimits(toWei(1000), toWei(500))
      ).to.be.revertedWith("AgentWallet: daily < per-tx");
    });

    it("emergencyRevokeAgent sets agent to zero", async function () {
      await agentWallet.connect(owner).emergencyRevokeAgent();
      expect(await agentWallet.agent()).to.equal(ethers.ZeroAddress);
    });

    it("non-owner cannot call setAgent", async function () {
      await expect(
        agentWallet.connect(stranger).setAgent(stranger.address)
      ).to.be.reverted;
    });

    it("non-owner cannot call setSmartSettle", async function () {
      await expect(
        agentWallet.connect(stranger).setSmartSettle(stranger.address)
      ).to.be.reverted;
    });
  });
});
