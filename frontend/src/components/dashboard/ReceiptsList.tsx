"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { receiptApi } from "@/lib/api";
import { getExplorer } from "@/lib/contracts";
import type { Receipt } from "@/types";

export function ReceiptsList() {
  const { address, chainId } = useAccount();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading]   = useState(true);
  const explorer = getExplorer(chainId);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    receiptApi.getByWallet(address)
      .then((d) => setReceipts(d.receipts ?? []))
      .catch(() => setReceipts([]))
      .finally(() => setLoading(false));
  }, [address]);

  const totalSaved = receipts.reduce((acc, r) => acc + parseFloat(r.savedAmount), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-muted tracking-[0.12em] font-mono mb-1">CELO BLOCKCHAIN</p>
          <h2 className="text-xl font-bold text-white">On-Chain Receipts</h2>
          <p className="text-sm text-muted mt-0.5">Permanently stored, immutable payment history</p>
        </div>
        {receipts.length > 0 && (
          <div className="card px-5 py-3 text-right">
            <p className="text-[10px] text-muted font-mono tracking-wider">TOTAL SAVED</p>
            <p className="text-xl font-bold text-accent tabular-nums">${totalSaved.toFixed(2)}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-28" />)}
        </div>
      ) : receipts.length === 0 ? (
        <div className="card p-12 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-surface2 border border-border flex items-center justify-center text-2xl mx-auto mb-4">⛓</div>
          <p className="text-white font-semibold mb-1">No receipts yet</p>
          <p className="text-sm text-muted">Receipts appear here after bills are settled on-chain</p>
        </div>
      ) : (
        <>
          {receipts.map((r, i) => (
            <div
              key={r.id}
              className="card p-5 animate-fade-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="flex items-start gap-4">
                {/* Left */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    <span className="font-semibold text-white">{r.providerName}</span>
                    <span className="badge badge-paid">CONFIRMED</span>
                    <span className="text-[10px] text-muted font-mono">{r.category}</span>
                  </div>
                  <p className="text-[11px] font-mono text-cyan truncate mb-2">
                    {r.txHash}
                  </p>
                  <div className="flex flex-wrap gap-4 text-[11px] text-muted">
                    <span>Block #{r.blockNumber.toLocaleString()}</span>
                    <span>{new Date(r.timestamp * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                    <a
                      href={`${explorer}/tx/${r.txHash}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-cyan hover:text-accent transition-colors"
                    >
                      View on Explorer ↗
                    </a>
                  </div>
                </div>

                {/* Right */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-muted font-mono mb-0.5">ORIGINAL</p>
                  <p className="text-sm text-muted line-through">${r.originalAmount}</p>
                  <p className="text-[10px] text-muted font-mono mt-2 mb-0.5">PAID</p>
                  <p className="text-xl font-bold text-white tabular-nums">${r.paidAmount}</p>
                  <p className="text-sm text-accent mt-1 font-semibold">↓ ${r.savedAmount}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 bg-surface2 border border-border rounded-2xl p-4 animate-fade-in">
            <span className="text-lg">⛓</span>
            <p className="text-xs text-muted">
              All receipts are permanently recorded on the Celo blockchain and cannot be altered or deleted.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
