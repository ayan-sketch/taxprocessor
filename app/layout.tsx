import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tax Processor",
  description: "Professional tax processing and management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">{children}</body>
    </html>
  );
}
