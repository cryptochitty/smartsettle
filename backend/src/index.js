// 1. IMPROVED DOTENV: Use a fallback for environments where the relative path might fail (like Render/Vercel)
const path = require("path");
require("dotenv").config({ 
  path: process.env.NODE_ENV === "production" ? null : path.join(__dirname, "../../.env") 
});

const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");

// Routes
const invoiceRoutes   = require("./routes/invoice");
const negotiateRoutes = require("./routes/negotiate");
const receiptRoutes   = require("./routes/receipts");
const statsRoutes      = require("./routes/stats");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
// Fix: Adjust Helmet to allow cross-origin for Web3/Celo components if needed
app.use(helmet({ 
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false // Often necessary when interacting with external RPCs/Wallets
}));

// Fix: Allow multiple origins or ensure FRONTEND_URL doesn't have a trailing slash
const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : "http://localhost:3000";
app.use(cors({ 
  origin: frontendUrl, 
  credentials: true 
}));

app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// Fix: Trust Proxy is REQUIRED for Render/Vercel/Heroku to get the correct IP
app.set("trust proxy", 1); 

app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200,
  standardHeaders: true, 
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/invoice",   invoiceRoutes);
app.use("/api/negotiate", negotiateRoutes);
app.use("/api/receipts",  receiptRoutes);
app.use("/api/stats",      statsRoutes);

// Health Check
app.get("/health", (_, res) => res.json({
  status:    "ok",
  network:   "Celo Mainnet",
  chainId:   42220,
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || "development"
}));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[ERROR]", err.stack); // Use .stack for better debugging in logs
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message 
  });
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 SmartSettle backend  →  http://localhost:${PORT}`);
  console.log(`    Network  : Celo Mainnet (chain 42220)`);
  console.log(`    Frontend : ${frontendUrl}\n`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => process.exit(0));
});
