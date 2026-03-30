'use client';

import React, { useState, useEffect } from "react";
import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
// ✅ Switch to viem/chains for the most reliable Celo mainnet/testnet definitions
import { celo, celoSepolia } from "viem/chains"; 
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

const config = getDefaultConfig({
  appName: "SmartSettle",
  projectId: PROJECT_ID,
  // ✅ Only use celo (mainnet) to avoid any sepolia export issues
  chains: [celo], 
  ssr: true, 
  transports: {
    // ✅ Safety: Hardcode the chain IDs as numbers (Celo Mainnet is 42220)
    [42220]: http("https://forno.celo.org"),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: "#00ff87" })}>
          {/* ✅ Standard hydration guard */}
          {mounted ? children : null}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
