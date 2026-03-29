const express = require("express");
const { runNegotiation }     = require("../agent/negotiationAgent");
const { recordOffer, executePaymentOnChain, getInvoicesForWallet } = require("../services/blockchainService");

const router = express.Router();

// GET /api/negotiate/:invoiceId/stream
// Server-Sent Events — streams live negotiation steps to frontend
router.get("/:invoiceId/stream", async (req, res) => {
  const { invoiceId } = req.params;
  const walletAddress = req.query.wallet;

  // SSE headers
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    if (res.flush) res.flush(); // compression-safe flush
  };

  try {
    // Fetch invoice details from chain
    // (In real app, pull wallet from session/JWT — using query param for demo)
    let invoice = null;
    if (walletAddress) {
      const invoices = await getInvoicesForWallet(walletAddress);
      invoice = invoices.find((i) => i.id === invoiceId);
    }

    // Fallback mock invoice for demo without wallet
    if (!invoice) {
      invoice = {
        id:             invoiceId,
        providerName:   "BESCOM Electricity",
        originalAmount: "53.00",
        category:       "Utility",
      };
    }

    // Run negotiation — each step fires onStep callback
    const { offer } = await runNegotiation({
      invoice,
      onStep: (step) => send("step", step),
    });

    // Record winning offer on-chain
    send("step", { id: 6, label: "Writing result to blockchain", detail: "Storing negotiated amount on-chain…", status: "running" });

    await recordOffer({
      invoiceId,
      negotiatedAmountUSD: offer.finalAmount,
      discountLabel:       offer.label,
    });

    send("step", { id: 6, label: "Result confirmed on-chain", detail: `$${offer.finalAmount} locked · ${offer.label}`, status: "done" });

    // Done — send final result
    send("done", {
      paidAmount:  offer.finalAmount.toFixed(2),
      savedAmount: offer.savings.toFixed(2),
    });

  } catch (err) {
    console.error("[NEGOTIATE STREAM]", err.message);
    send("error", { message: err.message });
  } finally {
    res.end();
  }
});

// POST /api/negotiate/:invoiceId/execute
// Called after user approves cUSD in wallet — agent executes on-chain payment
router.post("/:invoiceId/execute", async (req, res, next) => {
  try {
    const { invoiceId }    = req.params;
    const { walletAddress } = req.body;

    if (!walletAddress) return res.status(400).json({ error: "walletAddress required" });

    const { txHash, blockNumber } = await executePaymentOnChain(invoiceId);

    res.json({ ok: true, txHash, blockNumber });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
