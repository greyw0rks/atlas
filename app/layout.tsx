import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Self-hosted (OFL, latin subset) so the build never depends on reaching
// fonts.googleapis.com — next/font/google intermittently fails from here.
const instrumentSerif = localFont({
  src: "./fonts/InstrumentSerif-Regular.woff2",
  variable: "--font-instrument-serif",
  weight: "400",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  title: "Atlas — Persistent Memory for Coding Agents",
  description:
    "Atlas is repository-aware memory infrastructure for autonomous coding agents. Sessions, decisions and open tasks survive across agents via MCP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} bg-canvas text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
