import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/layout/AppChrome";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
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
        className={`${inter.variable} ${manrope.variable} bg-gray-950 font-[family-name:var(--font-inter)] text-white antialiased`}
      >
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
