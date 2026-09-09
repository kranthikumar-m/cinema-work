import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  browseTeluguMovies,
  type TeluguBrowseView,
} from "@/services/telugu-movies";
import { getGenres } from "@/services/tmdb";
import { MovieGrid } from "@/components/movie/MovieGrid";
import {
  MovieBrowseToolbar,
  type BrowseTab,
} from "@/components/movie/MovieBrowseToolbar";
import type { Genre } from "@/types/tmdb";

export const metadata = { title: "Music - Telugu Cinema Updates" };
export const dynamic = "force-dynamic";

const MUSIC_TABS: BrowseTab[] = [
  { value: "popular", label: "POPULAR" },
  { value: "latest", label: "NEW RELEASES" },
  { value: "az", label: "A-Z" },
];
const VALID_VIEWS: TeluguBrowseView[] = ["popular", "latest", "az"];

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function clampRating(value: string | undefined, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(10, num));
}

function parseYear(value: string | undefined): number | undefined {
  const num = Number(value);
  return Number.isInteger(num) && num > 1900 && num < 3000 ? num : undefined;
}

interface BrowseHrefBase {
  view?: string;
  genre?: string;
  minRating?: string;
  maxRating?: string;
  minYear?: string;
  maxYear?: string;
}

function buildHref(base: BrowseHrefBase, page: number): string {
  const params = new URLSearchParams();
  Object.entries(base).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/music?${qs}` : "/music";
}

function getPageWindow(current: number, total: number): number[] {
  const span = 5;
  let start = Math.max(1, current - Math.floor(span / 2));
  const end = Math.min(total, start + span - 1);
  start = Math.max(1, end - span + 1);
  const pages: number[] = [];
  for (let p = start; p <= end; p += 1) pages.push(p);
  return pages;
}

interface MusicPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function MusicPage({ searchParams }: MusicPageProps) {
  const viewParam = firstParam(searchParams.view) as TeluguBrowseView | undefined;
  const view: TeluguBrowseView =
    viewParam && VALID_VIEWS.includes(viewParam) ? viewParam : "latest";

  const genreParam = firstParam(searchParams.genre);
  const genreId = genreParam && /^\d+$/.test(genreParam) ? genreParam : "";
  const minRating = clampRating(firstParam(searchParams.minRating), 0);
  const maxRating = clampRating(firstParam(searchParams.maxRating), 10);
  const minYearParam = parseYear(firstParam(searchParams.minYear));
  const maxYearParam = parseYear(firstParam(searchParams.maxYear));
  const pageParam = Number(firstParam(searchParams.page)) || 1;

  let genres: Genre[] = [];
  try {
    genres = (await getGenres()).genres ?? [];
  } catch {
    genres = [];
  }

  try {
    const { results, page, totalPages, totalResults, yearBounds } =
      await browseTeluguMovies({
        view,
        genreId,
        minRating,
        maxRating,
        minYear: minYearParam,
        maxYear: maxYearParam,
        page: pageParam,
      });

    const effectiveMinYear = minYearParam ?? yearBounds.min;
    const effectiveMaxYear = maxYearParam ?? yearBounds.max;

    const base: BrowseHrefBase = {
      view: view === "latest" ? undefined : view,
      genre: genreId || undefined,
      minRating: minRating > 0 ? String(minRating) : undefined,
      maxRating: maxRating < 10 ? String(maxRating) : undefined,
      minYear:
        minYearParam && minYearParam > yearBounds.min ? String(minYearParam) : undefined,
      maxYear:
        maxYearParam && maxYearParam < yearBounds.max ? String(maxYearParam) : undefined,
    };
    const pageWindow = getPageWindow(page, totalPages);

    return (
      <div className="app-page-shell py-6">
        <MovieBrowseToolbar
          view={view}
          tabs={MUSIC_TABS}
          defaultView="latest"
          genres={genres}
          genreId={genreId}
          minRating={minRating}
          maxRating={maxRating}
          minYear={effectiveMinYear}
          maxYear={effectiveMaxYear}
          yearBounds={yearBounds}
        />

        <p className="mb-4 text-sm text-[var(--color-muted-strong)]">
          {totalResults.toLocaleString()} movies · Page {page} of {totalPages}
        </p>

        <MovieGrid movies={results} linkBase="/music" />

        {totalPages > 1 && (
          <nav
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
            aria-label="Pagination"
          >
            <PageLink href={buildHref(base, Math.max(1, page - 1))} disabled={page <= 1} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </PageLink>

            {pageWindow[0] > 1 && (
              <>
                <PageLink href={buildHref(base, 1)}>1</PageLink>
                {pageWindow[0] > 2 && <span className="px-1 text-[var(--color-muted)]">…</span>}
              </>
            )}

            {pageWindow.map((p) => (
              <PageLink key={p} href={buildHref(base, p)} active={p === page}>
                {p}
              </PageLink>
            ))}

            {pageWindow[pageWindow.length - 1] < totalPages && (
              <>
                {pageWindow[pageWindow.length - 1] < totalPages - 1 && (
                  <span className="px-1 text-[var(--color-muted)]">…</span>
                )}
                <PageLink href={buildHref(base, totalPages)}>{totalPages}</PageLink>
              </>
            )}

            <PageLink href={buildHref(base, Math.min(totalPages, page + 1))} disabled={page >= totalPages} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </PageLink>
          </nav>
        )}
      </div>
    );
  } catch {
    return (
      <div className="app-page-shell py-6">
        <p className="text-gray-400">Unable to load music. Please try again later.</p>
      </div>
    );
  }
}

function PageLink({
  href,
  children,
  active = false,
  disabled = false,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const base =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition";

  if (disabled) {
    return (
      <span
        className={`${base} cursor-not-allowed border-[var(--color-border)] text-[var(--color-muted)] opacity-50`}
        aria-disabled="true"
        {...rest}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`${base} ${
        active
          ? "border-transparent bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
          : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[rgba(26,167,230,0.46)]"
      }`}
      {...rest}
    >
      {children}
    </Link>
  );
}
