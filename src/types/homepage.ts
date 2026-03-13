export interface HomepageHeroItem {
  id: string | number;
  title: string;
  backdropPath?: string | null;
  imageUrl?: string | null;
  runtimeLabel: string;
  viewsLabel: string;
  director: string;
  actors: string[];
  releaseLabel: string;
  watchHref: string;
  trailerHref: string;
  trailerLabel: string;
  accentLinks: {
    director?: string;
    cast?: string;
    release?: string;
  };
  sourceMovieId?: number;
}

