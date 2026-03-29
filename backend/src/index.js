require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { logActiveProvider } = require("./services/llmAdapter");

/* ROUTES */
const invoiceRoutes = require("./routes/invoice");
const negotiateRoutes = require("./routes/negotiate");
const receiptRoutes = require("./routes/receipts");
const statsRoutes = require("./routes/stats");

const app = express();

/* TRUST PROXY */
app.set("trust proxy", 1);

/* SECURITY */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

/* CORS */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false); // safer
    },
    credentials: true,
  })
);

/* MIDDLEWARE */
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

/* RATE LIMIT */
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: "Too many requests. Please slow down." },
  })
);

/* USAGE TRACKING */
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`📡 ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });

  next();
});

/* ROUTES */
app.use("/api/invoice", invoiceRoutes);
app.use("/api/negotiate", negotiateRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/stats", statsRoutes);

/* HEALTH */
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

/* 404 */
app.use((_, res) => {
  res.status(404).json({ error: "Route not found" });
});

/* ERROR HANDLER */
app.use((err, req, res, _next) => {
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

/* EXPORT APP (IMPORTANT) */
module.exports = app;
