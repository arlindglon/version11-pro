import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dokan POS Pro - Smart Shop Management",
  description: "Complete POS & Inventory Management System for modern retail businesses. Track sales, manage inventory, handle customers & suppliers.",
  keywords: ["POS", "Inventory", "Shop Management", "Retail", "Dokan", "Bangladesh", "Sales", "Accounting"],
  authors: [{ name: "Dokan Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Dokan POS Pro",
    description: "Smart Shop Management System",
    url: "https://shopclient1.vercel.app",
    siteName: "Dokan POS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dokan POS Pro",
    description: "Smart Shop Management System",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
// Build fix 1774370372
