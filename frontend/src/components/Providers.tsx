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

// ── Constants ────────────────────────────────────────────────────────────────
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

// ── Chain definitions ─────────────────────────────────────────────────────────

export const celoMainnet = {
  id: 42220,
  name: "Celo",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://forno.celo.org"] },
    public:  { http: [process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://forno.celo.org"] },
  },
  blockExplorers: {
    default: { name: "Celoscan", url: "https://celoscan.io" },
  },
} as const satisfies Chain;

export const celoSepolia = {
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://forno.celo-sepolia.celo-testnet.org"] },
    public:  { http: ["https://forno.celo-sepolia.celo-testnet.org"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://celo-sepolia.blockscout.com" },
  },
  testnet: true,
} as const satisfies Chain;

// ── Valora wallet (Celo-native) ───────────────────────────────────────────────

const valoraWallet = ({ projectId }: { projectId: string }) => {
  const connector = walletConnectWallet({ projectId });
  
  // We use "as any" to bypass the Next.js 16 / TS 5.x strict duplicate key check
  return {
    ...connector,
    id: "valora",
    name: "Valora",
    iconUrl: "https://valoraapp.com/favicon.ico",
    iconBackground: "#FCFF52",
    downloadUrls: {
      ios:      "https://apps.apple.com/app/valora-celo-wallet/id1520414263",
      android: "https://play.google.com/store/apps/details?id=co.clabs.valora",
      qrCode:  "https://valoraapp.com",
    },
    mobile: {
      getUri: (uri: string) => `celo://wallet/wc?uri=${encodeURIComponent(uri)}`,
    },
    qrCode: { getUri: (uri: string) => uri },
  } as any; 
};

// ── Wallet config ─────────────────────────────────────────────────────────────

const connectors = connectorsForWallets(
  [
    { 
      groupName: "Celo Native",  
      wallets: [valoraWallet] 
    },
    { 
      groupName: "Popular",      
      wallets: [
        metaMaskWallet, 
        walletConnectWallet, 
        coinbaseWallet, 
        rainbowWallet, 
        injectedWallet
      ] 
    },
  ],
  { appName: "SmartSettle", projectId: PROJECT_ID }
);

const config = createConfig({
  connectors,
  chains: [celoMainnet, celoSepolia],
  transports: {
    [celoMainnet.id]: http(),
    [celoSepolia.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor:           "#00e5a0",
            accentColorForeground:  "#050810",
            borderRadius:           "medium",
            fontStack:              "system",
            overlayBlur:            "small",
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
