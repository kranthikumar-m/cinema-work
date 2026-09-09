import { notFound } from "next/navigation";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Globe,
  Instagram,
  Twitter,
  ExternalLink,
} from "lucide-react";
import { getPersonDetails } from "@/services/tmdb";
import { getImageUrl, formatDate } from "@/lib/utils";
import { MovieCard } from "@/components/movie/MovieCard";
import { PhotoGallery } from "@/components/movie/PhotoGallery";
import { ExpandableText } from "@/components/shared/ExpandableText";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type {
  Movie,
  MovieImage,
  PersonDetails,
  PersonMovieCredit,
} from "@/types/tmdb";

export const revalidate = 86400;

interface PersonPageProps {
  params: { id: string };
}

const MAX_FILMOGRAPHY = 48;

function creditToMovie(credit: PersonMovieCredit): Movie {
  return {
    id: credit.id,
    title: credit.title,
    original_title: credit.original_title,
    overview: credit.overview ?? "",
    poster_path: credit.poster_path,
    backdrop_path: credit.backdrop_path,
    release_date: credit.release_date ?? "",
    vote_average: credit.vote_average ?? 0,
    vote_count: credit.vote_count ?? 0,
    popularity: credit.popularity ?? 0,
    genre_ids: credit.genre_ids ?? [],
    adult: false,
    original_language: credit.original_language ?? "",
    video: false,
  };
}

function computeAge(birthday: string, deathday: string | null): number | null {
  const birth = new Date(birthday);
  if (Number.isNaN(birth.getTime())) return null;
  const end = deathday ? new Date(deathday) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

export async function generateMetadata({ params }: PersonPageProps) {
  try {
    const person = await getPersonDetails(Number(params.id));
    return { title: `${person.name} - Telugu Cinema` };
  } catch {
    return { title: "Cast & Crew - Telugu Cinema" };
  }
}

export default async function PersonPage({ params }: PersonPageProps) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  let person: PersonDetails;
  try {
    person = await getPersonDetails(id);
  } catch {
    notFound();
  }

  // Merge cast + crew credits, one row per film, newest first.
  const creditsById = new Map<number, PersonMovieCredit>();
  for (const credit of [
    ...(person.movie_credits?.cast ?? []),
    ...(person.movie_credits?.crew ?? []),
  ]) {
    if (credit.title && !creditsById.has(credit.id)) creditsById.set(credit.id, credit);
  }
  const allCredits = Array.from(creditsById.values());

  const filmography = [...allCredits]
    .sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""))
    .slice(0, MAX_FILMOGRAPHY)
    .map(creditToMovie);

  const knownFor = [...allCredits]
    .sort(
      (a, b) =>
        (b.popularity ?? 0) - (a.popularity ?? 0) ||
        (b.vote_count ?? 0) - (a.vote_count ?? 0)
    )
    .slice(0, 6)
    .map(creditToMovie);

  const photos: MovieImage[] = (person.images?.profiles ?? []).map((profile) => ({
    aspect_ratio: profile.aspect_ratio,
    height: profile.height,
    width: profile.width,
    file_path: profile.file_path,
    vote_average: profile.vote_average,
    vote_count: 0,
  }));

  const age = person.birthday ? computeAge(person.birthday, person.deathday) : null;
  const imdbId = person.imdb_id || person.external_ids?.imdb_id || null;
  const instagram = person.external_ids?.instagram_id || null;
  const twitter = person.external_ids?.twitter_id || null;

  const links: { href: string; label: string; icon: typeof Globe }[] = [];
  if (imdbId) links.push({ href: `https://www.imdb.com/name/${imdbId}`, label: "IMDb", icon: ExternalLink });
  if (person.homepage) links.push({ href: person.homepage, label: "Website", icon: Globe });
  if (instagram) links.push({ href: `https://www.instagram.com/${instagram}`, label: "Instagram", icon: Instagram });
  if (twitter) links.push({ href: `https://twitter.com/${twitter}`, label: "Twitter", icon: Twitter });

  return (
    <div className="app-page-shell py-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        <div className="mx-auto w-44 shrink-0 sm:mx-0 sm:w-56">
          <div className="relative aspect-[2/3] overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-[var(--color-bg-deep)]">
            <Image
              src={getImageUrl(person.profile_path, "w500")}
              alt={person.name}
              fill
              sizes="224px"
              className="object-cover"
              priority
              unoptimized={!person.profile_path}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-text)] sm:text-4xl">
            {person.name}
          </h1>
          {person.known_for_department && (
            <span className="mt-2 inline-block rounded-full border border-[rgba(26,167,230,0.32)] bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
              {person.known_for_department}
            </span>
          )}

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--color-muted-strong)]">
            {person.birthday && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[var(--color-accent)]" />
                {formatDate(person.birthday)}
                {age !== null && ` (${person.deathday ? "" : "age "}${age})`}
              </span>
            )}
            {person.place_of_birth && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[var(--color-accent)]" />
                {person.place_of_birth}
              </span>
            )}
          </div>

          {links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted-strong)] transition hover:border-[rgba(26,167,230,0.4)] hover:text-[var(--color-text)]"
                >
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {person.biography && (
            <div className="mt-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Biography
              </h2>
              <ExpandableText text={person.biography} />
            </div>
          )}
        </div>
      </div>

      {/* Known For */}
      {knownFor.length > 0 && (
        <div className="mt-10">
          <SectionHeader title="Known For" />
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {knownFor.map((movie) => (
              <MovieCard key={`known-${movie.id}`} movie={movie} />
            ))}
          </div>
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="mt-10">
          <SectionHeader title="Photos" />
          <PhotoGallery images={[]} posterImages={photos} title={person.name} />
        </div>
      )}

      {/* Filmography */}
      {filmography.length > 0 && (
        <div className="mt-10">
          <SectionHeader title="Filmography" />
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {filmography.map((movie) => (
              <MovieCard key={`film-${movie.id}`} movie={movie} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
