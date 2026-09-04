import type { Metadata, Viewport } from "next";
import { Outfit, Orbitron } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  themeColor: "#0A0F1C",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Credin - Financial What-If Engine",
  description: "Simulate financial decisions and optimize your credit health before you act.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CredIn",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head />
      <body className={cn("min-h-screen bg-background font-sans antialiased text-foreground", outfit.variable, orbitron.variable)}>
        {children}
      </body>
    </html>
  );
}
