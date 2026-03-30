"use client";

import { useState, useEffect } from "react";
import { WalletPanel } from "@/components/wallet/WalletPanel";
import { Info, ShieldCheck, Upload, Activity, FileText, CheckCircle, Zap, Loader2 } from "lucide-react";

export default function Dashboard() {
  // --- STATE MANAGEMENT ---
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [file, setFile] = useState(null);

  // --- LOGIC: ADD TO TERMINAL ---
  const addLog = (msg, type = "info") => {
    const newLog = { msg, type, time: new Date().toLocaleTimeString() };
    setLogs((prev) => [newLog, ...prev].slice(0, 50));
  };

  // --- LOGIC: API CALL TO RENDER ---
  const handleAnalyze = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    setProgress(10);
    addLog("Initializing Autonomous Agent...", "info");

    try {
      // 1. Simulate OCR/Scanning
      setProgress(30);
      addLog("Scanning invoice for provider details...", "info");
      
      // 2. Call your Render Backend
      // REPLACE THIS URL WITH YOUR ACTUAL RENDER URL
      const BACKEND_URL = "https://your-backend-name.onrender.com"; 
      
      const response = await fetch(`${BACKEND_URL}/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "analyze",
          timestamp: new Date().toISOString() 
        }),
      });

      if (!response.ok) throw new Error("Backend connection failed");

      const data = await response.json();
      
      setProgress(70);
      addLog("Agent detected: General Hospital - Lab Services", "success");
      addLog(`Negotiation Result: ${data.message || "Discount Secured"}`, "success");
      
      setProgress(100);
      addLog("On-chain settlement ready. Awaiting wallet signature.", "info");

    } catch (err) {
      addLog(`Critical Error: ${err.message}`, "error");
      setProgress(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      addLog(`File attached: ${selectedFile.name}`, "success");
    }
  };

  return (
    <main className="min-h-screen bg-[#060a0f] text-slate-200 font-sans selection:bg-cyan-500/30">
      
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(0,229,160,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,160,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-500/5 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-blue-500/5 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0d1520]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center font-bold text-black text-xl shadow-lg shadow-emerald-500/20">
                ⚡
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white italic">
                Smart<span className="text-emerald-400">Settle</span>
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Autonomous AI Bill Agent • Built on Celo
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">System Status</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-emerald-400">Agent Online</span>
              </div>
            </div>
            <button className="px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 transition-all">
              Connect Wallet
            </button>
          </div>
        </header>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Saved", value: "$1,240.50", color: "text-emerald-400" },
            { label: "Bills Settled", value: "42", color: "text-white" },
            { label: "Avg Discount", value: "18%", color: "text-blue-400" },
            { label: "Network", value: "Celo", color: "text-purple-400" },
          ].map((s, i) => (
            <div key={i} className="p-5 rounded-2xl border border-white/5 bg-[#0d1520] hover:border-emerald-500/30 transition-all">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* MAIN AGENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: ACTION PANEL */}
          <section className="lg:col-span-7 space-y-6">
            
            <div className="rounded-2xl border border-white/10 bg-[#0d1520] overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" /> Upload Invoice
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase">AI-Powered</span>
              </div>
              
              <div className="p-8">
                <div className="group relative border-2 border-dashed border-white/10 hover:border-emerald-500/50 rounded-2xl p-10 transition-all cursor-pointer bg-black/20 text-center">
                  <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className={`w-8 h-8 ${file ? 'text-blue-400' : 'text-emerald-400'}`} />
                  </div>
                  <h3 className="text-white font-bold text-lg">{file ? file.name : "Drop your bill here"}</h3>
                  <p className="text-slate-500 text-sm mt-1">PDF, JPG, or PNG (Max 10MB)</p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Strategy</label>
                    <select className="w-full bg-[#060a0f] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 transition-all">
                      <option>Balanced — Best Value</option>
                      <option>Aggressive — Max Discount</option>
                      <option>Fast — Quick Settlement</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Max Spend (cUSD)</label>
                    <input type="number" defaultValue="500" className="w-full bg-[#060a0f] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 transition-all" />
                  </div>
                </div>

                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !file}
                  className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-bold text-sm uppercase tracking-widest hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : "🤖"} 
                  {isAnalyzing ? "Processing..." : "Analyze & Negotiate"}
                </button>
              </div>
            </div>
          </section>

          {/* RIGHT: AGENT LOG & WALLET */}
          <aside className="lg:col-span-5 space-y-6">
            
            <WalletPanel />

            <div className="rounded-2xl border border-white/10 bg-[#0d1520] flex flex-col h-[450px] shadow-2xl">
              <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" /> AI Agent Log
                </h2>
                <button onClick={() => setLogs([])} className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-tighter">Clear</button>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-3 scrollbar-hide">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <Zap className="w-8 h-8 mb-2" />
                    <p>Awaiting user input...</p>
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`p-2 rounded border-l-2 animate-in slide-in-from-left-2 duration-300 ${log.type === 'success' ? 'border-emerald-500 bg-emerald-500/5' : log.type === 'error' ? 'border-red-500 bg-red-500/5' : 'border-blue-500 bg-blue-500/5'}`}>
                      <span className="text-slate-500 mr-2">[{log.time}]</span>
                      <span className="text-slate-200">{log.msg}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-white/5 bg-black/20">
                 <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">
                    <span>Processing Engine</span>
                    <span>{progress}%</span>
                 </div>
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                 </div>
              </div>
            </div>
          </aside>
        </div>

        {/* FOOTER */}
        <footer className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          <p>© 2026 SmartSettle Protocol • Decentralized Settlements</p>
          <div className="flex gap-6">
            <a className="hover:text-emerald-400 transition-colors cursor-pointer">Docs</a>
            <a className="hover:text-emerald-400 transition-colors cursor-pointer">Security</a>
            <a href="https://celoscan.io" target="_blank" className="hover:text-emerald-400 transition-colors">Explorer ↗</a>
          </div>
        </footer>

      </div>
    </main>
  );
}
