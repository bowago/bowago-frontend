import type { Metadata } from "next";
import { StoreProvider } from "@/store/storeProvider";
import { cn } from "@/lib/utils";
import "./globals.css";
import { UserChat } from "@/components/ui/Chat";
import { ToastProvider } from "@/components/ui/toast/ToastProvider";
import { ToastBridge } from "@/components/ui/toast/ToastBridge";

export const metadata: Metadata = {
  title: "BowaGO — Fast Nigerian Logistics",
  description:
    "Express, standard, and economy shipping across Nigeria with real-time tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Load fonts via standard HTML — not next/font — so build never fails */}
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <StoreProvider>
          <ToastProvider>
            <ToastBridge />
            <UserChat />
            {children}
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
