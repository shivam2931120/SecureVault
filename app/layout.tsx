import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureVault",
  description: "Secure password manager",
  manifest: "/manifest.json",
};

import { Toast } from "@/components/Toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=VT323&display=swap" rel="stylesheet" />
        </head>
        <body>
          <div className="crt-overlay" />
          <Toast />
          {children}
        </body>
      </html>
  );
}
