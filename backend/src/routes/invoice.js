const express = require("express");
const multer  = require("multer");
const { v4: uuidv4 } = require("uuid");
const path    = require("path");
const { z }   = require("zod");

const { parseInvoice }            = require("../services/invoiceParser");
const { registerInvoiceOnChain, getInvoicesForWallet } = require("../services/blockchainService");

const router  = express.Router();
const upload  = multer({
  dest: "/tmp/smartsettle-uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_, file, cb) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    cb(null, allowed.includes(file.mimetype));
  },
});

// POST /api/invoice/parse
// Upload invoice file → AI parses → returns structured data
router.post("/parse", upload.single("invoice"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const parsed = await parseInvoice(req.file.path, req.file.mimetype);
    res.json({ ok: true, parsed });
  } catch (err) {
    next(err);
  }
});

// POST /api/invoice/register
// Register parsed invoice on-chain via agent wallet
const RegisterSchema = z.object({
  invoiceHash:    z.string(),
  payer:          z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  providerName:   z.string().min(1),
  originalAmount: z.number().positive(),
  dueDate:        z.number().positive(),
  category:       z.string().min(1),
});

router.post("/register", async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body);

    // Generate unique invoice ID
    const invoiceId = "0x" + uuidv4().replace(/-/g, "").padEnd(64, "0");

    const txHash = await registerInvoiceOnChain({
      invoiceId,
      invoiceHash:      body.invoiceHash,
      payer:            body.payer,
      providerName:     body.providerName,
      originalAmountUSD: body.originalAmount,
      dueDate:          body.dueDate,
      category:         body.category,
    });

    res.json({
      ok: true,
      invoice: {
        id:             invoiceId,
        invoiceHash:    body.invoiceHash,
        payer:          body.payer,
        providerName:   body.providerName,
        originalAmount: body.originalAmount.toFixed(2),
        dueDate:        body.dueDate,
        category:       body.category,
        status:         "REGISTERED",
      },
      txHash,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/invoice/:walletAddress
// Get all invoices for a wallet
router.get("/:walletAddress", async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    if (!/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }
    const invoices = await getInvoicesForWallet(walletAddress);
    res.json({ ok: true, invoices });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
