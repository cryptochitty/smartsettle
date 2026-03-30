import { WalletPanel } from "@/components/wallet/WalletPanel";
// Assuming you have these or similar components
// import { StatsBar } from "@/components/dashboard/StatsBar";
// import { InvoiceList } from "@/components/invoice/InvoiceList";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#0f1115] text-slate-200 selection:bg-accent/30">
      {/* Background Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-cyan-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Smart<span className="text-accent">Settle</span>
            </h1>
            <p className="text-slate-400 mt-1">Automated healthcare settlements on Celo.</p>
          </div>
          <div className="flex items-center gap-3">
             {/* Replace with your ConnectButton component */}
             <div className="h-10 px-4 flex items-center bg-white/5 border border-white/10 rounded-xl font-medium">
                Wallet Connected
             </div>
          </div>
        </header>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Saved", value: "$1,240.50", color: "text-accent" },
            { label: "Processed", value: "42 Invoices", color: "text-white" },
            { label: "Network", value: "Celo Mainnet", color: "text-cyan-400" },
          ].map((stat, i) => (
            <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">{stat.label}</p>
              <p className={`text-3xl font-mono mt-2 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Main Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Invoice List (8 cols) */}
          <section className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
              <button className="text-sm text-accent hover:underline">View All</button>
            </div>
            
            {/* Example Invoice Item Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
              {[1, 2, 3].map((item) => (
                <div key={item} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="font-medium text-white">Lab Services #829{item}</p>
                      <p className="text-xs text-slate-500">Settled 2h ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">$240.00</p>
                    <p className="text-xs text-accent">Saved $45.00</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right: Controls (4 cols) */}
          <aside className="lg:col-span-4">
            <div className="sticky top-10">
              <WalletPanel />
              
              {/* Additional Utility Card */}
              <div className="mt-6 p-6 bg-gradient-to-br from-accent/20 to-transparent border border-accent/20 rounded-2xl">
                 <h4 className="font-bold text-white mb-2">Auto-Settle Active</h4>
                 <p className="text-sm text-slate-300 leading-relaxed">
                   Your agent is currently monitoring for new healthcare invoices.
                 </p>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
