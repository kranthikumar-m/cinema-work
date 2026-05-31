import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  browseTeluguMovies,
  type TeluguBrowseSort,
  type TeluguBrowseStatus,
} from "@/services/telugu-movies";
import { getGenres } from "@/services/tmdb";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { MovieBrowseControls } from "@/components/movie/MovieBrowseControls";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type { Genre } from "@/types/tmdb";

export const metadata = { title: "Telugu Movies - Telugu Cinema Updates" };
export const dynamic = "force-dynamic";

const VALID_SORTS: TeluguBrowseSort[] = ["popularity", "newest", "oldest", "rating"];
const VALID_STATUSES: TeluguBrowseStatus[] = ["all", "released", "upcoming"];

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildHref(
  base: { sort: string; status: string; genre: string },
  page: number
): string {
  const params = new URLSearchParams();
  if (base.sort !== "popularity") params.set("sort", base.sort);
  if (base.status !== "all") params.set("status", base.status);
  if (base.genre) params.set("genre", base.genre);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/movies?${qs}` : "/movies";
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

interface MoviesPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const sortParam = firstParam(searchParams.sort);
  const statusParam = firstParam(searchParams.status);
  const genreParam = firstParam(searchParams.genre);
  const pageParam = Number(firstParam(searchParams.page)) || 1;

  const sort: TeluguBrowseSort = VALID_SORTS.includes(sortParam as TeluguBrowseSort)
    ? (sortParam as TeluguBrowseSort)
    : "popularity";
  const status: TeluguBrowseStatus = VALID_STATUSES.includes(statusParam as TeluguBrowseStatus)
    ? (statusParam as TeluguBrowseStatus)
    : "all";
  const genreId = genreParam && /^\d+$/.test(genreParam) ? genreParam : "";

  let genres: Genre[] = [];
  try {
    genres = (await getGenres()).genres ?? [];
  } catch {
    genres = [];
  }

  try {
    const { results, page, totalPages, totalResults } = await browseTeluguMovies({
      sort,
      status,
      genreId,
      page: pageParam,
    });

    const base = { sort, status, genre: genreId };
    const pageWindow = getPageWindow(page, totalPages);

    return (
      <div className="app-page-shell py-8">
        <SectionHeader title="Telugu Movies" />

        <MovieBrowseControls genres={genres} sort={sort} status={status} genreId={genreId} />

        <p className="mb-4 text-sm text-[var(--color-muted-strong)]">
          {totalResults.toLocaleString()} movies · Page {page} of {totalPages}
        </p>

        <MovieGrid movies={results} />

        {totalPages > 1 && (
          <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
            <PageLink
              href={buildHref(base, Math.max(1, page - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
            >
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

            <PageLink
              href={buildHref(base, Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </PageLink>
          </nav>
        )}
      </div>
    );
  } catch {
    return (
      <div className="app-page-shell py-8">
        <SectionHeader title="Telugu Movies" />
        <p className="text-gray-400">Unable to load Telugu movies. Please try again later.</p>
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
          : "border-[var(--color-border)] text-[var(--color-text)] hover:border-[rgba(194,154,98,0.46)]"
      }`}
      {...rest}
    >
      {children}
    </Link>
  );
}
