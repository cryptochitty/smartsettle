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
    const tId = toast.loading("Processing...");
    try {
      await approve(addrs.AGENT_WALLET, amount);
      await writeContractAsync({
        address: addrs.AGENT_WALLET, abi: AGENT_WALLET_ABI,
        functionName: "deposit", args: [parseUnits(amount, 18)],
      });
      toast.success("Done!", { id: tId });
      setAmount(""); refetchCUSD(); refetchAgent();
    } catch (e: any) {
      toast.error("Failed", { id: tId });
    } finally { setLoading(null); }
  };

  const handleWithdraw = async () => {
    if (!amount || !address) return;
    setLoading("withdraw");
    const tId = toast.loading("Withdrawing...");
    try {
      await writeContractAsync({
        address: addrs.AGENT_WALLET, abi: AGENT_WALLET_ABI,
        functionName: "withdraw", args: [parseUnits(amount, 18)],
      });
      toast.success("Withdrawn!", { id: tId });
      setAmount(""); refetchCUSD(); refetchAgent();
    } catch (e: any) {
      toast.error("Failed", { id: tId });
    } finally { setLoading(null); }
  };

  const fmt = (v: any) => v ? `$${parseFloat(formatUnits(v as bigint, 18)).toFixed(2)}` : "$0.00";

  return (
    <div className="p-6 bg-surface border border-border rounded-2xl">
      <h2 className="text-xl font-bold mb-4">Agent Wallet</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-bg rounded-lg">
          <p className="text-xs text-muted">WALLET</p>
          <p className="font-bold">{fmt(cusdBal)}</p>
        </div>
        <div className="p-3 bg-bg rounded-lg">
          <p className="text-xs text-muted">AGENT</p>
          <p className="font-bold text-accent">{fmt(agentBal)}</p>
        </div>
      </div>
      <input 
        type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
        className="w-full p-2 bg-bg border border-border rounded mb-4 text-white"
        placeholder="0.00"
      />
      <div className="flex gap-2">
        <button onClick={handleDeposit} className="flex-1 p-2 bg-accent text-bg font-bold rounded">Deposit</button>
        <button onClick={handleWithdraw} className="flex-1 p-2 border border-border rounded">Withdraw</button>
      </div>
    </div>
  );
}
