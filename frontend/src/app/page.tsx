"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const BILL = {
  name: "Electricity Bill",
  amount: 5300,
};

export default function Page() {
  const { address, isConnected } = useAccount();

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  /* ── NEGOTIATE ───────────────────────────── */

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

  /* ── PAY ───────────────────────────── */

  const pay = async () => {
    if (!isConnected) return alert("Connect wallet");
    if (!agreed) return alert("Accept terms first");

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

  /* ── UI ───────────────────────────── */

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2>SmartSettle 💰</h2>

        {/* REAL WALLET CONNECT */}
        <ConnectButton />

        {isConnected && (
          <p style={{ fontSize: 12, color: "#00ff87" }}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        )}

        <h3>{BILL.name}</h3>
        <p>₹{BILL.amount}</p>

        {!result && (
          <button style={styles.btn} onClick={negotiate}>
            {loading ? "Negotiating..." : "Start AI Negotiation"}
          </button>
        )}

        {result && (
          <div style={styles.box}>
            <h2 style={{ color: "#00ff87" }}>
              ₹{Math.round(result.user_receives)}
            </h2>

            <p style={{ textDecoration: "line-through" }}>
              ₹{BILL.amount}
            </p>

            <p>Fee: ₹{Math.round(result.platform_fee)}</p>

            <label style={{ fontSize: 12 }}>
              <input
                type="checkbox"
                onChange={(e) => setAgreed(e.target.checked)}
              />
              I agree to Terms & Disclaimer
            </label>

            <button
              style={styles.btn}
              disabled={!agreed || loading}
              onClick={pay}
            >
              {loading ? "Processing..." : "Pay"}
            </button>
          </div>
        )}

        {txHash && (
          <p style={{ marginTop: 10, color: "#00ff87" }}>
            ✅ Tx:{" "}
            <a
              href={`https://celoscan.io/tx/${txHash}`}
              target="_blank"
              style={{ color: "#38bdf8" }}
            >
              View
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

/* ── STYLES ───────────────────────────── */

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
    width: 380,
    padding: 24,
    borderRadius: 16,
    background: "#061021",
    border: "1px solid #1e3354",
  },
  btn: {
    width: "100%",
    padding: 12,
    marginTop: 12,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#00ff87,#38bdf8)",
    fontWeight: "bold",
    cursor: "pointer",
  },
  box: {
    marginTop: 16,
    padding: 12,
    border: "1px solid #00ff8730",
    borderRadius: 10,
  },
};
