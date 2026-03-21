const express = require("express");
const { getReceiptsForWallet } = require("../services/blockchainService");

const router = express.Router();

// GET /api/receipts/:walletAddress
router.get("/:walletAddress", async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    if (!/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }
    const receipts = await getReceiptsForWallet(walletAddress);
    res.json({ ok: true, receipts });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
