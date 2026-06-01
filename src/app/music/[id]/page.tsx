import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMovieCredits } from "@/services/tmdb";
import { getMovieDetailsWithFallback } from "@/services/telugu-movies";
import { getMovieMusic } from "@/services/movie-music";
import { getMoviePosterUrl } from "@/lib/utils";
import { MusicPlayerClient } from "./client";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const movie = await getMovieDetailsWithFallback(Number(params.id));
    return { title: `${movie.title} — Songs` };
  } catch {
    return { title: "Songs - Telugu Cinema Updates" };
  }
}

export default async function MusicPlayerPage({ params }: Props) {
  const id = Number(params.id);
  if (Number.isNaN(id)) notFound();

  let movieTitle: string;
  let albumImage: string;
  let cast: string[];
  let music;

  try {
    const [movie, credits] = await Promise.all([
      getMovieDetailsWithFallback(id),
      getMovieCredits(id).catch(() => ({ cast: [], crew: [] })),
    ]);
    movieTitle = movie.title;
    cast = (credits.cast ?? []).slice(0, 6).map((member) => member.name);
    music = await getMovieMusic(id, movie.title, movie.release_date || null);
    albumImage = music.album?.imageUrl ?? getMoviePosterUrl(movie, "w500");
  } catch {
    notFound();
  }

  return (
    <MusicPlayerClient
      movieTitle={movieTitle}
      albumImage={albumImage}
      album={music.album}
      songs={music.songs}
      cast={cast}
    />
  );
}
