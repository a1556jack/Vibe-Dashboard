import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Use default next/font imports
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vibe Dashboard",
  description: "Modern dashboard with vibe coding style",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]`}
      >
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Background Gradient Blob for Vibe Effect */}
          <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-600/10 blur-[120px] pointer-events-none" />

          <Topbar />
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide relative z-0">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </body>
    </html>
  );
}
