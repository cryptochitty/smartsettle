"use client";
import { useAccount } from "wagmi";
import { useCUSDBalance, useAgentBalance, useTotalStats } from "@/hooks/useSmartSettle";
import { formatUnits } from "viem";

export function StatsBar() {
  const { chainId } = useAccount();
  const { data: cusdBal }  = useCUSDBalance();
  const { data: agentBal } = useAgentBalance();
  const { totalSaved, totalPayments } = useTotalStats(chainId);

  const fmt = (v: bigint | undefined) =>
    v ? `$${parseFloat(formatUnits(v, 18)).toFixed(2)}` : "$0.00";

  const stats = [
    {
      tag:   "WALLET BALANCE",
      value: fmt(cusdBal),
      sub:   "cUSD in your wallet",
      color: "text-cyan",
      icon:  "◎",
    },
    {
      tag:   "AGENT BALANCE",
      value: fmt(agentBal),
      sub:   "Available to agent",
      color: "text-accent",
      icon:  "⚡",
    },
    {
      tag:   "TOTAL SAVED",
      value: `$${parseFloat(totalSaved).toFixed(2)}`,
      sub:   "Across all bills",
      color: "text-gold",
      icon:  "↓",
    },
    {
      tag:   "BILLS SETTLED",
      value: totalPayments,
      sub:   "On-chain payments",
      color: "text-purple",
      icon:  "✓",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <div
          key={i}
          className="card p-5 animate-fade-up"
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] text-muted tracking-[0.12em] font-mono">{s.tag}</p>
            <span className={`text-sm ${s.color} opacity-60`}>{s.icon}</span>
          </div>
          <p className={`text-2xl font-bold ${s.color} tabular-nums`}>{s.value}</p>
          <p className="text-[11px] text-muted mt-1">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}
