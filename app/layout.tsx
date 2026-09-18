import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { LenisProvider } from "@/components/animation/lenis-provider";
import { CustomCursor } from "@/components/CustomCursor";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PIGGYBACK — Intelligent Shipment Recovery",
  description:
    "Track shipments, recover misplaced cargo, and manage logistics operations with intelligent route piggybacking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${geistMono.variable} ${plusJakarta.className} antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground">
        <LenisProvider>
          <CustomCursor />
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
