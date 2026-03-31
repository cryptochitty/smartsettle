"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { invoiceApi } from "@/lib/api";
import type { Invoice } from "@/types";

interface Props { onNegotiate: (inv: Invoice) => void; }

const STATUS_MAP: Record<string, string> = {
  REGISTERED: "badge badge-registered",
  NEGOTIATED: "badge badge-negotiated",
  PAID:       "badge badge-paid",
  CANCELLED:  "badge badge-cancelled",
};

const CATEGORY_ICON: Record<string, string> = {
  Utility: "⚡", Internet: "📡", SaaS: "☁️", Mobile: "📱", Insurance: "🛡️",
};

export function BillsList({ onNegotiate }: Props) {
  const { address } = useAccount();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    invoiceApi.getByWallet(address)
      .then((d) => setInvoices(d.invoices ?? []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [address]);

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <p className="text-[10px] text-muted tracking-[0.12em] font-mono mb-0.5">PENDING BILLS</p>
          <h3 className="text-[15px] font-semibold text-white">Active Invoices</h3>
        </div>
        <div className="text-[11px] text-muted bg-surface2 px-3 py-1 rounded-lg border border-border font-mono">
          {loading ? "…" : invoices.length} bills
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="skeleton h-16 animate-fade-in" style={{ animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {invoices.map((inv, i) => (
              <BillRow
                key={inv.id}
                inv={inv}
                index={i}
                onNegotiate={onNegotiate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BillRow({ inv, index, onNegotiate }: { inv: Invoice; index: number; onNegotiate: (i: Invoice) => void }) {
  const saved = inv.negotiatedAmount
    ? (parseFloat(inv.originalAmount) - parseFloat(inv.negotiatedAmount)).toFixed(2)
    : null;

  return (
    <div
      className="flex items-center gap-4 rounded-2xl border border-border bg-surface2 px-4 py-3.5 hover:border-border2 transition-all animate-fade-up group"
      style={{ animationDelay: `${index * 0.055}s` }}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-xl flex-shrink-0 border border-border">
        {CATEGORY_ICON[inv.category] ?? "🧾"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-white text-sm truncate">{inv.providerName}</p>
          <span className={STATUS_MAP[inv.status] ?? "badge text-muted border-border"}>
            {inv.status}
          </span>
        </div>
        <p className="text-[11px] text-muted mt-0.5 font-mono">
          {inv.category} · Due {new Date(inv.dueDate * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        {inv.negotiatedAmount ? (
          <>
            <p className="text-[11px] text-muted line-through">${inv.originalAmount}</p>
            <p className="font-bold text-accent text-sm">${inv.negotiatedAmount}</p>
            {saved && <p className="text-[10px] text-muted">↓ ${saved} saved</p>}
          </>
        ) : (
          <p className="font-bold text-white text-sm">${inv.originalAmount}</p>
        )}
      </div>

      {/* CTA */}
      {inv.status === "REGISTERED" && (
        <button
          onClick={() => onNegotiate(inv)}
          className="btn-primary text-[11px] font-bold px-4 py-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Settle →
        </button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-surface2 border border-border flex items-center justify-center text-2xl mx-auto mb-4">
        🧾
      </div>
      <p className="text-white font-semibold mb-1">No bills yet</p>
      <p className="text-sm text-muted">
        Upload a bill from the <span className="text-accent">Upload Bill</span> tab to get started
      </p>
    </div>
  );
}
