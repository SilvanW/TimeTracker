import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "./components/nav";
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
  title: "TimeTracker",
  description: "Track time across projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-zinc-50 font-sans">
          <div className="flex flex-col h-full min-h-screen">
            <header className="w-full px-8 py-6 flex items-center justify-between bg-gray-300">
              <h1 className="text-2xl font-bold text-zinc-800 tracking-tight">
                TimeTracker
              </h1>
              <Nav />
            </header>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
