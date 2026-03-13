import type { HomepageHeroItem } from "@/types/homepage";

export const featuredHomepageHeroSeed: Omit<
  HomepageHeroItem,
  "id" | "backdropPath" | "imageUrl" | "watchHref" | "trailerHref" | "sourceMovieId"
> = {
  title: "Sankranthiki Vasthunnam",
  runtimeLabel: "02m 26sec",
  viewsLabel: "21,742,644 Views",
  director: "Anil Ravipudi",
  actors: ["Venkatesh Daggubati", "Aishwarya Rajesh", "Meenakshi Chaudhary"],
  releaseLabel: "14 Jan 2025",
  trailerLabel: "TRAILER",
  accentLinks: {
    director: "/news",
    cast: "/movies/popular",
    release: "/movies/trending",
  },
};

