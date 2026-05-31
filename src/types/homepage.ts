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
  trailerKey?: string | null;
  trailerLabel: string;
  accentLinks: {
    director?: string;
    cast?: string;
    release?: string;
  };
  sourceMovieId?: number;
}

export interface HomepageHeroSlide {
  item: HomepageHeroItem;
  overview: string;
  genreLabel: string;
  /** IMDb rating (0–10), or null when none is available ("NR"). */
  rating: number | null;
}
