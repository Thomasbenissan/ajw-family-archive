import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AJ White Family Tree",
  description:
    "A genealogical visualization of the Andrew Jackson White family for SOC 190 — Emory University",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body
        className="h-full flex flex-col"
        style={{
          fontFamily: "'Inter', var(--font-inter), sans-serif",
          backgroundColor: "#f5f2ee",
          margin: 0,
        }}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
