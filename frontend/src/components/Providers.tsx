"use client";

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

import { createConfig, WagmiProvider, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";
import type { Chain } from "wagmi/chains";

/* ── CHAINS ───────────────────────────────────── */

// Testnet (keep for fallback)
export const celoSepolia: Chain = {
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://celo-sepolia.blockscout.com" },
  },
  testnet: true,
};

// MAINNET (PRIMARY)
export const celoMainnet: Chain = {
  id: 42220,
  name: "Celo Mainnet",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://forno.celo.org"] },
  },
  blockExplorers: {
    default: { name: "Celoscan", url: "https://celoscan.io" },
  },
};

/* ── ENV VALIDATION ───────────────────────────── */

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!PROJECT_ID) {
  throw new Error("❌ WalletConnect Project ID missing");
}

/* ── CONNECTORS ─────────────────────────────── */

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
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

/* ── WAGMI CONFIG ───────────────────────────── */

const config = createConfig({
  connectors,

  // 🔥 MAINNET FIRST = DEFAULT
  chains: [celoMainnet, celoSepolia],

  transports: {
    [celoMainnet.id]: http("https://forno.celo.org"),
    [celoSepolia.id]: http("https://forno.celo-sepolia.celo-testnet.org"),
  },

  ssr: true,
});

/* ── QUERY CLIENT ───────────────────────────── */

const queryClient = new QueryClient();

/* ── PROVIDER ───────────────────────────────── */

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          chains={[celoMainnet, celoSepolia]} // 🔥 ensures correct UI
          theme={darkTheme({
            accentColor: "#00ff87",
            accentColorForeground: "#020c1c",
            borderRadius: "medium",
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
