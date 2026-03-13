import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

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
