'use client';

import React, { useState, useEffect } from "react";
import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { celo, celoSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

// ✅ 1. Pull the actual ENV variables you confirmed
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID);

// ✅ 2. Select Active Chain based on CHAIN_ID
// Celo Mainnet is 42220, Celo Sepolia is 44787
const activeChains = CHAIN_ID === 42220 ? [celo] : [celoSepolia];

const config = getDefaultConfig({
  appName: "SmartSettle",
  projectId: PROJECT_ID,
  chains: activeChains as any,
  ssr: true, 
  transports: {
    [celo.id]: http("https://forno.celo.org"),
    [celoSepolia.id]: http("https://forno.celo-sepolia.celo-testnet.org"),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // ✅ 3. Move QueryClient INSIDE the component to prevent Vercel build errors
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({ accentColor: "#00ff87" })}
          modalSize="compact"
        >
          {/* Prevent hydration flicker while keeping content SEO friendly */}
          <div style={{ visibility: mounted ? "visible" : "hidden" }}>
            {children}
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
