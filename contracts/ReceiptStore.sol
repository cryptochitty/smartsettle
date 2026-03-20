// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReceiptStore
 * @notice Immutable on-chain storage for SmartSettle payment receipts.
 *         Every settled invoice gets a permanent, tamper-proof record here.
 *         Users can verify their payment history without trusting any server.
 */
contract ReceiptStore is Ownable {

    // ── State ─────────────────────────────────────────────────────────────────

    /// @notice Address authorized to write receipts (SmartSettle contract)
    address public smartSettle;

    struct Receipt {
        bytes32 invoiceId;       // links back to SmartSettle invoice
        bytes32 invoiceHash;     // hash of original invoice file
        address payer;
        address provider;
        uint256 originalAmount;  // face value in cUSD (18 decimals)
        uint256 paidAmount;      // actual amount transferred
        uint256 savedAmount;     // originalAmount - paidAmount
        uint256 timestamp;       // block.timestamp of payment
        uint256 blockNumber;     // block number for easy lookup
        string  providerName;
        string  category;
    }

    /// @dev receiptId → Receipt
    mapping(bytes32 => Receipt) private _receipts;

    /// @dev invoiceId → receiptId (one receipt per invoice)
    mapping(bytes32 => bytes32) public invoiceToReceipt;

    /// @dev payer → list of receipt IDs
    mapping(address => bytes32[]) private _userReceipts;

    /// @dev total receipts stored
    uint256 public totalReceipts;

    // ── Events ────────────────────────────────────────────────────────────────

    event ReceiptStored(
        bytes32 indexed receiptId,
        bytes32 indexed invoiceId,
        address indexed payer,
        uint256 paidAmount,
        uint256 savedAmount
    );

    event SmartSettleUpdated(address indexed oldAddress, address indexed newAddress);

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlySmartSettle() {
        require(msg.sender == smartSettle, "ReceiptStore: caller is not SmartSettle");
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ── Write ─────────────────────────────────────────────────────────────────

    /**
     * @notice Store a payment receipt. Called by SmartSettle after cUSD transfer.
     * @dev    Receipt ID is deterministic from invoiceId + block data for auditability.
     * @return receiptId The unique receipt identifier
     */
    function storeReceipt(
        bytes32 invoiceId,
        bytes32 invoiceHash,
        address payer,
        address provider,
        uint256 originalAmount,
        uint256 paidAmount,
        uint256 savedAmount,
        string calldata providerName,
        string calldata category
    ) external onlySmartSettle returns (bytes32 receiptId) {
        require(invoiceToReceipt[invoiceId] == bytes32(0), "ReceiptStore: receipt already exists");
        require(payer != address(0),    "ReceiptStore: zero payer");
        require(provider != address(0), "ReceiptStore: zero provider");
        require(paidAmount > 0,         "ReceiptStore: zero paid amount");
        require(paidAmount <= originalAmount, "ReceiptStore: paid > original");

        receiptId = keccak256(abi.encodePacked(
            invoiceId,
            payer,
            paidAmount,
            block.timestamp,
            block.number
        ));

        _receipts[receiptId] = Receipt({
            invoiceId:      invoiceId,
            invoiceHash:    invoiceHash,
            payer:          payer,
            provider:       provider,
            originalAmount: originalAmount,
            paidAmount:     paidAmount,
            savedAmount:    savedAmount,
            timestamp:      block.timestamp,
            blockNumber:    block.number,
            providerName:   providerName,
            category:       category
        });

        invoiceToReceipt[invoiceId] = receiptId;
        _userReceipts[payer].push(receiptId);
        totalReceipts += 1;

        emit ReceiptStored(receiptId, invoiceId, payer, paidAmount, savedAmount);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    /// @notice Get a receipt by its ID
    function getReceipt(bytes32 receiptId) external view returns (Receipt memory) {
        require(_receipts[receiptId].payer != address(0), "ReceiptStore: receipt not found");
        return _receipts[receiptId];
    }

    /// @notice Get receipt for a specific invoice
    function getReceiptByInvoice(bytes32 invoiceId) external view returns (Receipt memory) {
        bytes32 receiptId = invoiceToReceipt[invoiceId];
        require(receiptId != bytes32(0), "ReceiptStore: no receipt for invoice");
        return _receipts[receiptId];
    }

    /// @notice Get all receipt IDs for a user
    function getUserReceiptIds(address user) external view returns (bytes32[] memory) {
        return _userReceipts[user];
    }

    /// @notice Get full receipt history for a user
    function getUserReceipts(address user) external view returns (Receipt[] memory) {
        bytes32[] memory ids = _userReceipts[user];
        Receipt[] memory result = new Receipt[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = _receipts[ids[i]];
        }
        return result;
    }

    /// @notice Verify that a receipt matches given parameters (for auditing)
    function verifyReceipt(
        bytes32 receiptId,
        bytes32 invoiceId,
        address payer,
        uint256 paidAmount
    ) external view returns (bool) {
        Receipt memory r = _receipts[receiptId];
        return (
            r.invoiceId   == invoiceId  &&
            r.payer       == payer      &&
            r.paidAmount  == paidAmount &&
            r.timestamp   > 0
        );
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    /// @notice Set the SmartSettle contract address (one-time setup or upgrade)
    function setSmartSettle(address _smartSettle) external onlyOwner {
        require(_smartSettle != address(0), "ReceiptStore: zero address");
        emit SmartSettleUpdated(smartSettle, _smartSettle);
        smartSettle = _smartSettle;
    }
}
