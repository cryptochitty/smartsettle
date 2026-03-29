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

/* ───────── CHAINS ───────── */

export const celoMainnet: Chain = {
  id: 42220,
  name: "Celo Mainnet",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://forno.celo.org"] } },
  blockExplorers: {
    default: { name: "Celoscan", url: "https://celoscan.io" },
  },
};

export const celoSepolia: Chain = {
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://celo-sepolia.blockscout.com",
    },
  },
  testnet: true,
};

/* ───────── ENV ───────── */

const PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

if (!PROJECT_ID) {
  console.warn("Missing WalletConnect Project ID");
}

/* ───────── CONNECTORS ───────── */

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

/* ───────── WAGMI CONFIG ───────── */

const config = createConfig({
  chains: [celoMainnet, celoSepolia],
  connectors,
  transports: {
    [celoMainnet.id]: http(),
    [celoSepolia.id]: http(),
  },
});

/* ───────── QUERY CLIENT (FIXED) ───────── */

function makeQueryClient() {
  return new QueryClient();
}

/* ───────── PROVIDERS ───────── */

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => makeQueryClient());

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
