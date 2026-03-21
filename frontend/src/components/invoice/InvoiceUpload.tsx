"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useAccount } from "wagmi";
import { invoiceApi } from "@/lib/api";
import type { Invoice, ParsedInvoice } from "@/types";
import toast from "react-hot-toast";

interface Props { onNegotiate: (inv: Invoice) => void; }

export function InvoiceUpload({ onNegotiate }: Props) {
  const { address } = useAccount();
  const [parsing, setParsing]   = useState(false);
  const [parsed, setParsed]     = useState<ParsedInvoice | null>(null);
  const [registering, setReg]   = useState(false);

  const onDrop = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f || !address) return;
    setParsed(null);
    setParsing(true);
    try {
      const result = await invoiceApi.upload(f);
      setParsed(result.parsed);
      toast.success("Invoice parsed!");
    } catch {
      toast.error("Failed to parse invoice. Check file format.");
    } finally {
      setParsing(false);
    }
  }, [address]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "image/*": [".png", ".jpg", ".jpeg"] },
    maxFiles: 1,
    disabled: parsing,
  });

  const handleNegotiate = async () => {
    if (!parsed || !address) return;
    setReg(true);
    try {
      const result = await invoiceApi.register({
        invoiceHash:    "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join(""),
        payer:          address,
        providerName:   parsed.providerName,
        originalAmount: parsed.originalAmount,
        dueDate:        Math.floor(new Date(parsed.dueDate).getTime() / 1000),
        category:       parsed.category,
      });
      onNegotiate(result.invoice);
    } catch {
      toast.error("Failed to register invoice on-chain.");
    } finally {
      setReg(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] text-muted tracking-widest mb-1">BILL MANAGEMENT</p>
        <h2 className="text-2xl font-black text-white">Upload Invoice</h2>
        <p className="text-sm text-muted mt-1">PDF or image — the AI extracts everything automatically.</p>
      </div>

      {/* Drop zone */}
      <div {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
          isDragActive ? "border-accent bg-accent/5" : "border-border hover:border-accent/40 hover:bg-surface"
        } ${parsing ? "pointer-events-none opacity-70" : ""}`}
      >
        <input {...getInputProps()} />
        {parsing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-accent font-bold">AI is reading your invoice…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="text-5xl">📄</div>
            <p className="text-lg font-bold text-white">{isDragActive ? "Drop it here" : "Drop your invoice here"}</p>
            <p className="text-sm text-muted">PDF, PNG, JPG — up to 10MB</p>
            <span className="mt-2 px-5 py-2 bg-surface border border-border rounded-xl text-sm text-cyan">Browse files →</span>
          </div>
        )}
      </div>

      {/* Parsed result */}
      {parsed && (
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5 animate-fade-up">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted tracking-widest">EXTRACTED BY AI</p>
            <span className="text-xs text-accent bg-accent/10 border border-accent/30 px-3 py-1 rounded-full font-bold">
              {Math.round(parsed.confidence * 100)}% confidence
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              ["Provider",   parsed.providerName],
              ["Amount",     `$${parsed.originalAmount}`],
              ["Due Date",   parsed.dueDate],
              ["Category",   parsed.category],
              ["Account ID", parsed.accountId],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-border pb-3">
                <p className="text-[10px] text-muted uppercase tracking-wider">{k}</p>
                <p className="text-sm font-bold text-white mt-0.5">{v}</p>
              </div>
            ))}
          </div>

          <button onClick={handleNegotiate} disabled={registering}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-cyan text-bg font-black text-sm tracking-wide disabled:opacity-50 hover:opacity-90 transition-opacity animate-glow">
            {registering ? "Registering on-chain…" : "⚡ START AUTONOMOUS NEGOTIATION"}
          </button>
        </div>
      )}
    </div>
  );
}
