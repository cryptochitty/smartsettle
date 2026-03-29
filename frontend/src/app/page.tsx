'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import dynamicImport from "next/dynamic";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

// ✅ Disable SSR for all components
const InvoiceUpload = dynamicImport(() => import("../components/invoice/InvoiceUpload"), { ssr: false });
const BillsList = dynamicImport(() => import("../components/dashboard/BillsList"), { ssr: false });
const ReceiptsList = dynamicImport(() => import("../components/dashboard/ReceiptsList"), { ssr: false });
const StatsBar = dynamicImport(() => import("../components/dashboard/StatsBar"), { ssr: false });
const NegotiationModal = dynamicImport(() => import("../components/invoice/NegotiationModal"), { ssr: false });
const WalletPanel = dynamicImport(() => import("../components/wallet/WalletPanel"), { ssr: false });

import type { Invoice } from "../types";

type Tab = "dashboard" | "bills" | "receipts" | "wallet";

export default function Home() {
  const { isConnected } = useAccount();

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [negotiating, setNeg] = useState<Invoice | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🚨 Prevent SSR crash
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-cyan flex items-center justify-center text-lg">
              ⚖️
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white">
                SmartSettle
              </div>
              <div className="text-[10px] text-muted tracking-widest font-mono">
                AUTONOMOUS BILL AGENT · CELO SEPOLIA
              </div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-1">
            {(["dashboard","bills","receipts","wallet"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-bold tracking-widest rounded-lg transition-all ${
                  tab === t
                    ? "bg-accent/10 text-accent border border-accent/30"
                    : "text-muted hover:text-white"
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </nav>

          <ConnectButton chainStatus="icon" showBalance={false} />
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex border-t border-border">
          {(["dashboard","bills","receipts","wallet"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-[10px] font-bold tracking-wider ${
                tab === t ? "text-accent bg-accent/5" : "text-muted"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
            <div className="text-7xl">⚖️</div>

            <h1 className="text-4xl md:text-5xl font-black text-white">
              Pay bills at the{" "}
              <span className="text-accent">lowest price.</span>
              <br />
              Automatically.
            </h1>

            <p className="text-muted max-w-md">
              Connect via Valora, MetaMask, or WalletConnect.
            </p>

            <ConnectButton label="Connect Wallet" />
          </div>
        ) : (
          <>
            {tab === "dashboard" && (
              <div className="space-y-6">
                <StatsBar />
                <BillsList onNegotiate={setNeg} />
              </div>
            )}

            {tab === "bills" && (
              <InvoiceUpload onNegotiate={setNeg} />
            )}

            {tab === "receipts" && <ReceiptsList />}

            {tab === "wallet" && <WalletPanel />}
          </>
        )}
      </main>

      {/* Modal */}
      {negotiating && (
        <NegotiationModal
          invoice={negotiating}
          onClose={() => setNeg(null)}
        />
      )}
    </div>
  );
}
