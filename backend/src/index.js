require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { logActiveProvider } = require("./services/llmAdapter");

// ── ROUTES ─────────────────────────────────────────────
const invoiceRoutes = require("./routes/invoice");
const negotiateRoutes = require("./routes/negotiate");
const receiptRoutes = require("./routes/receipts");
const statsRoutes = require("./routes/stats");

const app = express();
const PORT = process.env.PORT || 3001;

/* ─────────────────────────────────────────────
   TRUST PROXY (IMPORTANT FOR CLOUD DEPLOYMENT)
───────────────────────────────────────────── */
app.set("trust proxy", 1);

/* ─────────────────────────────────────────────
   SECURITY LAYER
───────────────────────────────────────────── */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

/* ─────────────────────────────────────────────
   CORS CONFIG
───────────────────────────────────────────── */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS blocked"));
    },
    credentials: true,
  })
);

/* ─────────────────────────────────────────────
   LOGGING + BODY PARSER
───────────────────────────────────────────── */
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

/* ─────────────────────────────────────────────
   RATE LIMITING
───────────────────────────────────────────── */
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
      error: "Too many requests. Please slow down.",
    },
  })
);

/* ─────────────────────────────────────────────
   REVENUE + USAGE TRACKING HOOK (IMPORTANT)
───────────────────────────────────────────── */
app.use((req, res, next) => {
  req.startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - req.startTime;

    console.log(
      `📡 ${req.method} ${req.url} | ${res.statusCode} | ${duration}ms`
    );

    // 🔥 FUTURE UPGRADE:
    // Save API usage for billing / Stripe / SaaS metering
    // saveUsage(req.ip, req.url, duration);
  });

  next();
});

/* ─────────────────────────────────────────────
   API ROUTES
───────────────────────────────────────────── */
app.use("/api/invoice", invoiceRoutes);
app.use("/api/negotiate", negotiateRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/stats", statsRoutes);

/* ─────────────────────────────────────────────
   HEALTH CHECK
───────────────────────────────────────────── */
app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    app: "SmartSettle",
    network: "Celo Sepolia",
    chainId: 11142220,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* ─────────────────────────────────────────────
   404 HANDLER
───────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

/* ─────────────────────────────────────────────
   GLOBAL ERROR HANDLER
───────────────────────────────────────────── */
app.use((err, req, res, _next) => {
  console.error("[ERROR]", err.message);

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

/* ─────────────────────────────────────────────
   START SERVER
───────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log("\n🚀 SmartSettle Backend Running");
  console.log("──────────────────────────────");
  console.log(`🌐 URL        : http://localhost:${PORT}`);
  console.log(
    `🌍 FRONTEND   : ${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }`
  );
  console.log(`⛓️  NETWORK    : Celo Sepolia (11142220)`);
  console.log("──────────────────────────────");

  logActiveProvider();

  console.log(
    "\n💰 Ready: Invoice | Negotiation | Receipts | Stats APIs\n"
  );
});
