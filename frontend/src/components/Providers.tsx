'use client';

import React, { useState, useMemo } from "react";
import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { celo, celoSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

// ✅ Pull ENV variables
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
const IS_MAINNET = process.env.NEXT_PUBLIC_NETWORK === "mainnet";

// ✅ Move Config creation to a stable reference
// Using getDefaultConfig is often safer for Vercel builds than manual connectors
const config = getDefaultConfig({
  appName: 'SmartSettle',
  projectId: PROJECT_ID,
  chains: IS_MAINNET ? [celo] : [celoSepolia],
  ssr: true, // This is key for Next.js 14
  transports: {
    [celo.id]: http("https://forno.celo.org"),
    [celoSepolia.id]: http("https://forno.celo-sepolia.celo-testnet.org"),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // ✅ CRITICAL: Create QueryClient INSIDE the component using useState
  // This prevents the "e is not a function" error during Vercel's static generation
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  }));

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Return children immediately but wrap in a check to prevent hydration mismatch
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({ accentColor: "#00ff87" })}
          modalSize="compact"
        >
          {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
