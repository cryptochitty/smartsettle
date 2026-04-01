import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";

// SEO & Metadata for SmartSettle
export const metadata: Metadata = {
  title: "SmartSettle — Autonomous Bill Agent on Celo",
  description:
    "AI negotiates your bills and pays the lowest possible amount on Celo mainnet. Autonomous, secure, on-chain.",

  openGraph: {
    title: "SmartSettle",
    description: "Autonomous AI bill negotiation & on-chain payment agent",
    type: "website",
  },

  other: {
    "talentapp:project_verification":
      "abbb56d449448e5cfe329e1793e0a478a4081186f6ebe281eac16a5f7d38054a1bea13701c9fb373784e05dc8b5d28254ba7f7075559f1da6f5fa8b3867a5b01",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-white font-sans antialiased">
        {/* Decorative background glows */}
        <div className="glow-tl" />
        <div className="glow-br" />

        <Providers>
          {children}

          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#0c1422",
                color: "#e8f4ff",
                border: "1px solid #243d5e",
                borderRadius: "12px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "13px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
              },
              success: {
                iconTheme: {
                  primary: "#00e5a0",
                  secondary: "#050810",
                },
              },
              error: {
                iconTheme: {
                  primary: "#f87171",
                  secondary: "#050810",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
