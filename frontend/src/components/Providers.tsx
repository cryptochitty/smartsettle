"use client";

import React from "react";
import {
  RainbowKitProvider,
  darkTheme,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";

import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";

import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Chain } from "wagmi/chains";
import "@rainbow-me/rainbowkit/styles.css";

/* CHAINS */
export const celoMainnet: Chain = {
  id: 42220,
  name: "Celo Mainnet",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://forno.celo.org"] } },
};

export const celoSepolia: Chain = {
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] } },
  testnet: true,
};

const PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

/* CONNECTORS */
const connectors = connectorsForWallets(
  [
    {
      groupName: "Wallets",
      wallets: [
        metaMaskWallet({ projectId: PROJECT_ID }),
        walletConnectWallet({ projectId: PROJECT_ID }),
        coinbaseWallet({ appName: "SmartSettle" }),
        rainbowWallet({ projectId: PROJECT_ID }),
        injectedWallet({ projectId: PROJECT_ID }),
      ],
    },
  ],
  {
    appName: "SmartSettle",
    projectId: PROJECT_ID,
  }
);

/* IMPORTANT FIX */
const config = createConfig({
  connectors,
  chains: [celoMainnet, celoSepolia],
  transports: {
    [celoMainnet.id]: http(),
    [celoSepolia.id]: http(),
  },
});

/* 🔥 MOVE INSIDE COMPONENT (CRITICAL FIX) */

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = React.useMemo(() => new QueryClient(), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          chains={[celoMainnet, celoSepolia]}
          theme={darkTheme({
            accentColor: "#00ff87",
            accentColorForeground: "#020c1c",
            borderRadius: "medium",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
