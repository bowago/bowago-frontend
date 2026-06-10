import type { Metadata } from "next";
import { Geist, Roboto } from "next/font/google";
import { StoreProvider } from "@/store/storeProvider";
import { cn } from "@/lib/utils";
import "./globals.css";
import { UserChat } from "@/components/ui/Chat";
import { ToastProvider } from "@/components/ui/toast/ToastProvider";
import { ToastBridge } from "@/components/ui/toast/ToastBridge";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const robotoSans = Roboto({
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto-sans",
  subsets: ["latin"],
  display: "swap",
});

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${robotoSans.variable} antialiased`}>
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
