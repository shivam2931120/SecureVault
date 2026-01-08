import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureVault - Zero-Knowledge Password Vault",
  description: "Secure your passwords, notes, and sensitive data with military-grade encryption. Zero-knowledge architecture ensures your secrets stay secret.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
