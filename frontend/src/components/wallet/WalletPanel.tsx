"use client";
import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { useCUSDBalance, useAgentBalance, useApproveCUSD } from "@/hooks/useSmartSettle";
import { ADDRESSES, AGENT_WALLET_ABI } from "@/lib/contracts";
import toast from "react-hot-toast";

export function WalletPanel() {
  const { address, chainId } = useAccount();
  const { data: cusdBal, refetch: refetchCUSD }   = useCUSDBalance();
  const { data: agentBal, refetch: refetchAgent }  = useAgentBalance();
  const { approve }            = useApproveCUSD();
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount]    = useState("");
  const [loading, setLoading]  = useState<"deposit"|"withdraw"|null>(null);

  // ✅ Match the hook logic: Default to Mainnet if chainId is null/undefined
  const addrs = chainId === 44787 ? ADDRESSES.celoSepolia : ADDRESSES.celo;

  const handleDeposit = async () => {
    if (!amount || !address) return;
    setLoading("deposit");
    try {
      toast.loading("Approving cUSD...", { id: "dep" });
      // Pass amount as string to match parseUnits logic in the hook
      await approve(addrs.AGENT_WALLET, amount);
      
      toast.loading("Depositing into agent wallet...", { id: "dep" });
      await writeContractAsync({
        address: addrs.AGENT_WALLET, 
        abi: AGENT_WALLET_ABI,
        functionName: "deposit", 
        args: [parseUnits(amount, 18)],
      });
      
      toast.success(`Deposited $${amount} cUSD`, { id: "dep" });
      setAmount("");
      refetchCUSD(); 
      refetchAgent();
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
      toast.loading("Withdrawing cUSD...", { id: "wd" });
      await writeContractAsync({
        address: addrs.AGENT_WALLET, 
        abi: AGENT_WALLET_ABI,
        functionName: "withdraw", 
        args: [parseUnits(amount, 18)],
      });
      
      toast.success(`Withdrawn $${amount} cUSD`, { id: "wd" });
      setAmount("");
      refetchCUSD(); 
      refetchAgent();
    } catch (e: any) {
      toast.error(e?.shortMessage || "Withdrawal failed", { id: "wd" });
    } finally { 
      setLoading(null); 
    }
  };

  // ✅ Explicitly cast to bigint for strict build environments
  const fmt = (v: any) =>
    v ? `$${parseFloat(formatUnits(v as bigint, 18)).toFixed(4)} cUSD` : "$0.00 cUSD";

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <p className="text-[10px] text-muted tracking-widest mb-1">AGENT WALLET</p>
        <h2 className="text-2xl font-black text-white">Manage Funds</h2>
        <p className="text-sm text-muted mt-1">
          Deposit cUSD into the agent wallet so it can autonomously pay your bills.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Your cUSD Balance",    value: fmt(cusdBal),  color: "text-cyan"    },
          { label: "Agent Wallet Balance", value: fmt(agentBal), color: "text-accent" },
        ].map((b) => (
          <div key={b.label} className="bg-surface border border-border rounded-2xl p-5">
            <p className="text-[10px] text-muted tracking-widest mb-2">{b.label.toUpperCase()}</p>
            <p className={`text-xl font-black ${b.color}`}>{b.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <p className="text-[10px] text-muted tracking-widest">AMOUNT (cUSD)</p>
        <div className="flex items-center gap-3">
          <span className="text-muted text-lg">$</span>
          <input
            type="number" min="0" step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-black text-white outline-none placeholder:text-border"
          />
          <span className="text-muted text-sm">cUSD</span>
        </div>
        <div className="flex gap-2">
          {["10", "50", "100", "500"].map((q) => (
            <button key={q} onClick={() => setAmount(q)}
              className="flex-1 py-1.5 text-xs font-bold border border-border rounded-lg text-muted hover:text-white hover:border-accent/40 transition-all">
              ${q}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleDeposit} disabled={!amount || !!loading}
            className="py-3 rounded-xl bg-gradient-to-r from-accent to-cyan text-bg font-black text-sm disabled:opacity-40 hover:opacity-90 transition-opacity">
            {loading === "deposit" ? "Depositing..." : "↓ Deposit"}
          </button>
          <button onClick={handleWithdraw} disabled={!amount || !!loading}
            className="py-3 rounded-xl border border-border text-white font-black text-sm disabled:opacity-40 hover:border-accent/40 transition-all">
            {loading === "withdraw" ? "Withdrawing..." : "↑ Withdraw"}
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full animate-pulse ${chainId === 44787 ? 'bg-yellow-500' : 'bg-accent'}`} />
        <div>
          <p className="text-xs text-white font-bold">
            {chainId === 44787 ? "Celo Sepolia Testnet" : "Celo Mainnet"}
          </p>
          <p className="text-[10px] text-muted font-mono truncate max-w-[200px]">{addrs.AGENT_WALLET}</p>
        </div>
      </div>
    </div>
  );
}
