"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Trash2 } from "lucide-react";
import { useOptionalAuthUser } from "@/components/auth/AuthUserProvider";

interface MovieAdminMenuProps {
  movieId: number;
  movieTitle: string;
}

/**
 * Admin-only overflow menu on a movie card: "Remove movie" hides the title from
 * every catalog/listing. Hover/focus-revealed so it never intrudes for regular
 * viewers. Renders nothing unless the current user is an admin.
 */
export function MovieAdminMenu({ movieId, movieTitle }: MovieAdminMenuProps) {
  const auth = useOptionalAuthUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (auth?.user?.role !== "admin") return null;

  function close() {
    setOpen(false);
    setConfirm(false);
    setError(null);
  }

  async function removeMovie(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setWorking(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/movies/${movieId}/hidden`, { method: "POST" });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to remove movie.");
      close();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove movie.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Admin options for ${movieTitle}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`absolute left-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white/90 backdrop-blur-sm transition hover:bg-black/80 focus-visible:opacity-100 ${
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-20 cursor-default"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              close();
            }}
          />
          <div
            className="absolute left-2 top-11 z-30 w-44 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-1 shadow-[0_20px_50px_rgba(7,10,18,0.55)]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {error && <p className="px-3 py-2 text-xs text-[#ffb4b0]">{error}</p>}
            {!confirm ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirm(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-[#ff9a94] transition hover:bg-[rgba(220,95,95,0.12)]"
              >
                <Trash2 className="h-4 w-4" />
                Remove movie
              </button>
            ) : (
              <div className="px-2 py-1.5">
                <p className="px-1 pb-2 text-xs text-[var(--color-muted-strong)]">
                  Remove this movie from all listings?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={working}
                    onClick={removeMovie}
                    className="flex-1 rounded-lg bg-[#b3433f] px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-[#c44e49] disabled:opacity-60"
                  >
                    {working ? "Removing…" : "Remove"}
                  </button>
                  <button
                    type="button"
                    disabled={working}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setConfirm(false);
                    }}
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
    </>
  );
}
