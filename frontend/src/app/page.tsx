'use client';

import { useState } from "react";
import dynamic from "next/dynamic";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { Invoice } from "../types";

// ✅ dynamically load wagmi hook safely
import { useAccount } from "wagmi";

// ✅ client-only components
const InvoiceUpload = dynamic(() => import("../components/invoice/InvoiceUpload"), { ssr: false });
const BillsList = dynamic(() => import("../components/dashboard/BillsList"), { ssr: false });
const ReceiptsList = dynamic(() => import("../components/dashboard/ReceiptsList"), { ssr: false });
const StatsBar = dynamic(() => import("../components/dashboard/StatsBar"), { ssr: false });
const NegotiationModal = dynamic(() => import("../components/invoice/NegotiationModal"), { ssr: false });
const WalletPanel = dynamic(() => import("../components/wallet/WalletPanel"), { ssr: false });

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

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-cyan flex items-center justify-center text-lg">
              ⚖️
            </div>
            <div>
              <div className="text-base font-black text-white">SmartSettle</div>
              <div className="text-[10px] text-muted font-mono">
                AUTONOMOUS BILL AGENT
              </div>
            </div>
          </div>

          <nav className="hidden md:flex gap-1">
            {(["dashboard","bills","receipts","wallet"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-bold rounded-lg ${
                  tab === t ? "text-accent" : "text-muted"
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </nav>

          <ConnectButton />
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 md:px-6 py-8">

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
            <div className="text-7xl">⚖️</div>

            <h1 className="text-4xl font-black text-white">
              Pay bills automatically
            </h1>

            <ConnectButton label="Connect Wallet" />
          </div>
        ) : (
          <>
            {tab === "dashboard" && (
              <>
                <StatsBar />
                <BillsList onNegotiate={setNeg} />
              </>
            )}

            {tab === "bills" && <InvoiceUpload onNegotiate={setNeg} />}
            {tab === "receipts" && <ReceiptsList />}
            {tab === "wallet" && <WalletPanel />}
          </>
        )}
      </main>

      {negotiating && (
        <NegotiationModal
          invoice={negotiating}
          onClose={() => setNeg(null)}
        />
      )}
    </div>
  );
}
