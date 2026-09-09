import type { Metadata } from "next";
import { Nunito_Sans, Quicksand } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/layout/AppChrome";

// Rounded geometric faces: Quicksand carries headings, labels and tile titles;
// Nunito Sans is the body text.
const body = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
});

const heading = Quicksand({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
        className={`${body.variable} ${heading.variable} bg-[var(--color-bg)] font-[family-name:var(--font-body)] text-[var(--color-text)] antialiased`}
      >
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
