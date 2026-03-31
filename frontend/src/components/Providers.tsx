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
import { type Chain } from "viem";

// ── ENV ─────────────────────────────────────────────────────────────

const PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

// ── CELO MAINNET ───────────────────────────────────────────────────

export const celoMainnet = {
  id: 42220,
  name: "Celo",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://forno.celo.org",
      ],
    },
    public: {
      http: [
        process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://forno.celo.org",
      ],
    },
  },
  blockExplorers: {
    default: { name: "Celoscan", url: "https://celoscan.io" },
  },
} as const satisfies Chain;

// ── CELO SEPOLIA ───────────────────────────────────────────────────

export const celoSepolia = {
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://forno.celo-sepolia.celo-testnet.org"],
    },
    public: {
      http: ["https://forno.celo-sepolia.celo-testnet.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://celo-sepolia.blockscout.com",
    },
  },
  testnet: true,
} as const satisfies Chain;

// ── CONNECTORS (NO VALORA CUSTOM WALLET) ───────────────────────────

const connectors = connectorsForWallets([
  {
    groupName: "Popular",
    wallets: [
      metaMaskWallet({ projectId: PROJECT_ID }),
      walletConnectWallet({ projectId: PROJECT_ID }), // ✅ supports Valora automatically
      coinbaseWallet({ appName: "SmartSettle" }),
      rainbowWallet({ projectId: PROJECT_ID }),
      injectedWallet({ projectId: PROJECT_ID }),
    ],
  },
]);

// ── WAGMI CONFIG ───────────────────────────────────────────────────

const config = createConfig({
  connectors,
  chains: [celoMainnet, celoSepolia],
  transports: {
    [celoMainnet.id]: http(),
    [celoSepolia.id]: http(),
  },
  ssr: true,
});

// ── QUERY CLIENT ───────────────────────────────────────────────────

const queryClient = new QueryClient();

// ── PROVIDER COMPONENT ─────────────────────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#00e5a0",
            accentColorForeground: "#050810",
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
