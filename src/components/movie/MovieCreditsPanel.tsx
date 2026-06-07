"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Users } from "lucide-react";
import type { ImdbCastCredit, ImdbCrewCredit } from "@/services/omdb";

// Key crew roles shown inline (Movie Facts style); everything else lives in the
// "View full cast & crew" popup.
const KEY_ROLES: { label: string; categoryId: string }[] = [
  { label: "Director", categoryId: "director" },
  { label: "Writer", categoryId: "writer" },
  { label: "Producer", categoryId: "producer" },
  { label: "Music", categoryId: "composer" },
  { label: "Cinematographer", categoryId: "cinematographer" },
  { label: "Editor", categoryId: "editor" },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function imdbNameUrl(id: string): string | undefined {
  return id ? `https://www.imdb.com/name/${id}/` : undefined;
}

interface CreditPerson {
  id: string;
  name: string;
  imageUrl: string | null;
  subtitle: string;
}

interface MovieCreditsPanelProps {
  cast: ImdbCastCredit[];
  crew: ImdbCrewCredit[];
  title: string;
}

export function MovieCreditsPanel({ cast, crew, title }: MovieCreditsPanelProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"cast" | "crew">("cast");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Inline key-role rows (Movie Facts layout).
  const roleRows = KEY_ROLES.map((role) => {
    const names: string[] = [];
    for (const member of crew) {
      if (member.categoryId === role.categoryId && !names.includes(member.name)) {
        names.push(member.name);
      }
    }
    return { label: role.label, values: names };
  }).filter((row) => row.values.length > 0);

  // Full cast — one card per actor (billing order), character as subtitle.
  const castPeople: CreditPerson[] = cast.map((person) => ({
    id: person.id,
    name: person.name,
    imageUrl: person.imageUrl,
    subtitle: person.characters.join(", "),
  }));

  // Full crew — deduped per person, roles combined in IMDb order.
  const crewMap = new Map<string, CreditPerson>();
  for (const member of crew) {
    const key = member.id || member.name;
    const role = member.jobs.length ? member.jobs.join(", ") : member.categoryLabel;
    const existing = crewMap.get(key);
    if (existing) {
      const roles = existing.subtitle.split(", ");
      if (role && !roles.includes(role)) {
        existing.subtitle = existing.subtitle ? `${existing.subtitle}, ${role}` : role;
      }
      if (!existing.imageUrl && member.imageUrl) existing.imageUrl = member.imageUrl;
    } else {
      crewMap.set(key, { id: member.id, name: member.name, imageUrl: member.imageUrl, subtitle: role });
    }
  }
  const crewPeople = Array.from(crewMap.values());

  if (!roleRows.length && !castPeople.length) return null;

  const people = tab === "cast" ? castPeople : crewPeople;

  return (
    <>
      {roleRows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.5)] sm:grid sm:grid-cols-2">
          {roleRows.map((row) => (
            <div
              key={row.label}
              className="flex items-start gap-4 border-b border-[var(--color-border)] px-5 py-3.5 transition last:border-b-0 hover:bg-[rgba(194,154,98,0.06)] sm:odd:border-r sm:last:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
            >
              <span className="w-36 shrink-0 pt-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[var(--color-muted)]">
                {row.label}
              </span>
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                {row.values.map((value) => (
                  <span
                    key={value}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-medium text-[var(--color-text)]"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(194,154,98,0.32)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)] transition hover:border-[rgba(194,154,98,0.6)] hover:bg-[var(--color-accent-soft)]"
      >
        <Users className="h-4 w-4" />
        View full cast &amp; crew
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm sm:p-8"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] shadow-[0_30px_90px_rgba(7,10,18,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
              <div className="flex min-w-0 items-center gap-4">
                <span className="hidden truncate text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)] sm:inline">
                  {title}
                </span>
                <div className="flex gap-1">
                  {(["cast", "crew"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTab(value)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                        tab === value
                          ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                          : "text-[var(--color-muted-strong)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      {value === "cast"
                        ? `Cast (${castPeople.length})`
                        : `Crew (${crewPeople.length})`}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/40 text-white/90 transition hover:bg-black/70 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {people.map((person) => (
                  <a
                    key={`${person.id}-${person.name}-${person.subtitle}`}
                    href={imdbNameUrl(person.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-[2/3] overflow-hidden rounded-xl bg-[var(--color-bg-elevated)]"
                  >
                    {person.imageUrl ? (
                      <Image
                        src={person.imageUrl}
                        alt={person.name}
                        fill
                        sizes="(max-width: 768px) 33vw, 16vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl font-semibold text-[var(--color-muted)]">
                        {initials(person.name)}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-2.5 pb-2.5 pt-10 text-center">
                      <p className="truncate text-sm font-semibold text-white">{person.name}</p>
                      {person.subtitle && (
                        <p className="truncate text-xs text-white/65">{person.subtitle}</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
