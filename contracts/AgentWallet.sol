// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AgentWallet
 * @notice Controlled wallet for the SmartSettle AI agent.
 *         Enforces per-transaction and daily spend limits on cUSD payments.
 *         The owner (multisig) can rotate the agent key and adjust limits.
 * @dev    This contract holds cUSD on behalf of users who have deposited funds.
 *         The agent can only spend up to configured limits per tx and per day.
 */
contract AgentWallet is Ownable, ReentrancyGuard {

    // ── State ─────────────────────────────────────────────────────────────────

    IERC20 public immutable cUSD;

    /// @notice Address of the AI agent authorized to call spend functions
    address public agent;

    /// @notice Maximum cUSD per single payment (18 decimals)
    uint256 public maxPerTransaction;

    /// @notice Maximum cUSD the agent can spend in a 24-hour window
    uint256 public maxDailySpend;

    /// @notice cUSD spent in current day window
    uint256 public dailySpent;

    /// @notice Start of current 24-hour spend window
    uint256 public windowStart;

    /// @notice Address of the authorized SmartSettle contract
    address public smartSettle;

    /// @dev user address → deposited cUSD balance
    mapping(address => uint256) public balances;

    /// @dev total cUSD held across all users
    uint256 public totalDeposited;

    // ── Events ────────────────────────────────────────────────────────────────

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event SpendExecuted(address indexed to, uint256 amount, bytes32 indexed invoiceId);
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);
    event LimitsUpdated(uint256 maxPerTx, uint256 maxDaily);
    event SmartSettleSet(address indexed smartSettle);
    event DailyWindowReset(uint256 newWindowStart);

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyAgent() {
        require(msg.sender == agent, "AgentWallet: caller is not agent");
        _;
    }

    modifier onlySmartSettle() {
        require(msg.sender == smartSettle, "AgentWallet: caller is not SmartSettle");
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _cUSD             cUSD token address on Celo
     * @param _agent            Initial AI agent signing address
     * @param _maxPerTransaction Max cUSD per single payment (18 decimals)
     * @param _maxDailySpend    Max cUSD in any 24hr window (18 decimals)
     */
    constructor(
        address _cUSD,
        address _agent,
        uint256 _maxPerTransaction,
        uint256 _maxDailySpend
    ) Ownable(msg.sender) {
        require(_cUSD  != address(0), "AgentWallet: zero cUSD");
        require(_agent != address(0), "AgentWallet: zero agent");
        require(_maxPerTransaction > 0,              "AgentWallet: zero per-tx limit");
        require(_maxDailySpend >= _maxPerTransaction, "AgentWallet: daily < per-tx");

        cUSD               = IERC20(_cUSD);
        agent              = _agent;
        maxPerTransaction  = _maxPerTransaction;
        maxDailySpend      = _maxDailySpend;
        windowStart        = block.timestamp;
    }

    // ── User Functions ────────────────────────────────────────────────────────

    /**
     * @notice Deposit cUSD into the agent wallet for autonomous bill payments.
     * @dev    User must approve this contract for `amount` cUSD first.
     * @param  amount Amount of cUSD to deposit (18 decimals)
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "AgentWallet: zero deposit");

        // Effects
        balances[msg.sender] += amount;
        totalDeposited       += amount;

        // Interaction
        bool success = cUSD.transferFrom(msg.sender, address(this), amount);
        require(success, "AgentWallet: deposit transfer failed");

        emit Deposited(msg.sender, amount);
    }

    /**
     * @notice Withdraw unspent cUSD from the agent wallet.
     * @param  amount Amount to withdraw (must be ≤ user's balance)
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0,                   "AgentWallet: zero withdrawal");
        require(balances[msg.sender] >= amount, "AgentWallet: insufficient balance");

        // Effects
        balances[msg.sender] -= amount;
        totalDeposited       -= amount;

        // Interaction
        bool success = cUSD.transfer(msg.sender, amount);
        require(success, "AgentWallet: withdrawal failed");

        emit Withdrawn(msg.sender, amount);
    }

    // ── Agent Functions ───────────────────────────────────────────────────────

    /**
     * @notice Execute a payment from a user's balance to a provider.
     * @dev    Called by SmartSettle.executePayment() which has already
     *         validated the invoice state. Enforces per-tx and daily limits.
     * @param  from       User whose balance is debited
     * @param  to         Provider receiving payment
     * @param  amount     cUSD amount to transfer
     * @param  invoiceId  Invoice reference for event logging
     */
    function spend(
        address from,
        address to,
        uint256 amount,
        bytes32 invoiceId
    ) external onlySmartSettle nonReentrant {
        require(to != address(0),           "AgentWallet: zero recipient");
        require(amount > 0,                 "AgentWallet: zero amount");
        require(amount <= maxPerTransaction, "AgentWallet: exceeds per-tx limit");
        require(balances[from] >= amount,   "AgentWallet: insufficient user balance");

        // Reset daily window if 24h have passed
        _maybeResetDailyWindow();

        require(dailySpent + amount <= maxDailySpend, "AgentWallet: daily limit exceeded");

        // Effects
        balances[from] -= amount;
        totalDeposited -= amount;
        dailySpent     += amount;

        // Interaction
        bool success = cUSD.transfer(to, amount);
        require(success, "AgentWallet: payment transfer failed");

        emit SpendExecuted(to, amount, invoiceId);
    }

    // ── View Functions ────────────────────────────────────────────────────────

    /// @notice Get cUSD balance for a specific user
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    /// @notice Remaining daily spend capacity for the agent
    function remainingDailyCapacity() external view returns (uint256) {
        if (block.timestamp >= windowStart + 1 days) return maxDailySpend;
        return maxDailySpend > dailySpent ? maxDailySpend - dailySpent : 0;
    }

    /// @notice cUSD balance held by this contract
    function contractBalance() external view returns (uint256) {
        return cUSD.balanceOf(address(this));
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    function _maybeResetDailyWindow() internal {
        if (block.timestamp >= windowStart + 1 days) {
            dailySpent  = 0;
            windowStart = block.timestamp;
            emit DailyWindowReset(windowStart);
        }
    }

    // ── Admin Functions ───────────────────────────────────────────────────────

    /// @notice Rotate the AI agent signing address
    function setAgent(address newAgent) external onlyOwner {
        require(newAgent != address(0), "AgentWallet: zero agent");
        emit AgentUpdated(agent, newAgent);
        agent = newAgent;
    }

    /// @notice Update spend limits
    function setLimits(uint256 newMaxPerTx, uint256 newMaxDaily) external onlyOwner {
        require(newMaxPerTx > 0,         "AgentWallet: zero per-tx limit");
        require(newMaxDaily >= newMaxPerTx, "AgentWallet: daily < per-tx");
        maxPerTransaction = newMaxPerTx;
        maxDailySpend     = newMaxDaily;
        emit LimitsUpdated(newMaxPerTx, newMaxDaily);
    }

    /// @notice Set the authorized SmartSettle contract
    function setSmartSettle(address _smartSettle) external onlyOwner {
        require(_smartSettle != address(0), "AgentWallet: zero SmartSettle");
        smartSettle = _smartSettle;
        emit SmartSettleSet(_smartSettle);
    }

    /// @notice Emergency: owner can pause by rotating agent to zero (then set new one)
    function emergencyRevokeAgent() external onlyOwner {
        emit AgentUpdated(agent, address(0));
        agent = address(0);
    }
}
