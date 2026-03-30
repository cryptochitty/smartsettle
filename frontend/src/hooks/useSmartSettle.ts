"use client";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { ADDRESSES, SMART_SETTLE_ABI, AGENT_WALLET_ABI, CUSD_ABI } from "@/lib/contracts";

// ✅ Safety Fix: Always return a valid object, default to Celo Mainnet
const getAddrs = (chainId?: number) => {
  if (chainId === 44787) return ADDRESSES.celoSepolia;
  return ADDRESSES.celo; // Default to 42220 (Mainnet)
};

export function useCUSDBalance() {
  const { address, chainId } = useAccount();
  const addrs = getAddrs(chainId);
  
  return useReadContract({
    address: addrs.CUSD, 
    abi: CUSD_ABI, 
    functionName: "balanceOf",
    args: address ? [address] : undefined, 
    query: { enabled: !!address },
  });
}

export function useAgentBalance() {
  const { address, chainId } = useAccount();
  const addrs = getAddrs(chainId);
  
  return useReadContract({
    address: addrs.AGENT_WALLET, 
    abi: AGENT_WALLET_ABI, 
    functionName: "getBalance",
    args: address ? [address] : undefined, 
    query: { enabled: !!address },
  });
}

export function useTotalStats(chainId?: number) {
  const addrs = getAddrs(chainId);
  const saved = useReadContract({ 
    address: addrs.SMART_SETTLE, 
    abi: SMART_SETTLE_ABI, 
    functionName: "totalSaved" 
  });
  const payments = useReadContract({ 
    address: addrs.SMART_SETTLE, 
    abi: SMART_SETTLE_ABI, 
    functionName: "totalPayments" 
  });

  return {
    totalSaved: saved.data ? formatUnits(saved.data as bigint, 18) : "0",
    totalPayments: payments.data ? payments.data.toString() : "0",
  };
}

export function useApproveCUSD() {
  const { chainId } = useAccount();
  const addrs = getAddrs(chainId);
  const { writeContractAsync } = useWriteContract();

  const approve = async (spender: `0x${string}`, amountUSD: string) => {
    const amount = parseUnits(amountUSD, 18);
    return writeContractAsync({ 
      address: addrs.CUSD, 
      abi: CUSD_ABI, 
      functionName: "approve", 
      args: [spender, amount] 
    });
  };
  return { approve };
}
