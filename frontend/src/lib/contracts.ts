typescript
export const ADDRESSES = {
  celo: {
    SMART_SETTLE:  (process.env.NEXT_PUBLIC_SMART_SETTLE_ADDRESS  || "0x") as `0x${string}`,
    AGENT_WALLET:  (process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS  || "0x") as `0x${string}`,
    RECEIPT_STORE: (process.env.NEXT_PUBLIC_RECEIPT_STORE_ADDRESS || "0x") as `0x${string}`,
    CUSD:          (process.env.NEXT_PUBLIC_CUSD_ADDRESS          || "0x765DE816845861e75A25fCA122bb6898B8B1282a") as `0x${string}`,
  },
  celoSepolia: {
    SMART_SETTLE:  (process.env.NEXT_PUBLIC_SS_SEPOLIA_ADDRESS    || "0x") as `0x${string}`,
    AGENT_WALLET:  (process.env.NEXT_PUBLIC_AW_SEPOLIA_ADDRESS    || "0x") as `0x${string}`,
    RECEIPT_STORE: (process.env.NEXT_PUBLIC_RS_SEPOLIA_ADDRESS    || "0x") as `0x${string}`,
    CUSD:          "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" as `0x${string}`,
  },
};

export function getAddresses(chainId: number | undefined) {
  return chainId === 42220 ? ADDRESSES.celo : ADDRESSES.celoSepolia;
}

export function getExplorer(chainId: number | undefined) {
  return chainId === 42220 ? "https://celoscan.io" : "https://celo-sepolia.blockscout.com";
}

export function isMainnet(chainId: number | undefined) {
  return chainId === 42220;
}

export const CUSD_ABI = [
  { name: "approve",   type: "function", stateMutability: "nonpayable",
    inputs:  [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }] },
  { name: "allowance", type: "function", stateMutability: "view",
    inputs:  [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ name: "", type: "uint256" }] },
  { name: "balanceOf", type: "function", stateMutability: "view",
    inputs:  [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }] },
] as const;

export const SMART_SETTLE_ABI = [
  { name: "getUserInvoices", type: "function", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }], outputs: [{ name: "", type: "bytes32[]" }] },
  { name: "totalSaved",    type: "function", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "totalPayments", type: "function", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "uint256" }] },
] as const;

export const AGENT_WALLET_ABI = [
  { name: "deposit",    type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "withdraw",   type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { name: "getBalance", type: "function", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
] as const;
