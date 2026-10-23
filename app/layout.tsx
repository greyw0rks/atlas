import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./landing.css";

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

const DESCRIPTION =
  "Atlas helps AI coding agents retain project context, decisions, and knowledge across working sessions. An MCP server for Claude Code and Codex, with memories written to Walrus Memory on mainnet.";

export const metadata: Metadata = {
  title: {
    default: "Atlas — the memory layer for AI agents",
    template: "%s · Atlas",
  },
  description: DESCRIPTION,
  applicationName: "Atlas",
  keywords: [
    "AI agent memory",
    "MCP server",
    "Claude Code",
    "Codex",
    "Walrus Memory",
    "project context",
  ],
  openGraph: {
    title: "Atlas — the memory layer for AI agents",
    description: DESCRIPTION,
    siteName: "Atlas",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atlas — the memory layer for AI agents",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#090b10",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
