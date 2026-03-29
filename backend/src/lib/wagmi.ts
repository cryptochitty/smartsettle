import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, mainnet } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "SmartSettle",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains: [sepolia, mainnet],

  // 🔥 CRITICAL FIX
  ssr: false,
});
