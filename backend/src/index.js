require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");

const invoiceRoutes   = require("./routes/invoice");
const negotiateRoutes = require("./routes/negotiate");
const receiptRoutes   = require("./routes/receipts");
const statsRoutes     = require("./routes/stats");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  message: { error: "Too many requests. Please slow down." },
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/invoice",   invoiceRoutes);
app.use("/api/negotiate", negotiateRoutes);
app.use("/api/receipts",  receiptRoutes);
app.use("/api/stats",      statsRoutes);

// Updated Health Check for Mainnet
app.get("/health", (_, res) => res.json({
  status:    "ok",
  network:   "Celo Mainnet",
  chainId:   42220,
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || "development"
}));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 SmartSettle backend  →  http://localhost:${PORT}`);
  console.log(`   Network  : Celo Mainnet (chain 42220)`);
  console.log(`   Frontend : ${process.env.FRONTEND_URL || "http://localhost:3000"}\n`);
});

// Graceful shutdown for Render deployments
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated.");
  });
});
