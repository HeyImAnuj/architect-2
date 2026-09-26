import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Architect 2.0 — Dual-lane vibe coding for agentic apps",
  description:
    "Build entire agentic applications by prompting — with a Soft lane for operators and a Pro lane for engineers. Import projects, pick any agent framework, connect GitHub, and deploy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <div className="flex flex-1 flex-col">
          <Providers>{children}</Providers>
        </div>
        <footer className="relative z-10 shrink-0 border-t border-line bg-white px-4 py-3 text-center text-xs text-muted">
          Made with ❤️ by Anuj for Lyzr AI
        </footer>
      </body>
    </html>
  );
}
