"use client";
import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { useCUSDBalance, useAgentBalance, useApproveCUSD } from "@/hooks/useSmartSettle";
import { ADDRESSES, AGENT_WALLET_ABI } from "@/lib/contracts";
import toast from "react-hot-toast";

export function WalletPanel() {
  const { address, chainId } = useAccount();
  const { data: cusdBal, refetch: refetchCUSD } = useCUSDBalance();
  const { data: agentBal, refetch: refetchAgent } = useAgentBalance();
  const { approve } = useApproveCUSD();
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState<"deposit" | "withdraw" | null>(null);

  const addrs = chainId === 44787 ? ADDRESSES.celoSepolia : ADDRESSES.celo;

  const handleDeposit = async () => {
    if (!amount || !address) return;
    setLoading("deposit");
    const toastId = toast.loading("Processing deposit...");
    try {
      await approve(addrs.AGENT_WALLET, amount);
      await writeContractAsync({
        address: addrs.AGENT_WALLET, abi: AGENT_WALLET_ABI,
        functionName: "deposit", args: [parseUnits(amount, 18)],
      });
      toast.success("Deposit successful!", { id: toastId });
      setAmount(""); refetchCUSD(); refetchAgent();
    } catch (e: any) {
      toast.error(e?.shortMessage || "Deposit failed", { id: toastId });
    } finally { setLoading(null); }
  };

  const handleWithdraw = async () => {
    if (!amount || !address) return;
    setLoading("withdraw");
    const toastId = toast.loading("Processing withdrawal...");
    try {
      await writeContractAsync({
        address: addrs.AGENT_WALLET, abi: AGENT_WALLET_ABI,
        functionName: "withdraw", args: [parseUnits(amount, 18)],
      });
      toast.success("Withdrawal successful!", { id: toastId });
      setAmount(""); refetchCUSD(); refetchAgent();
    } catch (e: any) {
      toast.error(e?.shortMessage || "Withdrawal failed", { id: toastId });
    } finally { setLoading(null); }
  };

  const fmt = (v: any) => v ? `$${parseFloat(formatUnits(v as bigint, 18)).toFixed(2)}` : "$0.00";

  return (
    <div className="p-6 bg-surface rounded-2xl border border-border space-y-4">
      <h2 className="text-xl font-bold text-white">Agent Wallet</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-bg rounded-xl border border-border">
          <p className="text-xs text-muted">YOUR cUSD</p>
          <p className="text-lg font-bold text-cyan">{fmt(cusdBal)}</p>
        </div>
        <div className="p-4 bg-bg rounded-xl border border-border">
          <p className="text-xs text-muted">AGENT BALANCE</p>
          <p className="text-lg font-bold text-accent">{fmt(agentBal)}</p>
        </div>
      </div>
      <input 
        type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
        className="w-full p-3 bg-bg border border-border rounded-xl text-white outline-none"
        placeholder="0.00 cUSD"
      />
      <div className="grid grid-cols-2 gap-2">
        <button onClick={handleDeposit} disabled={!!loading} className="p-3 bg-accent text-bg font-bold rounded-xl hover:opacity-90">Deposit</button>
        <button onClick={handleWithdraw} disabled={!!loading} className="p-3 border border-border text-white font-bold rounded-xl hover:bg-white/5">Withdraw</button>
      </div>
    </div>
  );
}
