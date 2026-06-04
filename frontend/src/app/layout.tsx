import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TraceAgent — Intelligent Incident Analysis",
    template: "%s | TraceAgent",
  },
  description:
    "Automated stack trace analysis and root cause detection for engineering teams.",
  keywords: ["stack trace", "incident analysis", "SRE", "debugging", "DevOps"],
  authors: [{ name: "TraceAgent" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "TraceAgent",
    description: "Intelligent incident analysis pipeline for engineering teams.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="noise">{children}</body>
    </html>
  );
}