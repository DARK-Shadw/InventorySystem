import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Safeen Inventory Management",
  description:
    "Inventory Management System for Safeen Survey & Subsea Services",
  icons: {
    icon: [
      { url: "/safeen-favicon.svg", type: "image/svg+xml" },
      { url: "/safeen-favicon.png" },
    ],
    shortcut: "/safeen-favicon.svg",
    apple: "/safeen-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="h-full font-sans antialiased">{children}</body>
    </html>
  );
}
