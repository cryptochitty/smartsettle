'use client';

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

import { InvoiceUpload } from "@/components/invoice/InvoiceUpload";
import { BillsList } from "@/components/dashboard/BillsList";
import { ReceiptsList } from "@/components/dashboard/ReceiptsList";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { NegotiationModal } from "@/components/invoice/NegotiationModal";
import { WalletPanel } from "@/components/wallet/WalletPanel";

import type { Invoice } from "@/types";

type Tab = "dashboard" | "bills" | "receipts" | "wallet";

export default function Home() {
  const { isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [negotiating, setNeg] = useState<Invoice | null>(null);

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
              className={`flex-1 py-2 text-[10px] font-bold tracking-wider transition-all ${
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
              Connect via Valora, MetaMask, or WalletConnect. The AI agent negotiates discounts and pays on Celo.
            </p>

            <div className="flex flex-col items-center gap-3">
              <ConnectButton label="Connect Wallet" />
              <p className="text-xs text-muted">
                Supports Valora · MetaMask · WalletConnect
              </p>
            </div>
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
