import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/layout/AppChrome";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Telugu Cinema Updates",
  description:
    "Telugu-first movie discovery with TMDB data, Wikipedia-validated yearly releases, and fallback artwork retrieval for missing posters and backdrops.",
  keywords: [
    "telugu cinema",
    "telugu movies",
    "telugu movie releases",
    "tmdb telugu",
    "wikipedia telugu films",
    "telugu movie updates",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${montserrat.variable} bg-[var(--color-bg)] font-[family-name:var(--font-body)] text-[var(--color-text)] antialiased`}
      >
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
