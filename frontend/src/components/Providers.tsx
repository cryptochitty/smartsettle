'use client';

import React from "react";
import { RainbowKitProvider, darkTheme, connectorsForWallets } from "@rainbow-me/rainbowkit";
import { 
  metaMaskWallet, walletConnectWallet, coinbaseWallet, rainbowWallet, injectedWallet 
} from "@rainbow-me/rainbowkit/wallets";
import { WagmiProvider, createConfig, http } from "wagmi";
import { celo, celoSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

// ✅ 1. Pull ENV variables (ensure these are set in Vercel)
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
const IS_MAINNET = process.env.NEXT_PUBLIC_NETWORK === "mainnet"; // Set this in Vercel

const queryClient = new QueryClient();

// ✅ 2. Select Active Chain based on ENV
const activeChains = IS_MAINNET ? [celo] : [celoSepolia, celo];

const connectors = connectorsForWallets(
  [
    {
      groupName: "Wallets",
      wallets: [
        metaMaskWallet({ projectId: PROJECT_ID }),
        walletConnectWallet({ projectId: PROJECT_ID }),
        coinbaseWallet({ appName: "SmartSettle" }),
        rainbowWallet({ projectId: PROJECT_ID }),
        injectedWallet(),
      ],
    },
  ],
  { appName: "SmartSettle", projectId: PROJECT_ID }
);

// ✅ 3. Configure Wagmi with SSR enabled
const config = createConfig({
  connectors,
  chains: IS_MAINNET ? [celo] : [celoSepolia],
  ssr: true, 
  transports: {
    [celo.id]: http("https://forno.celo.org"),
    [celoSepolia.id]: http("https://forno.celo-sepolia.celo-testnet.org"),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({ accentColor: "#00ff87" })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
