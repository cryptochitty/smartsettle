"use client";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { negotiationApi } from "@/lib/api";
import { useApproveCUSD } from "@/hooks/useSmartSettle";
import { getAddresses, getExplorer } from "@/lib/contracts";
import type { Invoice, NegotiationStep } from "@/types";
import toast from "react-hot-toast";

interface Props { invoice: Invoice; onClose: () => void; }

const STEP_STATUS_STYLE = {
  done:    "border-accent bg-accent/10 text-accent",
  running: "border-cyan bg-cyan/10 text-cyan",
  error:   "border-red-400 bg-red-400/10 text-red-400",
  pending: "border-border bg-surface text-muted",
};

export function NegotiationModal({ invoice, onClose }: Props) {
  const { address, chainId } = useAccount();
  const { approve }    = useApproveCUSD();
  const addrs          = getAddresses(chainId);
  const explorer       = getExplorer(chainId);
  const [steps, setSteps]   = useState<NegotiationStep[]>([]);
  const [done, setDone]     = useState(false);
  const [result, setResult] = useState<{ paidAmount: string; savedAmount: string; txHash?: string } | null>(null);
  const [paying, setPaying] = useState(false);
  const scrollRef           = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as steps arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  // SSE stream
  useEffect(() => {
    const url = negotiationApi.streamUrl(invoice.id, address || undefined);
    const es  = new EventSource(url);

    es.addEventListener("step", (e) => {
      const step: NegotiationStep = JSON.parse(e.data);
      setSteps((prev) => {
        const exists = prev.find((s) => s.id === step.id);
        return exists
          ? prev.map((s) => s.id === step.id ? step : s)
          : [...prev, step];
      });
    });

    es.addEventListener("done", (e) => {
      setResult(JSON.parse(e.data));
      setDone(true);
      es.close();
    });

    es.addEventListener("error", (e) => {
      try {
        const d = JSON.parse((e as MessageEvent).data);
        toast.error(d.message || "Negotiation error");
      } catch {}
    });

    es.onerror = () => {
      // Don't toast on normal close
    };

    return () => es.close();
  }, [invoice.id]);

  const handlePay = async () => {
    if (!result || !address) return;
    setPaying(true);
    try {
      toast.loading("Step 1 of 2 — Approve cUSD spend in your wallet…", { id: "pay" });
      await approve(addrs.SMART_SETTLE, parseFloat(result.paidAmount));

      toast.loading("Step 2 of 2 — Executing on-chain payment…", { id: "pay" });
      const res = await negotiationApi.execute(invoice.id, address);

      toast.success(`✅ Paid $${result.paidAmount} · Saved $${result.savedAmount}`, { id: "pay", duration: 6000 });
      setResult((r) => r ? { ...r, txHash: res.txHash } : r);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Payment failed", { id: "pay" });
    } finally {
      setPaying(false);
    }
  };

  const savingsPct = result
    ? ((parseFloat(result.savedAmount) / parseFloat(invoice.originalAmount)) * 100).toFixed(1)
    : "0";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && !paying && onClose()}
    >
      <div className="card w-full max-w-lg flex flex-col max-h-[90vh] animate-fade-up overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold">
                ⚡
              </div>
              {!done && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan border-2 border-bg animate-pulse" />
              )}
            </div>
            <div>
              <p className="text-[10px] text-muted font-mono tracking-wider">
                {done ? "NEGOTIATION COMPLETE" : "AI AGENT · LIVE"}
              </p>
              <h3 className="font-semibold text-white">{invoice.providerName}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={paying}
            className="w-8 h-8 rounded-lg text-muted hover:text-white hover:bg-surface2 transition-all flex items-center justify-center text-lg"
          >
            ✕
          </button>
        </div>

        {/* ── Invoice summary row ── */}
        <div className="flex gap-3 px-6 py-3 bg-surface2/50 border-b border-border flex-shrink-0">
          <div className="flex-1">
            <p className="text-[10px] text-muted font-mono">CATEGORY</p>
            <p className="text-sm font-medium text-white">{invoice.category}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-muted font-mono">ORIGINAL</p>
            <p className="text-sm font-medium text-white">${invoice.originalAmount}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-muted font-mono">DUE</p>
            <p className="text-sm font-medium text-white">
              {new Date(invoice.dueDate * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* ── Step log ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-0 scroll-inner min-h-[180px]">
          {steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              <p className="text-sm text-muted">Connecting to AI agent…</p>
            </div>
          ) : (
            steps.map((step, i) => (
              <div key={step.id} className="flex gap-3 animate-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                {/* Icon + connector */}
                <div className="flex flex-col items-center w-6 flex-shrink-0">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                    STEP_STATUS_STYLE[step.status]
                  }`}>
                    {step.status === "done"    ? "✓" :
                     step.status === "error"   ? "✕" :
                     step.status === "running" ? (
                       <span className="w-2 h-2 rounded-full bg-current animate-pulse block" />
                     ) : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-1 mb-1 min-h-[14px]" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-4 pt-0.5 flex-1">
                  <p className="text-sm font-semibold text-white leading-tight">{step.label}</p>
                  <p className="text-[11px] text-muted mt-0.5">{step.detail}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Result ── */}
        {done && result && (
          <div className="flex-shrink-0 px-6 pb-6 space-y-4 animate-fade-up border-t border-border pt-5">
            {/* Savings card */}
            <div className="bg-accent/5 border border-accent/25 rounded-2xl p-5">
              <p className="text-[10px] text-accent tracking-widest font-mono font-bold mb-3">✓ BEST OFFER SECURED</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-muted mb-1">YOU PAY</p>
                  <p className="text-3xl font-bold text-accent tabular-nums">${result.paidAmount}</p>
                  <p className="text-sm text-muted line-through mt-1">${invoice.originalAmount} original</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted mb-1">YOU SAVE</p>
                  <p className="text-2xl font-bold text-white tabular-nums">↓ ${result.savedAmount}</p>
                  <p className="text-sm text-accent">{savingsPct}% discount</p>
                </div>
              </div>
            </div>

            {result.txHash ? (
              /* Already paid */
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-accent text-sm font-semibold">
                  <span>✓</span> Payment confirmed on-chain
                </div>
                <a
                  href={`${explorer}/tx/${result.txHash}`}
                  target="_blank" rel="noopener noreferrer"
                  className="block w-full text-center py-2.5 rounded-xl border border-cyan/30 text-cyan text-xs font-mono hover:bg-cyan/5 transition-colors truncate"
                >
                  {result.txHash.slice(0,20)}…{result.txHash.slice(-10)} ↗
                </a>
                <button onClick={onClose} className="btn-ghost w-full py-3 text-sm font-semibold rounded-xl">
                  Close
                </button>
              </div>
            ) : (
              /* Pay now */
              <div className="space-y-3">
                <div className="flex items-start gap-2 bg-surface2 rounded-xl p-3 text-xs text-muted">
                  <span className="text-gold flex-shrink-0 mt-0.5">ℹ</span>
                  <p>Your wallet will ask you to approve the cUSD spend, then the agent executes the on-chain payment.</p>
                </div>
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="btn-primary w-full py-3.5 text-sm font-bold rounded-xl"
                >
                  {paying ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                      Processing…
                    </span>
                  ) : `⚡ Approve & Pay $${result.paidAmount}`}
                </button>
                <button
                  onClick={onClose}
                  disabled={paying}
                  className="btn-ghost w-full py-2.5 text-sm rounded-xl"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
