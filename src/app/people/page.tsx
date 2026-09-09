import Link from "next/link";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { PersonCard } from "@/components/person/PersonCard";
import {
  getTeluguPeople,
  TELUGU_PEOPLE_CATEGORIES,
  type TeluguPeopleCategory,
} from "@/services/telugu-people";

export const metadata = { title: "Cast & Crew - Telugu Cinema" };
// Matches the people-roster derivation cache.
export const revalidate = 86400;

interface PeoplePageProps {
  searchParams: { category?: string };
}

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const roster = await getTeluguPeople();
  const validKeys = TELUGU_PEOPLE_CATEGORIES.map((c) => c.key) as string[];
  const active = (
    searchParams.category && validKeys.includes(searchParams.category)
      ? searchParams.category
      : "actors"
  ) as TeluguPeopleCategory;

  const people = roster[active] ?? [];

  return (
    <div className="app-page-shell py-8">
      <SectionHeader title="Cast & Crew" />

      <div className="mb-6 flex flex-wrap gap-2">
        {TELUGU_PEOPLE_CATEGORIES.map((category) => {
          const isActive = category.key === active;
          const count = roster[category.key]?.length ?? 0;
          return (
            <Link
              key={category.key}
              href={`/people?category=${category.key}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "border border-[rgba(194,154,98,0.46)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                  : "border border-[var(--color-border)] text-[var(--color-muted-strong)] hover:border-[rgba(194,154,98,0.4)] hover:text-[var(--color-text)]"
              }`}
            >
              {category.label}
              {count > 0 && <span className="ml-1.5 opacity-60">{count}</span>}
            </Link>
          );
        })}
      </div>

      {people.length > 0 ? (
        <div className="tile-grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {people.map((person, i) => (
            <PersonCard
              key={person.id}
              id={person.id}
              name={person.name}
              profilePath={person.profile_path}
              subtitle={`${person.role} · ${person.filmCount} ${
                person.filmCount === 1 ? "film" : "films"
              }`}
              priority={i < 6}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-[var(--color-muted)]">
          <p>No people found in this category yet. Check back as the catalog fills in.</p>
        </div>
      )}
    </div>
  );
}
