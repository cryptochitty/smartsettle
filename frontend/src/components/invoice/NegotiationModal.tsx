"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { negotiationApi } from "@/lib/api";
import { useApproveCUSD } from "@/hooks/useSmartSettle";
import { ADDRESSES } from "@/lib/contracts";
import type { Invoice, NegotiationStep } from "@/types";
import toast from "react-hot-toast";

interface Props { invoice: Invoice; onClose: () => void; }

export function NegotiationModal({ invoice, onClose }: Props) {
  const { address, chainId } = useAccount();
  const { approve }    = useApproveCUSD();
  const [steps, setSteps]   = useState<NegotiationStep[]>([]);
  const [done, setDone]     = useState(false);
  const [result, setResult] = useState<{ paidAmount: string; savedAmount: string; txHash?: string } | null>(null);
  const [paying, setPaying] = useState(false);

  const addrs = chainId === 42220 ? ADDRESSES.celo : ADDRESSES.celoSepolia;

  // ── SSE stream from backend agent ─────────────────────────────────────────
  useEffect(() => {
    const url = negotiationApi.streamUrl(invoice.id);
    const es  = new EventSource(url);

    es.addEventListener("step", (e) => {
      const step: NegotiationStep = JSON.parse(e.data);
      setSteps((prev) => {
        const exists = prev.find((s) => s.id === step.id);
        return exists ? prev.map((s) => s.id === step.id ? step : s) : [...prev, step];
      });
    });

    es.addEventListener("done", (e) => {
      setResult(JSON.parse(e.data));
      setDone(true);
      es.close();
    });

    es.onerror = () => toast.error("Stream disconnected — retrying…");

    return () => es.close();
  }, [invoice.id]);

  // ── User approves cUSD → backend executes payment ─────────────────────────
  const handlePay = async () => {
    if (!result || !address) return;
    setPaying(true);
    try {
      toast.loading("Step 1/2 — Approve cUSD in your wallet…", { id: "pay" });
      await approve(addrs.SMART_SETTLE, parseFloat(result.paidAmount));

      toast.loading("Step 2/2 — Executing on-chain payment…", { id: "pay" });
      const res = await negotiationApi.execute(invoice.id, address);

      toast.success(`✅ Paid $${result.paidAmount} · Saved $${result.savedAmount}`, { id: "pay" });
      setResult((r) => r ? { ...r, txHash: res.txHash } : r);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Payment failed.", { id: "pay" });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <p className="text-[10px] text-muted tracking-widest">AI AGENT · LIVE</p>
            <h3 className="text-lg font-black text-white">Negotiating {invoice.providerName}</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Agent log */}
          <div>
            {steps.length === 0 && (
              <div className="text-center py-8">
                <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-muted text-sm">Connecting to agent…</p>
              </div>
            )}
            {steps.map((step, i) => (
              <div key={step.id} className="flex gap-3 pb-4 animate-fade-up">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                    step.status === "done"    ? "border-accent bg-accent/10 text-accent" :
                    step.status === "running" ? "border-cyan bg-cyan/10 text-cyan animate-pulse" :
                    step.status === "error"   ? "border-red-500 text-red-400" : "border-border text-muted"
                  }`}>
                    {step.status === "done" ? "✓" : step.status === "error" ? "✕" : step.status === "running" ? "●" : i + 1}
                  </div>
                  {i < steps.length - 1 && <div className="w-px flex-1 bg-border mt-1 min-h-[12px]" />}
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold text-white">{step.label}</p>
                  <p className="text-xs text-muted mt-0.5">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Result card */}
          {done && result && (
            <div className="border border-accent/40 bg-accent/5 rounded-xl p-5 space-y-4 animate-fade-up">
              <p className="text-[10px] text-accent tracking-widest font-bold">✓ BEST OFFER SECURED</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black text-accent">${result.paidAmount}</p>
                  <p className="text-sm text-muted line-through mt-1">${invoice.originalAmount} original</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-white">↓ ${result.savedAmount}</p>
                  <p className="text-xs text-muted">saved</p>
                </div>
              </div>

              {result.txHash ? (
                <a href={`https://celo-sepolia.blockscout.com/tx/${result.txHash}`}
                  target="_blank" rel="noopener noreferrer"
                  className="block text-center text-xs text-cyan hover:underline font-mono truncate">
                  {result.txHash}
                </a>
              ) : (
                <button onClick={handlePay} disabled={paying}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-cyan text-bg font-black text-sm tracking-wide disabled:opacity-50 hover:opacity-90 transition-opacity">
                  {paying ? "Processing…" : "⚡ APPROVE & PAY NOW"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
