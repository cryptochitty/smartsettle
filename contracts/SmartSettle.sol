// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ReceiptStore.sol";

/**
 * @title SmartSettle
 * @notice Autonomous bill negotiation and payment vault on Celo.
 *         The AI agent registers invoices, records negotiated offers,
 *         executes cUSD payments, and triggers on-chain receipt storage.
 * @dev    Follows Checks-Effects-Interactions pattern throughout.
 *         All payment flows require prior ERC20 approval from the payer.
 */
contract SmartSettle is ReentrancyGuard, Ownable {

    // ── State variables ──────────────────────────────────────────────────────

    /// @notice Celo Dollar stablecoin used for all payments
    IERC20 public immutable cUSD;

    /// @notice On-chain receipt storage contract
    ReceiptStore public immutable receiptStore;

    /// @notice Address of the authorized AI agent wallet
    address public agentWallet;

    /// @notice Maximum single payment amount in cUSD (18 decimals)
    uint256 public maxPaymentAmount;

    /// @dev Invoice status tracking
    enum InvoiceStatus { NONE, REGISTERED, NEGOTIATED, PAID, CANCELLED }

    struct Invoice {
        bytes32   invoiceHash;      // keccak256 of original invoice data
        address   provider;         // service provider address
        address   payer;            // user who owes the bill
        uint256   originalAmount;   // amount before negotiation (18 decimals)
        uint256   negotiatedAmount; // final agreed payment amount (0 until negotiated)
        uint256   dueDate;          // Unix timestamp
        uint256   registeredAt;     // block.timestamp at registration
        uint256   paidAt;           // block.timestamp at payment (0 until paid)
        InvoiceStatus status;
        string    providerName;     // human-readable provider (e.g. "BESCOM")
        string    category;         // "Utility", "Internet", "SaaS", etc.
    }

    /// @dev invoiceId → Invoice
    mapping(bytes32 => Invoice) public invoices;

    /// @dev payer address → list of their invoice IDs
    mapping(address => bytes32[]) public userInvoices;

    /// @dev total cUSD saved across all negotiations
    uint256 public totalSaved;

    /// @dev total payments executed
    uint256 public totalPayments;

    // ── Events ───────────────────────────────────────────────────────────────

    event InvoiceRegistered(
        bytes32 indexed invoiceId,
        address indexed payer,
        address indexed provider,
        uint256 originalAmount,
        string  providerName
    );

    event OfferAccepted(
        bytes32 indexed invoiceId,
        uint256 negotiatedAmount,
        uint256 savings,
        string  discountLabel
    );

    event PaymentExecuted(
        bytes32 indexed invoiceId,
        address indexed payer,
        address indexed provider,
        uint256 amountPaid,
        uint256 amountSaved,
        bytes32 receiptId
    );

    event InvoiceCancelled(bytes32 indexed invoiceId, string reason);
    event AgentWalletUpdated(address indexed oldAgent, address indexed newAgent);
    event MaxPaymentUpdated(uint256 oldMax, uint256 newMax);

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyAgent() {
        require(msg.sender == agentWallet, "SmartSettle: caller is not agent");
        _;
    }

    modifier invoiceExists(bytes32 invoiceId) {
        require(invoices[invoiceId].status != InvoiceStatus.NONE, "SmartSettle: invoice not found");
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    /**
     * @param _cUSD             Address of the cUSD ERC20 token on Celo
     * @param _receiptStore     Address of the deployed ReceiptStore contract
     * @param _agentWallet      Address of the AI agent's signing wallet
     * @param _maxPaymentAmount Maximum single payment in cUSD (with 18 decimals)
     */
    constructor(
        address _cUSD,
        address _receiptStore,
        address _agentWallet,
        uint256 _maxPaymentAmount
    ) Ownable(msg.sender) {
        require(_cUSD != address(0),         "SmartSettle: zero cUSD address");
        require(_receiptStore != address(0), "SmartSettle: zero receiptStore");
        require(_agentWallet != address(0),  "SmartSettle: zero agent address");
        require(_maxPaymentAmount > 0,       "SmartSettle: zero max payment");

        cUSD             = IERC20(_cUSD);
        receiptStore     = ReceiptStore(_receiptStore);
        agentWallet      = _agentWallet;
        maxPaymentAmount = _maxPaymentAmount;
    }

    // ── Agent Functions ───────────────────────────────────────────────────────

    /**
     * @notice Register a new invoice after AI parses the uploaded bill.
     * @param invoiceId      Unique identifier (generated off-chain by agent)
     * @param invoiceHash    keccak256 hash of the invoice file content
     * @param payer          Address of the user who will pay
     * @param provider       Address of the service provider
     * @param originalAmount Invoice face value in cUSD (18 decimals)
     * @param dueDate        Unix timestamp of payment due date
     * @param providerName   Human-readable provider name
     * @param category       Bill category string
     */
    function registerInvoice(
        bytes32 invoiceId,
        bytes32 invoiceHash,
        address payer,
        address provider,
        uint256 originalAmount,
        uint256 dueDate,
        string calldata providerName,
        string calldata category
    ) external onlyAgent {
        require(invoices[invoiceId].status == InvoiceStatus.NONE, "SmartSettle: invoice already registered");
        require(payer != address(0),       "SmartSettle: zero payer");
        require(provider != address(0),    "SmartSettle: zero provider");
        require(originalAmount > 0,        "SmartSettle: zero amount");
        require(dueDate > block.timestamp, "SmartSettle: due date in past");
        require(originalAmount <= maxPaymentAmount, "SmartSettle: exceeds max payment");

        invoices[invoiceId] = Invoice({
            invoiceHash:      invoiceHash,
            provider:         provider,
            payer:            payer,
            originalAmount:   originalAmount,
            negotiatedAmount: 0,
            dueDate:          dueDate,
            registeredAt:     block.timestamp,
            paidAt:           0,
            status:           InvoiceStatus.REGISTERED,
            providerName:     providerName,
            category:         category
        });

        userInvoices[payer].push(invoiceId);

        emit InvoiceRegistered(invoiceId, payer, provider, originalAmount, providerName);
    }

    /**
     * @notice Record the winning negotiated offer chosen by the decision engine.
     * @param invoiceId       The invoice being negotiated
     * @param negotiatedAmount Final agreed payment amount after discounts
     * @param discountLabel   Human-readable description e.g. "Loyalty 8% + fee waiver"
     */
    function recordNegotiatedOffer(
        bytes32 invoiceId,
        uint256 negotiatedAmount,
        string calldata discountLabel
    ) external onlyAgent invoiceExists(invoiceId) {
        Invoice storage inv = invoices[invoiceId];
        require(inv.status == InvoiceStatus.REGISTERED, "SmartSettle: invoice not in REGISTERED state");
        require(negotiatedAmount > 0,                    "SmartSettle: zero negotiated amount");
        require(negotiatedAmount <= inv.originalAmount,  "SmartSettle: negotiated exceeds original");

        inv.negotiatedAmount = negotiatedAmount;
        inv.status           = InvoiceStatus.NEGOTIATED;

        uint256 savings = inv.originalAmount - negotiatedAmount;
        emit OfferAccepted(invoiceId, negotiatedAmount, savings, discountLabel);
    }

    /**
     * @notice Execute the final cUSD payment to the provider.
     * @dev    Payer must have approved this contract for at least `negotiatedAmount` cUSD.
     *         Follows CEI: checks first, then update state, then transfer.
     * @param  invoiceId  The invoice to settle
     */
    function executePayment(bytes32 invoiceId)
        external
        onlyAgent
        nonReentrant
        invoiceExists(invoiceId)
    {
        Invoice storage inv = invoices[invoiceId];
        require(inv.status == InvoiceStatus.NEGOTIATED, "SmartSettle: invoice not negotiated");

        uint256 amount   = inv.negotiatedAmount;
        uint256 savings  = inv.originalAmount - amount;
        address payer    = inv.payer;
        address provider = inv.provider;

        // ── Effects ──────────────────────────────────────────────────────────
        inv.status = InvoiceStatus.PAID;
        inv.paidAt = block.timestamp;
        totalSaved    += savings;
        totalPayments += 1;

        // ── Interactions ──────────────────────────────────────────────────────
        // Transfer cUSD from payer → provider
        bool success = cUSD.transferFrom(payer, provider, amount);
        require(success, "SmartSettle: cUSD transfer failed");

        // Store immutable receipt on-chain
        bytes32 receiptId = receiptStore.storeReceipt(
            invoiceId,
            inv.invoiceHash,
            payer,
            provider,
            inv.originalAmount,
            amount,
            savings,
            inv.providerName,
            inv.category
        );

        emit PaymentExecuted(invoiceId, payer, provider, amount, savings, receiptId);
    }

    /**
     * @notice Cancel an unpaid invoice (e.g. provider unresponsive, user request).
     */
    function cancelInvoice(bytes32 invoiceId, string calldata reason)
        external
        onlyAgent
        invoiceExists(invoiceId)
    {
        Invoice storage inv = invoices[invoiceId];
        require(inv.status != InvoiceStatus.PAID,      "SmartSettle: cannot cancel paid invoice");
        require(inv.status != InvoiceStatus.CANCELLED, "SmartSettle: already cancelled");

        inv.status = InvoiceStatus.CANCELLED;
        emit InvoiceCancelled(invoiceId, reason);
    }

    // ── View Functions ────────────────────────────────────────────────────────

    /// @notice Get all invoice IDs for a user
    function getUserInvoices(address user) external view returns (bytes32[] memory) {
        return userInvoices[user];
    }

    /// @notice Get full invoice details
    function getInvoice(bytes32 invoiceId) external view returns (Invoice memory) {
        return invoices[invoiceId];
    }

    /// @notice Check cUSD allowance of a payer for this contract
    function checkAllowance(address payer) external view returns (uint256) {
        return cUSD.allowance(payer, address(this));
    }

    // ── Owner Admin ───────────────────────────────────────────────────────────

    /// @notice Rotate the agent wallet address
    function setAgentWallet(address newAgent) external onlyOwner {
        require(newAgent != address(0), "SmartSettle: zero agent address");
        emit AgentWalletUpdated(agentWallet, newAgent);
        agentWallet = newAgent;
    }

    /// @notice Update the maximum single payment limit
    function setMaxPaymentAmount(uint256 newMax) external onlyOwner {
        require(newMax > 0, "SmartSettle: zero max payment");
        emit MaxPaymentUpdated(maxPaymentAmount, newMax);
        maxPaymentAmount = newMax;
    }
}
