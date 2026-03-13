import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Cinemax - Movie Discovery Portal",
  description:
    "Discover trending movies, read reviews, watch trailers, and explore the world of cinema.",
  keywords: ["movies", "cinema", "reviews", "trailers", "entertainment"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-gray-950 text-white">
        <Sidebar />
        <div className="lg:pl-20 min-h-screen flex flex-col">
          <TopNav />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
