'use client';

import React, { useState, useEffect } from "react";
import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
// ✅ Import from viem/chains for better compatibility
import { celo, celoSepolia } from "viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

// ✅ 1. Pull the actual ENV variables
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "PASTE_YOUR_ID_HERE_IF_ENV_FAILS";
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 42220; // Default to Mainnet if empty

// ✅ 2. Select Active Chain with a fallback to prevent "undefined" crashes
const selectedChain = CHAIN_ID === 44787 ? celoSepolia : celo;

const config = getDefaultConfig({
  appName: "SmartSettle",
  projectId: PROJECT_ID,
  chains: [selectedChain] as any,
  ssr: true, 
  transports: {
    // ✅ Use the .id directly from the selected constant
    [celo.id]: http("https://forno.celo.org"),
    [celoSepolia.id]: http("https://forno.celo-sepolia.celo-testnet.org"),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // ✅ 3. QueryClient inside component to prevent hydration/build errors
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
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
          theme={darkTheme({ 
            accentColor: "#00ff87",
            borderRadius: "medium",
          })}
          modalSize="compact"
        >
          {/* Using a standard mounting check to prevent "Cannot read properties of undefined" during SSR */}
          {mounted ? children : <div style={{ opacity: 0 }}>{children}</div>}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
