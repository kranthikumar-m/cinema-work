import type { ReactNode } from "react";
import { MovieDetailSubnav } from "@/components/movie/MovieDetailSubnav";

export default function MovieDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <MovieDetailSubnav />
      {children}
    </>
  );
}
