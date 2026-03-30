import { WalletPanel } from "@/components/wallet/WalletPanel";
import { Info, ShieldCheck, ExternalLink } from "lucide-react";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#070A0F] text-slate-200 font-sans">
      
      {/* Subtle background (more enterprise, less neon) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-500/5 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 right-[-200px] w-[400px] h-[400px] bg-indigo-500/5 blur-[140px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-bold text-white">
                S
              </div>

              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
                Smart<span className="text-cyan-400">Settle</span>
              </h1>
            </div>

            <p className="text-sm text-slate-400 mt-1">
              Automated healthcare settlements on Celo blockchain
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              0x71C...4f2
            </div>
          </div>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {[
            { label: "Total Saved", value: "$1,240.50", detail: "+12% this month" },
            { label: "Invoices Processed", value: "42", detail: "Avg. 3 days settlement" },
            { label: "Network", value: "Celo Mainnet", detail: "Fees < $0.01" },
          ].map((s, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition"
            >
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                {s.label}
              </p>
              <p className="text-2xl font-semibold text-white mt-2">
                {s.value}
              </p>
              <p className="text-xs text-slate-500 mt-2">{s.detail}</p>
            </div>
          ))}

        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT */}
          <section className="lg:col-span-8 space-y-5">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Recent Activity
              </h2>

              <button className="text-sm text-cyan-400 hover:text-cyan-300">
                View all
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">

              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition"
                >

                  <div className="flex items-center gap-4">

                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-white">
                        General Hospital - Lab #{829 + i}
                      </p>
                      <p className="text-xs text-slate-500">
                        Auto-settled • 2h ago
                      </p>
                    </div>

                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      $240.00
                    </p>
                    <p className="text-xs text-green-400 flex items-center gap-1 justify-end">
                      Saved $45
                      <Info className="w-3 h-3" />
                    </p>
                  </div>

                </div>
              ))}

            </div>
          </section>

          {/* RIGHT */}
          <aside className="lg:col-span-4 space-y-6">

            <WalletPanel />

            <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-transparent">

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Auto Settlement
                </h3>
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              </div>

              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Agent is actively monitoring healthcare invoices and executing settlements.
              </p>

              <button className="mt-4 w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold">
                MANAGE RULES
              </button>

            </div>

          </aside>

        </div>

        {/* FOOTER */}
        <footer className="pt-10 border-t border-white/10 space-y-6">

          <p className="text-xs text-slate-500 max-w-2xl">
            SmartSettle is a decentralized settlement protocol. It does not provide
            medical or financial advice. All actions are user-configured and executed
            on-chain.
          </p>

          <div className="flex flex-wrap gap-6 text-xs text-slate-400">
            <a className="hover:text-cyan-400">Privacy</a>
            <a className="hover:text-cyan-400">Terms</a>
            <a className="hover:text-cyan-400">Security</a>
            <a className="hover:text-cyan-400">Support</a>
          </div>

          <p className="text-[10px] text-slate-600">
            © 2026 SmartSettle · v2.4.1
          </p>

        </footer>

      </div>
    </main>
  );
}
