import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "SmartSettle — Autonomous Bill Agent",
  description: "Pay bills at the lowest price, automatically. Powered by AI and Celo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="talentapp:project_verification" content="abbb56d449448e5cfe329e1793e0a478a4081186f6ebe281eac16a5f7d38054a1bea13701c9fb373784e05dc8b5d28254ba7f7075559f1da6f5fa8b3867a5b01" />
      </head>
      <body className="bg-bg text-white font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: "#0d1726", color: "#e8f0ff", border: "1px solid #1a2d4a" },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
