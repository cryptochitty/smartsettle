"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useAccount } from "wagmi";
import { invoiceApi } from "@/lib/api";
import type { Invoice, ParsedInvoice } from "@/types";
import toast from "react-hot-toast";

interface Props { onNegotiate: (inv: Invoice) => void; }

const CATEGORY_ICONS: Record<string, string> = {
  Utility: "⚡", Internet: "📡", SaaS: "☁️", Mobile: "📱", Insurance: "🛡️",
};

export function InvoiceUpload({ onNegotiate }: Props) {
  const { address } = useAccount();
  const [parsing, setParsing]   = useState(false);
  const [parsed, setParsed]     = useState<ParsedInvoice | null>(null);
  const [registering, setReg]   = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f || !address) return;
    setParsed(null);
    setFileName(f.name);
    setParsing(true);
    try {
      const result = await invoiceApi.upload(f);
      setParsed(result.parsed);
      toast.success("Invoice parsed successfully");
    } catch {
      toast.error("Failed to parse invoice — check file format");
      setFileName(null);
    } finally {
      setParsing(false);
    }
  }, [address]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "image/*": [".png", ".jpg", ".jpeg"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: parsing,
  });

  const handleNegotiate = async () => {
    if (!parsed || !address) return;
    setReg(true);
    try {
      const result = await invoiceApi.register({
        invoiceHash: "0x" + Array.from(
          crypto.getRandomValues(new Uint8Array(32))
        ).map(b => b.toString(16).padStart(2, "0")).join(""),
        payer:          address,
        providerName:   parsed.providerName,
        originalAmount: parsed.originalAmount,
        dueDate:        Math.floor(new Date(parsed.dueDate).getTime() / 1000),
        category:       parsed.category,
      });
      onNegotiate(result.invoice);
    } catch {
      toast.error("Failed to register invoice on-chain");
    } finally {
      setReg(false);
    }
  };

  const confidence = parsed ? Math.round(parsed.confidence * 100) : 0;
  const confColor = confidence >= 90 ? "text-accent" : confidence >= 70 ? "text-gold" : "text-red-400";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] text-muted tracking-[0.12em] font-mono mb-1">BILL MANAGEMENT</p>
        <h2 className="text-xl font-bold text-white">Upload Invoice</h2>
        <p className="text-sm text-muted mt-1">
          PDF or image — Claude AI extracts all details automatically
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`dropzone-idle rounded-2xl p-12 text-center transition-all select-none ${
          isDragActive ? "dropzone-active" : ""
        } ${parsing ? "pointer-events-none opacity-60" : ""}`}
      >
        <input {...getInputProps()} />

        {parsing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <div>
              <p className="text-accent font-semibold">Claude AI is reading your invoice…</p>
              <p className="text-xs text-muted mt-1">{fileName}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface2 border border-border flex items-center justify-center text-3xl">
              {isDragActive ? "📂" : "📄"}
            </div>
            <div>
              <p className="text-white font-semibold text-lg">
                {isDragActive ? "Drop file here" : "Drop your invoice here"}
              </p>
              <p className="text-sm text-muted mt-1">PDF, PNG, JPG up to 10MB</p>
            </div>
            <span className="px-5 py-2 rounded-xl bg-surface2 border border-border text-sm text-muted2 hover:border-accent/40 hover:text-accent transition-colors">
              Browse files →
            </span>
          </div>
        )}
      </div>

      {/* Parsed result */}
      {parsed && (
        <div className="card p-6 animate-fade-up space-y-5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{CATEGORY_ICONS[parsed.category] ?? "🧾"}</span>
              <div>
                <p className="text-[10px] text-muted tracking-[0.12em] font-mono">EXTRACTED BY AI</p>
                <p className="font-semibold text-white">{parsed.providerName}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border ${
              confidence >= 90
                ? "text-accent border-accent/30 bg-accent/8"
                : "text-gold border-gold/30 bg-gold/8"
            }`}>
              <span className={confColor}>●</span>
              {confidence}% confidence
            </div>
          </div>

          {/* Data grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Amount",    `$${parsed.originalAmount}`],
              ["Category",  parsed.category],
              ["Due Date",  parsed.dueDate],
              ["Account",   parsed.accountId || "—"],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface2 rounded-xl p-3.5 border border-border">
                <p className="text-[10px] text-muted tracking-wider font-mono mb-1">{k.toUpperCase()}</p>
                <p className="text-sm font-semibold text-white">{v}</p>
              </div>
            ))}
          </div>

          {/* Savings estimate */}
          <div className="flex items-center gap-3 bg-accent/5 border border-accent/20 rounded-xl p-3.5">
            <span className="text-accent text-lg">✦</span>
            <div>
              <p className="text-xs font-semibold text-accent">AI can negotiate a discount</p>
              <p className="text-[11px] text-muted mt-0.5">
                Estimated 5–15% savings depending on provider & category
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleNegotiate}
            disabled={registering}
            className="btn-primary w-full py-3.5 text-sm font-bold tracking-wide rounded-xl"
          >
            {registering ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                Registering on-chain…
              </span>
            ) : "⚡ Start Autonomous Negotiation"}
          </button>

          {/* Reset */}
          <button
            onClick={() => { setParsed(null); setFileName(null); }}
            className="w-full text-center text-xs text-muted hover:text-muted2 transition-colors py-1"
          >
            Upload a different file
          </button>
        </div>
      )}

      {/* How it works */}
      {!parsed && !parsing && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted tracking-[0.12em] font-mono">HOW IT WORKS</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { step: "1", label: "AI Reads", desc: "Claude extracts invoice details" },
              { step: "2", label: "Negotiates", desc: "Agent contacts provider for discounts" },
              { step: "3", label: "Pays", desc: "Best offer executed on Celo mainnet" },
            ].map(s => (
              <div key={s.step} className="bg-surface2 border border-border rounded-xl p-3 text-center">
                <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold flex items-center justify-center mx-auto mb-2">
                  {s.step}
                </div>
                <p className="text-xs font-semibold text-white">{s.label}</p>
                <p className="text-[10px] text-muted mt-0.5 leading-tight">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
