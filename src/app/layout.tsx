import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const siteUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "The Interview Room — Real Interview Experiences",
    template: "%s | The Interview Room",
  },
  description:
    "Share, browse, and learn from real interview experiences. Discover questions, difficulty ratings, and preparation roadmaps for top companies and roles.",
  keywords: [
    "interview experiences",
    "interview questions",
    "tech interviews",
    "interview preparation",
    "coding interviews",
  ],
  openGraph: {
    title: "The Interview Room",
    description: "Community-driven interview experiences and preparation.",
    url: siteUrl,
    siteName: "The Interview Room",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "The Interview Room" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
