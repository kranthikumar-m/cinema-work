import type { Metadata } from "next";
import "./globals.css";
import { AppChrome } from "@/components/layout/AppChrome";

export const metadata: Metadata = {
  title: "TCU - Telugu Cinema Updates",
  description:
    "Your source for the latest Telugu, Hindi, Tamil, Kannada and Malayalam movie updates, reviews, trailers, and entertainment news.",
  keywords: ["telugu movies", "indian cinema", "hindi movies", "tamil movies", "kannada movies", "malayalam movies", "reviews", "trailers"],
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
