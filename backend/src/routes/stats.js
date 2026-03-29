const express = require("express");
const { getReceiptsForWallet } = require("../services/blockchainService");

const router = express.Router();

// GET /api/stats/:walletAddress
router.get("/:walletAddress", async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const receipts = await getReceiptsForWallet(walletAddress);

    const totalSaved    = receipts.reduce((s, r) => s + parseFloat(r.savedAmount),    0);
    const totalPaid     = receipts.reduce((s, r) => s + parseFloat(r.paidAmount),     0);
    const totalOriginal = receipts.reduce((s, r) => s + parseFloat(r.originalAmount), 0);
    const avgDiscount   = totalOriginal > 0 ? ((totalSaved / totalOriginal) * 100).toFixed(1) : "0";

    res.json({
      ok: true,
      stats: {
        billsSettled: receipts.length,
        totalSaved:   totalSaved.toFixed(2),
        totalPaid:    totalPaid.toFixed(2),
        avgDiscount,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
