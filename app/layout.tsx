/**
 * layout.tsx
 * Root layout for PitchLab — light theme, full-height app shell.
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PitchLab — AI Sales Training",
  description: "Practice sales conversations with AI-powered simulations",
};

/**
 * Root HTML wrapper for all routes.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
