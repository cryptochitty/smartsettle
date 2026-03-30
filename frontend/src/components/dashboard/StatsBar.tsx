"use client";
import { useEffect, useState } from "react"; // Added for hydration
import { useAccount } from "wagmi";
import { useCUSDBalance, useAgentBalance, useTotalStats } from "@/hooks/useSmartSettle";
import { formatUnits } from "viem";

export function StatsBar() {
  const { chainId, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  // Safely call hooks - but we won't process their data until mounted
  const { data: cusdBal }  = useCUSDBalance();
  const { data: agentBal } = useAgentBalance();
  const { totalSaved = "0", totalPayments = "0" } = useTotalStats(chainId);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. If not mounted (Server Side), render a skeleton to avoid the useMemo crash
  if (!mounted) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  // 2. Safely parse values with fallbacks to prevent "toFixed of undefined"
  const safeCusd = cusdBal ? `$${parseFloat(formatUnits(cusdBal, 18)).toFixed(2)}` : "$0.00";
  const safeAgent = agentBal ? `$${parseFloat(formatUnits(agentBal, 18)).toFixed(2)}` : "$0.00";
  const safeSaved = totalSaved ? `$${parseFloat(totalSaved).toFixed(2)}` : "$0.00";

  const stats = [
    { label: "Wallet cUSD",   value: isConnected ? safeCusd : "$0.00", color: "text-accent" },
    { label: "Agent Balance", value: isConnected ? safeAgent : "$0.00", color: "text-cyan"   },
    { label: "Total Saved",   value: isConnected ? safeSaved : "$0.00", color: "text-gold"   },
    { label: "Bills Settled", value: isConnected ? totalPayments : "0", color: "text-purple" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <div key={i} 
          className="bg-surface border border-border rounded-2xl p-5 animate-fade-up" 
          style={{ animationDelay: `${i * 0.07}s` }}
        >
          <p className="text-[10px] text-muted tracking-widest mb-2">{s.label.toUpperCase()}</p>
          <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
