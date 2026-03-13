import type { Metadata } from "next";
import "./globals.css";
import { AppChrome } from "@/components/layout/AppChrome";

export const metadata: Metadata = {
  title: "TCU - Telugu Cinema Updates",
  description:
    "Discover updates across Indian cinema with a focus on Telugu films, plus Hindi, Tamil, Kannada, and Malayalam movie coverage.",
  keywords: ["telugu cinema", "indian cinema", "hindi movies", "tamil movies", "kannada movies", "malayalam movies"],
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
