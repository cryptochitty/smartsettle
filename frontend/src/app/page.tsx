import { WalletPanel } from "@/components/wallet/WalletPanel";
import { Info, ShieldCheck, ExternalLink } from "lucide-react"; // Assuming lucide-react for icons

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#0b0d11] text-slate-200 selection:bg-accent/30 font-sans">
      {/* Background Decorative Blobs - Reduced opacity for better text contrast */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-cyan-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-black font-black italic">S</div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Smart<span className="text-accent">Settle</span>
              </h1>
            </div>
            <p className="text-slate-400 text-sm">Automated healthcare settlements on Celo.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-10 px-4 flex items-center bg-white/5 border border-white/10 rounded-xl font-medium text-sm hover:bg-white/10 transition-all cursor-pointer">
               <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
               0x71C...4f2
             </div>
          </div>
        </header>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Saved", value: "$1,240.50", color: "text-accent", detail: "+12% this month" },
            { label: "Processed", value: "42 Invoices", color: "text-white", detail: "Avg. 3 days settle time" },
            { label: "Network", value: "Celo Mainnet", color: "text-cyan-400", detail: "Transaction costs: <$0.01" },
          ].map((stat, i) => (
            <div key={i} className="group p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md hover:border-accent/30 transition-all">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">{stat.label}</p>
              <p className={`text-3xl font-mono mt-2 ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">{stat.detail}</p>
            </div>
          ))}
        </div>

        {/* Main Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Invoice List */}
          <section className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
              <button className="text-sm text-accent hover:text-accent/80 transition-colors font-medium">View Detailed Report</button>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
              {[1, 2, 3].map((item) => (
                <div key={item} className="p-5 flex items-center justify-between hover:bg-white/[0.03] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-medium text-white">General Hospital - Lab #829{item}</p>
                      <p className="text-xs text-slate-500">Settled via Smart Agent • 2h ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">$240.00</p>
                    <div className="flex items-center gap-1 justify-end text-xs text-accent">
                      <span>Saved $45.00</span>
                      <Info className="w-3 h-3 cursor-help" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right: Controls */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-10 space-y-6">
              <WalletPanel />
              
              <div className="p-6 bg-gradient-to-br from-accent/20 to-transparent border border-accent/20 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                    <ExternalLink className="w-12 h-12" />
                  </div>
                  <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                    Auto-Settle Active
                    <span className="flex h-2 w-2 rounded-full bg-accent animate-ping" />
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    Your agent is currently monitoring for new healthcare invoices.
                  </p>
                  <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all border border-white/10">
                    MANAGE AGENT RULES
                  </button>
              </div>
            </div>
          </aside>
        </div>

        {/* --- NEW: COMPLIANCE FOOTER SECTION --- */}
        <footer className="mt-20 pt-10 border-t border-white/5 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h5 className="text-sm font-bold text-white uppercase tracking-wider">Disclaimers & Terms</h5>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                SmartSettle is a decentralized facilitation tool powered by the Celo blockchain. 
                We do not provide medical, legal, or financial advice. All automated settlements 
                are executed based on user-defined parameters. SmartSettle is not responsible 
                for final insurance coverage determinations.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-4 md:justify-end text-[11px] font-bold text-slate-400">
              <a href="#" className="hover:text-accent transition-colors">PRIVACY POLICY</a>
              <a href="#" className="hover:text-accent transition-colors">TERMS OF SERVICE</a>
              <a href="#" className="hover:text-accent transition-colors">SECURITY AUDITS</a>
              <a href="#" className="hover:text-accent transition-colors">CONTACT SUPPORT</a>
            </div>
          </div>
          <p className="mt-8 text-center text-[10px] text-slate-600">
            © 2026 SmartSettle. Protocol Version 2.4.1-stable.
          </p>
        </footer>
      </div>
    </main>
  );
}
