// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockProvider
 * @notice Simulates a service provider (e.g. electricity company) for local tests.
 *         Accepts cUSD payments and emits events so tests can verify payment flow.
 * @dev    NOT for production. Deploy only on local Hardhat network or Alfajores testnet.
 */
contract MockProvider {

    IERC20 public immutable cUSD;
    string public name;

    // Configurable discount rate for testing (basis points, e.g. 800 = 8%)
    uint256 public discountBps;

    event PaymentReceived(address indexed from, uint256 amount, bytes32 invoiceRef);
    event DiscountOffered(bytes32 indexed invoiceId, uint256 originalAmount, uint256 discountedAmount, string label);

    constructor(address _cUSD, string memory _name, uint256 _discountBps) {
        require(_cUSD != address(0), "MockProvider: zero cUSD");
        cUSD        = IERC20(_cUSD);
        name        = _name;
        discountBps = _discountBps;
    }

    /**
     * @notice Simulate the provider offering a discount (called by agent in tests)
     * @param invoiceId      Invoice being negotiated
     * @param originalAmount Original bill amount
     * @return discountedAmount Amount after applying discountBps
     * @return label           Human-readable discount description
     */
    function offerDiscount(bytes32 invoiceId, uint256 originalAmount)
        external
        returns (uint256 discountedAmount, string memory label)
    {
        discountedAmount = originalAmount - (originalAmount * discountBps / 10_000);
        label = string(abi.encodePacked("Mock discount ", _bpsToString(discountBps), "%"));
        emit DiscountOffered(invoiceId, originalAmount, discountedAmount, label);
    }

    /**
     * @notice Accept a payment from SmartSettle
     */
    function receivePayment(bytes32 invoiceRef) external {
        // In real scenario, provider would call this after receiving cUSD
        // Here we just emit the event for test assertions
        emit PaymentReceived(msg.sender, 0, invoiceRef);
    }

    /**
     * @notice Set a new discount rate (for parameterized tests)
     */
    function setDiscountBps(uint256 newBps) external {
        require(newBps <= 5000, "MockProvider: discount > 50%"); // sanity check
        discountBps = newBps;
    }

    /**
     * @notice Check cUSD balance received by this provider
     */
    function getBalance() external view returns (uint256) {
        return cUSD.balanceOf(address(this));
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    function _bpsToString(uint256 bps) internal pure returns (string memory) {
        uint256 pct = bps / 100;
        if (pct == 0)  return "0";
        if (pct == 5)  return "5";
        if (pct == 8)  return "8";
        if (pct == 10) return "10";
        return "X"; // fallback for other values
    }
}
