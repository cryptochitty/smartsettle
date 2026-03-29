import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import ClientToaster from "@/components/ClientToaster";

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
          <ClientToaster />
        </Providers>
      </body>
    </html>
  );
}
