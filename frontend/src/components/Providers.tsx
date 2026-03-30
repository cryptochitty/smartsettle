'use client';

import React, { useState, useEffect } from "react";
import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
// ✅ Switch to viem/chains and ONLY import celo (Mainnet)
import { celo } from "viem/chains"; 
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

const config = getDefaultConfig({
  appName: "SmartSettle",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "3fcc6bba000000000000000000000000",
  chains: [celo], 
  ssr: true, 
  transports: {
    // 42220 is the Chain ID for Celo Mainnet
    [42220]: http("https://forno.celo.org"),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    setMounted(true);
  }, []);

  // This prevents hydration mismatch errors during the build
  if (!mounted) return null;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: "#00ff87" })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
