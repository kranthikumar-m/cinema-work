/**
 * Video categories shared by the database CHECK constraint, the admin video
 * manager, the movie-page Videos section and the site-wide video wall.
 */
export const VIDEO_CATEGORIES = [
  "trailer",
  "teaser",
  "song",
  "lyrical",
  "promo",
  "interview",
  "event",
  "bts",
  "review",
  "miscellaneous",
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

export const VIDEO_CATEGORY_LABELS: Record<VideoCategory, string> = {
  trailer: "Trailers",
  teaser: "Teasers",
  song: "Songs",
  lyrical: "Lyricals",
  promo: "Promos",
  interview: "Interviews",
  event: "Events",
  bts: "Behind the Scenes",
  review: "Reviews",
  miscellaneous: "Miscellaneous",
};

export const VIDEO_CATEGORY_SINGULAR: Record<VideoCategory, string> = {
  trailer: "Trailer",
  teaser: "Teaser",
  song: "Song",
  lyrical: "Lyrical",
  promo: "Promo",
  interview: "Interview",
  event: "Event",
  bts: "Behind the Scenes",
  review: "Review",
  miscellaneous: "Miscellaneous",
};

export function isVideoCategory(value: unknown): value is VideoCategory {
  return typeof value === "string" && (VIDEO_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Best-effort category from a YouTube/TMDB video title (and TMDB's own type
 * when known). Order matters: a "Trailer Launch Event Speech" is an event, a
 * "Lyrical Video Song" is a lyrical.
 */
export function classifyVideoTitle(title: string, tmdbType?: string | null): VideoCategory {
  const text = title.toLowerCase();
  const type = (tmdbType ?? "").toLowerCase();

  if (/pre[- ]?release|press meet|success meet|thanks meet|\blaunch event\b|\bspeech\b|\bevent\b|promotions?\b/.test(text)) {
    return "event";
  }
  if (/\binterview\b|\bchit ?chat\b|in conversation|\bcandid\b/.test(text)) return "interview";
  if (/\bmaking\b|behind the scenes|\bbts\b/.test(text) || type === "behind the scenes" || type === "featurette") {
    return "bts";
  }
  if (type === "trailer" || /\btrailer\b/.test(text)) return "trailer";
  if (type === "teaser" || /\bteaser\b|\bglimpse\b|first look|\bmotion poster\b/.test(text)) return "teaser";
  if (/\blyric/.test(text)) return "lyrical";
  if (/\bsong\b|music video|\bjukebox\b|\bfull video\b/.test(text)) return "song";
  if (/\breview\b|public (talk|response)|\bgenuine talk\b/.test(text)) return "review";
  if (type === "clip" || /\bpromo\b|sneak peek|\bdialogue\b|\bscene\b/.test(text)) return "promo";
  return "miscellaneous";
}
