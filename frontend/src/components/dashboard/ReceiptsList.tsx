"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { receiptApi } from "@/lib/api";
import type { Receipt } from "@/types";

export function ReceiptsList() {
  const { address, chainId } = useAccount();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading]   = useState(true);

  const explorerBase = chainId === 42220
    ? "https://celoscan.io/tx"
    : "https://celo-sepolia.blockscout.com/tx";

  useEffect(() => {
    if (!address) return;
    receiptApi.getByWallet(address)
      .then((d) => setReceipts(d.receipts ?? []))
      .catch(() => setReceipts([]))
      .finally(() => setLoading(false));
  }, [address]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] text-muted tracking-widest mb-1">CELO BLOCKCHAIN</p>
        <h2 className="text-2xl font-black text-white">On-Chain Receipts</h2>
      </div>

      {loading ? (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center text-muted text-sm">Loading receipts…</div>
      ) : receipts.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center text-muted text-sm">
          No receipts yet — they appear here after bills are paid on-chain.
        </div>
      ) : receipts.map((r, i) => (
        <div key={r.id}
          className="bg-surface border border-border rounded-2xl p-5 animate-fade-up"
          style={{ animationDelay: `${i * 0.07}s` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                <span className="font-bold text-white text-sm">{r.providerName}</span>
                <span className="text-[10px] text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded-full font-bold">CONFIRMED</span>
              </div>
              <p className="text-xs text-cyan font-mono truncate mb-2">{r.txHash}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted">
                <span>Block #{r.blockNumber.toLocaleString()}</span>
                <span>{new Date(r.timestamp * 1000).toLocaleDateString()}</span>
                <a href={`${explorerBase}/${r.txHash}`} target="_blank" rel="noopener noreferrer"
                  className="text-cyan hover:underline">View on Explorer →</a>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-muted mb-0.5">ORIGINAL</p>
              <p className="text-sm text-muted line-through">${r.originalAmount}</p>
              <p className="text-[10px] text-muted mt-2 mb-0.5">PAID</p>
              <p className="text-xl font-black text-white">${r.paidAmount}</p>
              <p className="text-sm text-accent mt-1">↓ ${r.savedAmount} saved</p>
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4">
        <span>⛓️</span>
        <p className="text-xs text-muted">All receipts are permanently stored on Celo and cannot be altered.</p>
      </div>
    </div>
  );
}
