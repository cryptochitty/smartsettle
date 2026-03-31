"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { useWriteContract } from "wagmi";
import { useCUSDBalance, useAgentBalance, useApproveCUSD } from "@/hooks/useSmartSettle";
import { getAddresses, getExplorer, isMainnet, AGENT_WALLET_ABI } from "@/lib/contracts";
import toast from "react-hot-toast";

const QUICK_AMOUNTS = ["10", "50", "100", "500"];

export function WalletPanel() {
  const { address, chainId } = useAccount();
  const { data: cusdBal, refetch: refetchCUSD }  = useCUSDBalance();
  const { data: agentBal, refetch: refetchAgent } = useAgentBalance();
  const { approve }            = useApproveCUSD();
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount]    = useState("");
  const [loading, setLoading]  = useState<"deposit" | "withdraw" | null>(null);

  const addrs     = getAddresses(chainId);
  const explorer  = getExplorer(chainId);
  const mainnet   = isMainnet(chainId);

  const fmt = (v: bigint | undefined) =>
    v ? parseFloat(formatUnits(v, 18)).toFixed(4) : "0.0000";

  const handleDeposit = async () => {
    if (!amount || !address) return;
    setLoading("deposit");
    try {
      toast.loading("Approving cUSD…", { id: "dep" });
      await approve(addrs.AGENT_WALLET, parseFloat(amount));

      toast.loading("Depositing into agent wallet…", { id: "dep" });
      await writeContractAsync({
        address: addrs.AGENT_WALLET,
        abi: AGENT_WALLET_ABI,
        functionName: "deposit",
        args: [parseUnits(amount, 18)],
      });

      toast.success(`Deposited $${amount} cUSD into agent wallet`, { id: "dep" });
      setAmount("");
      setTimeout(() => { refetchCUSD(); refetchAgent(); }, 2000);
    } catch (e: any) {
      toast.error(e?.shortMessage || "Deposit failed", { id: "dep" });
    } finally {
      setLoading(null);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !address) return;
    setLoading("withdraw");
    try {
      toast.loading("Withdrawing cUSD…", { id: "wd" });
      await writeContractAsync({
        address: addrs.AGENT_WALLET,
        abi: AGENT_WALLET_ABI,
        functionName: "withdraw",
        args: [parseUnits(amount, 18)],
      });

      toast.success(`Withdrawn $${amount} cUSD`, { id: "wd" });
      setAmount("");
      setTimeout(() => { refetchCUSD(); refetchAgent(); }, 2000);
    } catch (e: any) {
      toast.error(e?.shortMessage || "Withdrawal failed", { id: "wd" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] text-muted tracking-[0.12em] font-mono mb-1">AGENT WALLET</p>
        <h2 className="text-xl font-bold text-white">Manage Funds</h2>
        <p className="text-sm text-muted mt-1">
          Deposit cUSD so the AI agent can autonomously pay your bills
        </p>
      </div>

      {/* Network badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold ${
        mainnet
          ? "text-accent border-accent/25 bg-accent/6"
          : "text-gold border-gold/25 bg-gold/6"
      }`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {mainnet ? "Celo Mainnet" : "Celo Sepolia Testnet"}
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Your cUSD",      value: fmt(cusdBal),  unit: "cUSD", color: "text-cyan",   icon: "◎" },
          { label: "Agent Wallet",   value: fmt(agentBal), unit: "cUSD", color: "text-accent",  icon: "⚡" },
        ].map((b) => (
          <div key={b.label} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted tracking-wider font-mono">{b.label.toUpperCase()}</p>
              <span className={`${b.color} text-sm opacity-70`}>{b.icon}</span>
            </div>
            <p className={`text-xl font-bold ${b.color} tabular-nums`}>${b.value}</p>
            <p className="text-[10px] text-muted mt-0.5 font-mono">{b.unit}</p>
          </div>
        ))}
      </div>

      {/* Amount input */}
      <div className="card p-5 space-y-4">
        <p className="text-[10px] text-muted tracking-[0.12em] font-mono">AMOUNT (cUSD)</p>

        {/* Input */}
        <div className="flex items-center gap-3 bg-bg2 border border-border rounded-xl px-4 py-3 focus-within:border-accent transition-colors">
          <span className="text-muted text-lg">$</span>
          <input
            type="number" min="0" step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder:text-border tabular-nums"
          />
          <span className="text-muted text-sm font-mono">cUSD</span>
        </div>

        {/* Quick amounts */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(q)}
              className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                amount === q
                  ? "border-accent/40 text-accent bg-accent/8"
                  : "border-border text-muted hover:text-muted2 hover:border-border2"
              }`}
            >
              ${q}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDeposit}
            disabled={!amount || parseFloat(amount) <= 0 || !!loading}
            className="btn-primary py-3.5 text-sm font-bold rounded-xl"
          >
            {loading === "deposit" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                Depositing…
              </span>
            ) : "↓ Deposit"}
          </button>
          <button
            onClick={handleWithdraw}
            disabled={!amount || parseFloat(amount) <= 0 || !!loading}
            className="btn-ghost py-3.5 text-sm font-semibold rounded-xl"
          >
            {loading === "withdraw" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Withdrawing…
              </span>
            ) : "↑ Withdraw"}
          </button>
        </div>
      </div>

      {/* Agent wallet info */}
      <div className="card p-4 space-y-3">
        <p className="text-[10px] text-muted tracking-[0.12em] font-mono">AGENT WALLET ADDRESS</p>
        <p className="text-xs font-mono text-muted2 break-all">
          {addrs.AGENT_WALLET === "0x" ? "Not deployed yet" : addrs.AGENT_WALLET}
        </p>
        {addrs.AGENT_WALLET !== "0x" && (
          <a
            href={`${explorer}/address/${addrs.AGENT_WALLET}`}
            target="_blank" rel="noopener noreferrer"
            className="text-[11px] text-cyan hover:text-accent transition-colors"
          >
            View on Explorer ↗
          </a>
        )}
      </div>

      {/* How it works */}
      <div className="bg-surface2 border border-border rounded-2xl p-4 space-y-2">
        <p className="text-[10px] text-muted tracking-[0.12em] font-mono">ABOUT THE AGENT WALLET</p>
        <ul className="space-y-1.5">
          {[
            "Holds cUSD to pay bills autonomously on your behalf",
            "The agent is the only signer — controls full payment flow",
            "Per-tx and daily spend limits protect against misuse",
            "Withdraw anytime with no lock-up period",
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-muted">
              <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
