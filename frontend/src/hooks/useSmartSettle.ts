import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  CUSD_ABI, SMART_SETTLE_ABI, AGENT_WALLET_ABI,
  getAddresses,
} from "@/lib/contracts";
import { statsApi } from "@/lib/api";
import { useEffect, useState } from "react";

export function useCUSDBalance() {
  const { address, chainId } = useAccount();
  const addrs = getAddresses(chainId);
  return useReadContract({
    address: addrs.CUSD,
    abi:     CUSD_ABI,
    functionName: "balanceOf",
    args:    address ? [address] : undefined,
    query:   { enabled: !!address && addrs.CUSD !== "0x" },
  });
}

export function useAgentBalance() {
  const { address, chainId } = useAccount();
  const addrs = getAddresses(chainId);
  return useReadContract({
    address: addrs.AGENT_WALLET,
    abi:     AGENT_WALLET_ABI,
    functionName: "getBalance",
    args:    address ? [address] : undefined,
    query:   { enabled: !!address && addrs.AGENT_WALLET !== "0x" },
  });
}

export function useTotalStats(chainId: number | undefined) {
  const { address } = useAccount();
  const addrs = getAddresses(chainId);
  const [totalSaved,    setTotalSaved]    = useState("0");
  const [totalPayments, setTotalPayments] = useState("0");

  const { data: savedRaw } = useReadContract({
    address: addrs.SMART_SETTLE,
    abi:     SMART_SETTLE_ABI,
    functionName: "totalSaved",
    query:   { enabled: addrs.SMART_SETTLE !== "0x" },
  });

  const { data: paymentsRaw } = useReadContract({
    address: addrs.SMART_SETTLE,
    abi:     SMART_SETTLE_ABI,
    functionName: "totalPayments",
    query:   { enabled: addrs.SMART_SETTLE !== "0x" },
  });

  useEffect(() => {
    if (savedRaw !== undefined) {
      setTotalSaved(parseFloat(formatUnits(savedRaw as bigint, 18)).toFixed(2));
    }
  }, [savedRaw]);

  useEffect(() => {
    if (paymentsRaw !== undefined) {
      setTotalPayments(String(paymentsRaw));
    }
  }, [paymentsRaw]);

  // Fallback to backend API if contracts not deployed
  useEffect(() => {
    if (!address || addrs.SMART_SETTLE !== "0x") return;
    statsApi.getByWallet(address)
      .then((d) => {
        if (d.totalSaved)    setTotalSaved(d.totalSaved);
        if (d.totalPayments) setTotalPayments(String(d.totalPayments));
      })
      .catch(() => {});
  }, [address, addrs.SMART_SETTLE]);

  return { totalSaved, totalPayments };
}

export function useApproveCUSD() {
  const { chainId } = useAccount();
  const addrs = getAddresses(chainId);
  const { writeContractAsync } = useWriteContract();

  const approve = async (spender: `0x${string}`, amountUSD: number) => {
    const amount = parseUnits(amountUSD.toFixed(6), 18);
    return writeContractAsync({
      address:      addrs.CUSD,
      abi:          CUSD_ABI,
      functionName: "approve",
      args:         [spender, amount],
    });
  };

  return { approve };
}
