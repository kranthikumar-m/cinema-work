import "server-only";
import { unstable_cache } from "next/cache";
import { getMovieCredits } from "@/services/tmdb";
import { getValidatedTeluguCatalog } from "@/services/telugu-movies";
import type { CastMember, CrewMember } from "@/types/tmdb";

/**
 * Derives the Cast & Crew roster from the validated Telugu catalog. TMDB has no
 * clean "Telugu people" list, so we aggregate the cast + crew of the catalog's
 * most popular films, rank each person by how often they appear (then by TMDB
 * popularity), and bucket them into role categories. Person detail pages and
 * clickable cast still resolve live from TMDB by id — this only powers the
 * browse/listing pages. Heavy on a cache miss (one credits call per film), so
 * the whole derivation is cached for a day.
 */

export type TeluguPeopleCategory =
  | "actors"
  | "actresses"
  | "directors"
  | "music"
  | "cinematographers"
  | "editors"
  | "producers"
  | "writers";

export const TELUGU_PEOPLE_CATEGORIES: {
  key: TeluguPeopleCategory;
  label: string;
}[] = [
  { key: "actors", label: "Actors" },
  { key: "actresses", label: "Actresses" },
  { key: "directors", label: "Directors" },
  { key: "music", label: "Music Directors" },
  { key: "cinematographers", label: "Cinematographers" },
  { key: "editors", label: "Editors" },
  { key: "producers", label: "Producers" },
  { key: "writers", label: "Writers" },
];

export interface TeluguPersonSummary {
  id: number;
  name: string;
  profile_path: string | null;
  /** Catalog films this person appears in (the ranking signal). */
  filmCount: number;
  /** TMDB popularity (tie-breaker). */
  popularity: number;
  /** Their dominant role label within this category, e.g. "Director". */
  role: string;
}

// How many catalog films to read credits for. Bounds the cost on a cache miss
// while still surfacing a deep, Telugu-relevant roster.
const MAX_FILMS_SCANNED = 80;
// Concurrency for the per-film credits fetches (kept low to avoid 429 bursts).
const CREDITS_BATCH_SIZE = 5;
const DEFAULT_CATEGORY_LIMIT = 60;

interface PersonAccumulator {
  id: number;
  name: string;
  profile_path: string | null;
  gender: number;
  knownForDepartment: string;
  popularity: number;
  castCount: number;
  jobCounts: Map<string, number>;
}

function ensurePerson(
  map: Map<number, PersonAccumulator>,
  base: { id: number; name: string; profile_path: string | null; gender?: number; popularity: number }
): PersonAccumulator {
  let person = map.get(base.id);
  if (!person) {
    person = {
      id: base.id,
      name: base.name,
      profile_path: base.profile_path,
      gender: base.gender ?? 0,
      knownForDepartment: "",
      popularity: base.popularity,
      castCount: 0,
      jobCounts: new Map(),
    };
    map.set(base.id, person);
  }
  // Keep the best (highest) popularity and a profile photo if we ever see one.
  person.popularity = Math.max(person.popularity, base.popularity);
  if (!person.profile_path && base.profile_path) person.profile_path = base.profile_path;
  if (!person.gender && base.gender) person.gender = base.gender;
  return person;
}

function matchesJob(jobCounts: Map<string, number>, test: (job: string) => boolean): number {
  let count = 0;
  for (const [job, n] of jobCounts) {
    if (test(job)) count += n;
  }
  return count;
}

function toSummary(person: PersonAccumulator, role: string, filmCount: number): TeluguPersonSummary {
  return {
    id: person.id,
    name: person.name,
    profile_path: person.profile_path,
    filmCount,
    popularity: person.popularity,
    role,
  };
}

function rank(list: TeluguPersonSummary[]): TeluguPersonSummary[] {
  return [...list].sort(
    (a, b) => b.filmCount - a.filmCount || b.popularity - a.popularity
  );
}

const buildTeluguPeople = unstable_cache(
  async (): Promise<Record<TeluguPeopleCategory, TeluguPersonSummary[]>> => {
    const catalog = await getValidatedTeluguCatalog();
    const films = [...catalog]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, MAX_FILMS_SCANNED);

    const people = new Map<number, PersonAccumulator>();

    for (let i = 0; i < films.length; i += CREDITS_BATCH_SIZE) {
      const batch = films.slice(i, i + CREDITS_BATCH_SIZE);
      const credits = await Promise.all(
        batch.map((film) =>
          getMovieCredits(film.id).catch(() => ({ cast: [], crew: [] }))
        )
      );

      for (const credit of credits) {
        (credit.cast as CastMember[]).forEach((member) => {
          const person = ensurePerson(people, member);
          person.castCount += 1;
          if (!person.knownForDepartment && member.known_for_department) {
            person.knownForDepartment = member.known_for_department;
          }
        });
        (credit.crew as CrewMember[]).forEach((member) => {
          const person = ensurePerson(people, member);
          const job = member.job || "";
          person.jobCounts.set(job, (person.jobCounts.get(job) ?? 0) + 1);
          if (!person.knownForDepartment && member.known_for_department) {
            person.knownForDepartment = member.known_for_department;
          }
        });
      }
    }

    const actors: TeluguPersonSummary[] = [];
    const actresses: TeluguPersonSummary[] = [];
    const directors: TeluguPersonSummary[] = [];
    const music: TeluguPersonSummary[] = [];
    const cinematographers: TeluguPersonSummary[] = [];
    const editors: TeluguPersonSummary[] = [];
    const producers: TeluguPersonSummary[] = [];
    const writers: TeluguPersonSummary[] = [];

    for (const person of people.values()) {
      if (person.castCount > 0) {
        if (person.gender === 1) {
          actresses.push(toSummary(person, "Actress", person.castCount));
        } else {
          actors.push(toSummary(person, "Actor", person.castCount));
        }
      }

      const directorCount = matchesJob(person.jobCounts, (j) => j === "Director");
      if (directorCount > 0) directors.push(toSummary(person, "Director", directorCount));

      const musicCount = matchesJob(
        person.jobCounts,
        (j) => /\b(music|composer|songs)\b/i.test(j)
      );
      if (musicCount > 0) music.push(toSummary(person, "Music Director", musicCount));

      const dopCount = matchesJob(
        person.jobCounts,
        (j) => /director of photography|cinematograph/i.test(j)
      );
      if (dopCount > 0) cinematographers.push(toSummary(person, "Cinematographer", dopCount));

      const editorCount = matchesJob(person.jobCounts, (j) => /\beditor\b/i.test(j));
      if (editorCount > 0) editors.push(toSummary(person, "Editor", editorCount));

      const producerCount = matchesJob(person.jobCounts, (j) => /producer/i.test(j));
      if (producerCount > 0) producers.push(toSummary(person, "Producer", producerCount));

      const writerCount = matchesJob(
        person.jobCounts,
        (j) => /writer|screenplay|story|dialogue/i.test(j)
      );
      if (writerCount > 0) writers.push(toSummary(person, "Writer", writerCount));
    }

    return {
      actors: rank(actors),
      actresses: rank(actresses),
      directors: rank(directors),
      music: rank(music),
      cinematographers: rank(cinematographers),
      editors: rank(editors),
      producers: rank(producers),
      writers: rank(writers),
    };
  },
  ["telugu-people-roster-v1"],
  { revalidate: 86400 }
);

export async function getTeluguPeople(): Promise<
  Record<TeluguPeopleCategory, TeluguPersonSummary[]>
> {
  return buildTeluguPeople();
}

export async function getTeluguPeopleByCategory(
  category: TeluguPeopleCategory,
  limit = DEFAULT_CATEGORY_LIMIT
): Promise<TeluguPersonSummary[]> {
  const all = await buildTeluguPeople();
  return (all[category] ?? []).slice(0, limit);
}
