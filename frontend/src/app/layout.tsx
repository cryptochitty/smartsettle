import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "SmartSettle — Autonomous Bill Agent",
  description:
    "Pay bills at the lowest price, automatically. Powered by AI and Celo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-white font-sans antialiased">
        <Providers>
          {children}

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#0d1726",
                color: "#e8f0ff",
                border: "1px solid #1a2d4a",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
