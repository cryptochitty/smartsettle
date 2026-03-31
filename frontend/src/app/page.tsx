"use client";
import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { InvoiceUpload }    from "@/components/invoice/InvoiceUpload";
import { BillsList }        from "@/components/dashboard/BillsList";
import { ReceiptsList }     from "@/components/dashboard/ReceiptsList";
import { StatsBar }         from "@/components/dashboard/StatsBar";
import { NegotiationModal } from "@/components/invoice/NegotiationModal";
import { WalletPanel }      from "@/components/wallet/WalletPanel";
import { isMainnet }        from "@/lib/contracts";
import type { Invoice }     from "@/types";

type Tab = "dashboard" | "bills" | "receipts" | "wallet";

const TAB_META: Record<Tab, { icon: string; label: string }> = {
  dashboard: { icon: "◈", label: "Dashboard" },
  bills:     { icon: "↑", label: "Upload Bill" },
  receipts:  { icon: "⛓", label: "Receipts" },
  wallet:    { icon: "◎", label: "Wallet" },
};

export default function Home() {
  const { isConnected, chainId } = useAccount();
  const [tab, setTab]     = useState<Tab>("dashboard");
  const [negotiating, setNeg] = useState<Invoice | null>(null);
  const mainnet = isMainnet(chainId);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 flex items-center justify-between h-[62px]">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-accent to-cyan opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center text-accent font-bold text-lg">⚖</div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold tracking-tight text-white">SmartSettle</span>
                {isConnected && (
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    mainnet
                      ? "text-accent border-accent/30 bg-accent/8"
                      : "text-gold border-gold/30 bg-gold/8"
                  }`}>
                    {mainnet ? "MAINNET" : "TESTNET"}
                  </span>
                )}
              </div>
              <div className="text-[9px] text-muted tracking-[0.12em] font-mono hidden sm:block">
                AUTONOMOUS BILL AGENT · CELO
              </div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {isConnected && (Object.entries(TAB_META) as [Tab, typeof TAB_META[Tab]][]).map(([t, meta]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold tracking-wide rounded-xl transition-all ${
                  tab === t
                    ? "text-accent bg-accent/8 border border-accent/20"
                    : "text-muted hover:text-muted2 hover:bg-surface"
                }`}>
                <span className="opacity-70">{meta.icon}</span>
                {meta.label}
              </button>
            ))}
          </nav>

          <ConnectButton chainStatus="icon" showBalance={false} />
        </div>

        {/* Mobile nav */}
        {isConnected && (
          <div className="md:hidden flex border-t border-border/50">
            {(Object.entries(TAB_META) as [Tab, typeof TAB_META[Tab]][]).map(([t, meta]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-[10px] font-semibold tracking-wide transition-all flex flex-col items-center gap-0.5 ${
                  tab === t ? "text-accent" : "text-muted"
                }`}>
                <span className="text-sm leading-none">{meta.icon}</span>
                {meta.label.split(" ")[0]}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl w-full px-4 md:px-6 py-8 flex-1">
        {!isConnected ? (
          <LandingHero />
        ) : (
          <div className="animate-fade-in">
            {tab === "dashboard" && (
              <div className="space-y-5">
                <SectionHeader
                  tag="OVERVIEW"
                  title="Dashboard"
                  subtitle="Your bill settlement activity and balances"
                />
                <StatsBar />
                <BillsList onNegotiate={setNeg} />
              </div>
            )}
            {tab === "bills" && (
              <div className="max-w-2xl">
                <InvoiceUpload onNegotiate={setNeg} />
              </div>
            )}
            {tab === "receipts" && <ReceiptsList />}
            {tab === "wallet" && (
              <div className="max-w-lg">
                <WalletPanel />
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-5">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-muted font-mono">
            SmartSettle · Built on Celo · AI-powered negotiation
          </span>
          <div className="flex items-center gap-4 text-[11px] text-muted">
            <a href="https://celoscan.io" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Celoscan ↗</a>
            <a href="https://docs.celo.org" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Docs ↗</a>
          </div>
        </div>
      </footer>

      {negotiating && <NegotiationModal invoice={negotiating} onClose={() => setNeg(null)} />}
    </div>
  );
}

// ── Landing hero ───────────────────────────────────────────────────────────
function LandingHero() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      {/* Badge */}
      <div className="mb-8 inline-flex items-center gap-2 bg-accent/8 border border-accent/20 px-4 py-1.5 rounded-full animate-fade-in">
        <div className="dot-live" />
        <span className="text-[11px] font-semibold text-accent tracking-wider">LIVE ON CELO MAINNET</span>
      </div>

      {/* Headline */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-5 animate-fade-up max-w-3xl">
        Pay bills at the{" "}
        <span className="font-display italic" style={{ color: "var(--accent)" }}>lowest price.</span>
        <br />
        <span className="text-muted2">Automatically.</span>
      </h1>

      {/* Subtitle */}
      <p className="text-muted2 text-lg max-w-xl mb-10 animate-fade-up leading-relaxed" style={{ animationDelay: ".1s" }}>
        AI negotiates discounts with providers and pays on Celo.
        Immutable receipts stored on-chain. Zero manual effort.
      </p>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 animate-fade-up" style={{ animationDelay: ".2s" }}>
        <ConnectButton label="Connect Wallet to Start" />
        <p className="text-[11px] text-muted">Valora · MetaMask · WalletConnect · Coinbase</p>
      </div>

      {/* Feature pills */}
      <div className="mt-16 flex flex-wrap justify-center gap-3 animate-fade-up" style={{ animationDelay: ".3s" }}>
        {[
          { icon: "🤖", text: "AI Negotiation" },
          { icon: "⛓", text: "On-chain Receipts" },
          { icon: "💵", text: "Pay in cUSD" },
          { icon: "🔒", text: "Non-custodial" },
          { icon: "⚡", text: "Auto-pay" },
        ].map((f) => (
          <div key={f.text} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-sm text-muted2">
            <span>{f.icon}</span>
            <span>{f.text}</span>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="mt-16 grid sm:grid-cols-3 gap-4 max-w-2xl w-full animate-fade-up" style={{ animationDelay: ".4s" }}>
        {[
          { step: "01", title: "Upload Invoice", desc: "PDF or image — AI extracts all details" },
          { step: "02", title: "AI Negotiates", desc: "Agent contacts provider APIs for best discount" },
          { step: "03", title: "Pay & Receipt", desc: "Lowest amount paid, receipt stored on-chain" },
        ].map((s) => (
          <div key={s.step} className="card p-5 text-left">
            <div className="font-mono text-[11px] text-accent mb-3 tracking-widest">{s.step}</div>
            <div className="font-semibold text-white mb-1">{s.title}</div>
            <div className="text-xs text-muted leading-relaxed">{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ tag, title, subtitle }: { tag: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-2">
      <p className="text-[10px] text-muted tracking-[0.15em] font-mono mb-1">{tag}</p>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
    </div>
  );
}
