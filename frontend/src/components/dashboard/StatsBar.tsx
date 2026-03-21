"use client";
import { useAccount } from "wagmi";
import { useCUSDBalance, useAgentBalance, useTotalStats } from "@/hooks/useSmartSettle";
import { formatUnits } from "viem";

export function StatsBar() {
  const { chainId } = useAccount();
  const { data: cusdBal }  = useCUSDBalance();
  const { data: agentBal } = useAgentBalance();
  const { totalSaved, totalPayments } = useTotalStats(chainId);

  const stats = [
    { label: "Wallet cUSD",   value: cusdBal  ? `$${parseFloat(formatUnits(cusdBal, 18)).toFixed(2)}`  : "$0.00", color: "text-accent" },
    { label: "Agent Balance", value: agentBal ? `$${parseFloat(formatUnits(agentBal, 18)).toFixed(2)}` : "$0.00", color: "text-cyan"   },
    { label: "Total Saved",   value: `$${parseFloat(totalSaved).toFixed(2)}`,                           color: "text-gold"   },
    { label: "Bills Settled", value: totalPayments,                                                     color: "text-purple" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-5 animate-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
          <p className="text-[10px] text-muted tracking-widest mb-2">{s.label.toUpperCase()}</p>
          <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
