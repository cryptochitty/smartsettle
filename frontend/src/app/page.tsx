"use client";
// @ts-nocheck

import { useState } from "react";
import { useAccount } from "wagmi";

/* ── CONFIG ───────────────────────────────────────── */
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || "42220";

const NETWORK_NAME =
  CHAIN_ID === "42220"
    ? "Celo Mainnet"
    : CHAIN_ID === "11142220"
    ? "Celo Sepolia"
    : "Unknown Network";

const EXPLORER =
  CHAIN_ID === "42220"
    ? "https://celoscan.io/tx/"
    : "https://alfajores.celoscan.io/tx/";

/* ── DEMO BILL ───────────────────────────────────── */
const BILL = {
  name: "Electricity Bill",
  amount: 5300,
};

export default function Page() {
  const { address, isConnected } = useAccount();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [view, setView] = useState("app");

  /* ── NEGOTIATE ─────────────────────────────────── */
  const negotiate = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/negotiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyA: BILL.amount,
          partyB: BILL.amount * 0.85,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── PAY ───────────────────────────────────────── */
  const pay = async () => {
    if (!agreed) return;
    if (!address) return alert("Connect wallet");

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: address,
          amount: result.user_receives,
        }),
      });

      const data = await res.json();
      setTxHash(data.txHash);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── LEGAL PAGES ───────────────────────────────── */
  if (view === "terms") {
    return (
      <LegalLayout title="Terms of Service" setView={setView}>
        <p>
          SmartSettle provides AI-powered bill negotiation on the{" "}
          :contentReference[oaicite:0]{index=0} network.
        </p>
        <p>No financial advice. Transactions are irreversible.</p>
        <p>Users are responsible for verifying transactions.</p>
      </LegalLayout>
    );
  }

  if (view === "privacy") {
    return (
      <LegalLayout title="Privacy Policy" setView={setView}>
        <p>We collect wallet address and transaction metadata.</p>
        <p>We never store private keys.</p>
      </LegalLayout>
    );
  }

  if (view === "disclaimer") {
    return (
      <LegalLayout title="Disclaimer" setView={setView}>
        <p>AI negotiation results are not guaranteed.</p>
        <p>Blockchain transactions are irreversible.</p>
        <p>Use at your own risk.</p>
      </LegalLayout>
    );
  }

  /* ── MAIN APP ─────────────────────────────────── */
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2>SmartSettle 💰</h2>
        <p style={{ color: "#38bdf8", fontSize: 12 }}>
          {NETWORK_NAME} · {CHAIN_ID}
        </p>

        {!isConnected && (
          <p style={{ marginTop: 20 }}>Please connect wallet</p>
        )}

        {isConnected && (
          <>
            <p style={{ fontSize: 12, color: "#00ff87" }}>
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>

            <h3 style={{ marginTop: 20 }}>{BILL.name}</h3>
            <p>₹{BILL.amount}</p>

            {!result && (
              <button style={styles.secondaryBtn} onClick={negotiate}>
                {loading ? "Negotiating..." : "Start AI Negotiation"}
              </button>
            )}

            {result && (
              <div style={styles.resultBox}>
                <h2 style={{ color: "#00ff87" }}>
                  ₹{Math.round(result.user_receives)}
                </h2>

                <p style={{ textDecoration: "line-through" }}>
                  ₹{BILL.amount}
                </p>

                <p>💰 Fee: ₹{Math.round(result.platform_fee)}</p>

                <label style={styles.checkbox}>
                  <input
                    type="checkbox"
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  I agree to Terms & Disclaimer
                </label>

                <button
                  onClick={pay}
                  disabled={!agreed || loading}
                  style={{
                    ...styles.primaryBtn,
                    background: agreed
                      ? "linear-gradient(135deg,#00ff87,#38bdf8)"
                      : "#1e3354",
                  }}
                >
                  {loading ? "Processing..." : "⚡ Pay"}
                </button>
              </div>
            )}

            {txHash && (
              <div style={{ marginTop: 12 }}>
                <p style={{ color: "#00ff87" }}>✅ Success</p>
                <a
                  href={`${EXPLORER}${txHash}`}
                  target="_blank"
                  style={{ color: "#38bdf8" }}
                >
                  View Transaction →
                </a>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <span onClick={() => setView("terms")}>Terms</span> •{" "}
          <span onClick={() => setView("privacy")}>Privacy</span> •{" "}
          <span onClick={() => setView("disclaimer")}>Disclaimer</span>

          <p style={{ marginTop: 6 }}>
            Non-custodial app on{" "}
            :contentReference[oaicite:1]{index=1}. Use at your own risk.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── LEGAL LAYOUT ───────────────────────────────── */
function LegalLayout({ title, children, setView }) {
  return (
    <div style={{ padding: 40, color: "#d8eeff" }}>
      <button onClick={() => setView("app")}>← Back</button>
      <h1>{title}</h1>
      <div style={{ marginTop: 20 }}>{children}</div>
    </div>
  );
}

/* ── STYLES ───────────────────────────────────── */
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#030912",
    color: "#fff",
  },
  card: {
    width: 400,
    padding: 24,
    borderRadius: 16,
    background: "#060e1f",
    border: "1px solid #1e3354",
  },
  primaryBtn: {
    marginTop: 16,
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    fontWeight: "bold",
    cursor: "pointer",
    background: "linear-gradient(135deg,#00ff87,#38bdf8)",
  },
  secondaryBtn: {
    marginTop: 16,
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#38bdf8",
    cursor: "pointer",
  },
  resultBox: {
    marginTop: 16,
    padding: 16,
    border: "1px solid #00ff8730",
    borderRadius: 12,
  },
  checkbox: {
    fontSize: 12,
    marginTop: 10,
    display: "block",
  },
  footer: {
    marginTop: 20,
    fontSize: 11,
    color: "#6b8cac",
    textAlign: "center",
    cursor: "pointer",
  },
};
