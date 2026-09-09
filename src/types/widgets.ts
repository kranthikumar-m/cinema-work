import type { OttLanguage } from "@/services/telugu-ott";

/** OTT calendar row as shown in the homepage widget, optionally matched to a movie. */
export interface OttWidgetEntry {
  title: string;
  platform: string;
  logoPath: string | null;
  date: string | null;
  url: string | null;
  language: OttLanguage;
  movieId: number | null;
  posterPath: string | null;
}

export interface BirthdayWidgetPerson {
  id: number;
  name: string;
  profile_path: string | null;
  birthday: string;
  deathday: string | null;
  role: string;
}

export interface CriticVerdictSummary {
  movieTitle: string;
  average: number;
  count: number;
  image: string | null;
  movieId: number | null;
  posterPath: string | null;
  latestUrl: string | null;
}
