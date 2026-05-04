import type { Metadata } from "next";
import "./globals.css";
import ToastContainer from "@/components/Toast";

export const metadata: Metadata = {
  title: "TradeFirewall - Stop Bad Crypto Trades Before They Happen",
  description: "AI-powered crypto pre-trade risk engine. Analyze trades before execution, detect hidden risks, and get safer alternatives.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
