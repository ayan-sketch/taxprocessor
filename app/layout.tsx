import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tax Processor",
  description: "Professional tax processing and management system",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-background">
      <body className="bg-background text-foreground min-h-screen">{children}</body>
    </html>
  );
}
