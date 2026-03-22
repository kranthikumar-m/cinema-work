import type { Metadata } from "next";
import "./globals.css";
import { AppChrome } from "@/components/layout/AppChrome";

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
      <body className="font-sans antialiased bg-gray-950 text-white">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
