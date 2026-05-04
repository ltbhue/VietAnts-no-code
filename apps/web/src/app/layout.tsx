import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vietants No-code Testing",
  description: "Ứng dụng kiểm thử tự động no-code cho Vietants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans min-h-screen bg-slate-950 text-slate-50 antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
