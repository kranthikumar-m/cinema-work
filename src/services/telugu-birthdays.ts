import "server-only";
import { unstable_cache } from "next/cache";
import { getPersonDetails } from "@/services/tmdb";
import { getTeluguPeople } from "@/services/telugu-people";
import { getIndianTodayIsoDate } from "@/lib/date";

/**
 * Birthdays for the Cast & Crew roster. TMDB person details carry a birthday,
 * so we look up the most prominent people from the derived roster once a day
 * (batched, bounded) and bucket them by calendar day. The cron warms this cache
 * so the homepage never pays for the lookups.
 */

const MAX_PEOPLE = 140;
const BATCH = 6;

export interface BirthdayPerson {
  id: number;
  name: string;
  profile_path: string | null;
  /** ISO date of birth. */
  birthday: string;
  deathday: string | null;
  role: string;
}

export interface BirthdayBuckets {
  yesterday: BirthdayPerson[];
  today: BirthdayPerson[];
  tomorrow: BirthdayPerson[];
}

const buildBirthdayRoster = unstable_cache(
  async (): Promise<BirthdayPerson[]> => {
    const roster = await getTeluguPeople();
    const picks = [
      ...roster.actors.slice(0, 70),
      ...roster.actresses.slice(0, 40),
      ...roster.directors.slice(0, 20),
      ...roster.music.slice(0, 10),
    ];
    const seen = new Set<number>();
    const unique = picks.filter((person) => {
      if (seen.has(person.id)) return false;
      seen.add(person.id);
      return true;
    }).slice(0, MAX_PEOPLE);

    const out: BirthdayPerson[] = [];
    for (let i = 0; i < unique.length; i += BATCH) {
      const batch = unique.slice(i, i + BATCH);
      const details = await Promise.all(
        batch.map((person) => getPersonDetails(person.id).catch(() => null))
      );
      details.forEach((detail, index) => {
        if (!detail?.birthday) return;
        out.push({
          id: detail.id,
          name: detail.name,
          profile_path: detail.profile_path ?? batch[index].profile_path,
          birthday: detail.birthday,
          deathday: detail.deathday ?? null,
          role: batch[index].role,
        });
      });
    }
    return out;
  },
  ["telugu-birthdays-v1"],
  { revalidate: 86400 }
);

function shiftIsoDate(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function monthDay(iso: string) {
  return iso.slice(5, 10);
}

/** Roster members born yesterday / today / tomorrow (Indian calendar day). */
export async function getBirthdayBuckets(
  todayIso = getIndianTodayIsoDate()
): Promise<BirthdayBuckets> {
  let roster: BirthdayPerson[] = [];
  try {
    roster = await buildBirthdayRoster();
  } catch {
    roster = [];
  }
  const pick = (iso: string) =>
    roster
      .filter((person) => monthDay(person.birthday) === monthDay(iso))
      .sort((a, b) => a.name.localeCompare(b.name));

  return {
    yesterday: pick(shiftIsoDate(todayIso, -1)),
    today: pick(todayIso),
    tomorrow: pick(shiftIsoDate(todayIso, 1)),
  };
}

/** Warms the roster cache; called from the cron so visitors never wait on it. */
export async function warmBirthdayRoster(): Promise<number> {
  try {
    return (await buildBirthdayRoster()).length;
  } catch {
    return 0;
  }
}
