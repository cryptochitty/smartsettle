"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { invoiceApi } from "@/lib/api";
import type { Invoice } from "@/types";

interface Props { onNegotiate: (inv: Invoice) => void; }

const STATUS_STYLE: Record<string, string> = {
  REGISTERED: "text-gold   border-gold/30   bg-gold/10",
  NEGOTIATED: "text-cyan   border-cyan/30   bg-cyan/10",
  PAID:       "text-accent border-accent/30 bg-accent/10",
  CANCELLED:  "text-red-400 border-red-400/30 bg-red-400/10",
};

const CATEGORY_ICON: Record<string, string> = {
  Utility: "⚡", Internet: "📡", SaaS: "☁️", Mobile: "📱", Insurance: "🛡️",
};

export function BillsList({ onNegotiate }: Props) {
  const { address } = useAccount();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [mounted, setMounted]   = useState(false); // Fix for date hydration

  useEffect(() => {
    setMounted(true);
    if (!address) {
      setLoading(false);
      return;
    }
    
    invoiceApi.getByWallet(address)
      .then((d) => setInvoices(d.invoices ?? []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [address]);

  // If not mounted or still loading address, show a clean loading state
  if (!mounted || (loading && !address)) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center py-10 text-muted text-sm">
        Initializing...
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] text-muted tracking-widest">PENDING BILLS</p>
        <span className="text-xs text-muted">{invoices.length} bills</span>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted text-sm">Loading bills…</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-10 text-muted text-sm">
          No bills yet — go to <span className="text-accent">Bills</span> tab to upload one.
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv, i) => (
            <div key={inv.id || i}
              className="flex items-center gap-4 border border-border rounded-xl p-4 hover:border-accent/30 hover:bg-accent/5 transition-all animate-fade-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="text-2xl">{CATEGORY_ICON[inv.category] ?? "🧾"}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{inv.providerName}</p>
                <p className="text-xs text-muted mt-0.5">
                  {inv.category} · Due {new Date(inv.dueDate * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right mr-2">
                <p className="font-black text-white text-sm">${inv.originalAmount}</p>
                {inv.negotiatedAmount && (
                  <p className="text-xs text-accent">→ ${inv.negotiatedAmount}</p>
                )}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[inv.status] ?? "text-muted border-border"}`}>
                {inv.status}
              </span>
              {inv.status === "REGISTERED" && (
                <button onClick={() => onNegotiate(inv)}
                  className="text-xs font-black px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent to-cyan text-bg hover:opacity-90 whitespace-nowrap">
                  SETTLE →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
