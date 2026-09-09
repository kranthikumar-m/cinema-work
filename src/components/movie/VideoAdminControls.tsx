"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MoreVertical, Wand2, Trash2, X, Search, Loader2 } from "lucide-react";
import type { YouTubeSearchResult } from "@/types/admin";

interface VideoAdminMenuProps {
  movieId: number;
  movieTitle: string;
  videoKey: string;
  videoTitle: string;
  category: string;
  /** Set when this video is backed by an admin-added custom row. */
  recordId?: number | null;
}

/**
 * Admin-only overflow menu shown on a video card: "Fix match" (replace the
 * video via a YouTube search) and "Remove" (hide it). Hover/focus-revealed so
 * it never intrudes on the page for regular viewers.
 */
export function VideoAdminMenu({
  movieId,
  movieTitle,
  videoKey,
  videoTitle,
  category,
  recordId,
}: VideoAdminMenuProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [fixOpen, setFixOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setConfirmRemove(false);
    setError(null);
  }, []);

  async function handleRemove() {
    setWorking(true);
    setError(null);
    try {
      const params = new URLSearchParams({ youtubeKey: videoKey });
      if (recordId != null) params.set("videoId", String(recordId));
      const res = await fetch(`/api/admin/movies/${movieId}/videos?${params.toString()}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to remove video.");
      closeMenu();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove video.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      {/* Kebab trigger */}
      <button
        type="button"
        aria-label="Video admin options"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        className={`absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-sm transition hover:bg-black/80 focus-visible:opacity-100 ${
          menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {menuOpen && (
        <>
          {/* Click-away backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-20 cursor-default"
            onClick={(e) => {
              e.stopPropagation();
              closeMenu();
            }}
          />
          <div
            className="absolute right-2 top-11 z-30 w-44 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-1 shadow-[0_20px_50px_rgba(7,10,18,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            {error && (
              <p className="px-3 py-2 text-xs text-[#ffb4b0]">{error}</p>
            )}
            {!confirmRemove ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setFixOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text)] transition hover:bg-[var(--color-accent-soft)]"
                >
                  <Wand2 className="h-4 w-4 text-[var(--color-accent)]" />
                  Fix match
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(true)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-[#ff9a94] transition hover:bg-[rgba(220,95,95,0.12)]"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </>
            ) : (
              <div className="px-2 py-1.5">
                <p className="px-1 pb-2 text-xs text-[var(--color-muted-strong)]">
                  Remove this video?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={working}
                    onClick={handleRemove}
                    className="flex-1 rounded-lg bg-[#b3433f] px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-[#c44e49] disabled:opacity-60"
                  >
                    {working ? "Removing…" : "Remove"}
                  </button>
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => setConfirmRemove(false)}
                    className="flex-1 rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-xs font-medium text-[var(--color-muted-strong)] transition hover:text-[var(--color-text)]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {fixOpen && (
        <FixMatchModal
          movieId={movieId}
          movieTitle={movieTitle}
          videoKey={videoKey}
          videoTitle={videoTitle}
          category={category}
          recordId={recordId}
          onClose={() => setFixOpen(false)}
          onFixed={() => {
            setFixOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

interface FixMatchModalProps extends VideoAdminMenuProps {
  onClose: () => void;
  onFixed: () => void;
}

function FixMatchModal({
  movieId,
  movieTitle,
  videoKey,
  videoTitle,
  category,
  recordId,
  onClose,
  onFixed,
}: FixMatchModalProps) {
  const [query, setQuery] = useState(`${movieTitle} ${videoTitle}`.trim());
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/videos/youtube-search?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { error?: string; results?: YouTubeSearchResult[] };
      if (!res.ok || !data.results) throw new Error(data.error || "YouTube search failed.");
      setResults(data.results);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "YouTube search failed.");
    } finally {
      setSearching(false);
    }
  }, [query]);

  async function selectReplacement(result: YouTubeSearchResult) {
    setSavingKey(result.videoId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/movies/${movieId}/videos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldKey: videoKey,
          oldRecordId: recordId ?? null,
          newKey: result.videoId,
          newTitle: result.title,
          category,
        }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to replace video.");
      onFixed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to replace video.");
      setSavingKey(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] shadow-[0_30px_90px_rgba(7,10,18,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
              Fix match
            </h3>
            <p className="mt-1 line-clamp-1 text-sm text-[var(--color-muted-strong)]">
              Replacing: <span className="text-[var(--color-text)]">{videoTitle}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch();
          }}
          className="flex gap-2 px-5 py-4"
        >
          <div className="relative flex-1">
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search YouTube for the correct video…"
              className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] pl-10 pr-4 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(26,167,230,0.46)]"
            />
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-accent)]" />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-contrast)] transition hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </button>
        </form>

        {error && (
          <p className="mx-5 mb-3 rounded-lg border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-3 py-2 text-xs text-[#ffcfcc]">
            {error}
          </p>
        )}

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 pb-5">
          {results.map((result) => {
            const isCurrent = result.videoId === videoKey;
            const saving = savingKey === result.videoId;
            return (
              <button
                key={result.videoId}
                type="button"
                disabled={savingKey != null || isCurrent}
                onClick={() => selectReplacement(result)}
                className="flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-left transition hover:border-[var(--color-border)] hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-deep)]">
                  {result.thumbnailUrl && (
                    <Image
                      src={result.thumbnailUrl}
                      alt={result.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-[var(--color-text)]">
                    {result.title}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted-strong)]">
                    {result.channelTitle}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-[var(--color-accent)]">
                  {isCurrent ? "Current" : saving ? "Saving…" : "Use this"}
                </span>
              </button>
            );
          })}

          {!results.length && (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-10 text-center text-sm text-[var(--color-muted-strong)]">
              {searched
                ? "No results. Try a different search."
                : "Search YouTube to pick the correct video."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
