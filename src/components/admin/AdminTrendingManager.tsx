"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Film, RotateCcw, Save, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminTrendingMovie } from "@/types/admin";

export function AdminTrendingManager() {
  const [movies, setMovies] = useState<AdminTrendingMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/trending");
      const data = (await res.json()) as {
        error?: string;
        results?: AdminTrendingMovie[];
      };
      if (!res.ok || !data.results) throw new Error(data.error || "Failed to load.");
      setMovies(data.results);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trending.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= movies.length) return;
    setMovies((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDirty(true);
    setSuccess(null);
  }

  async function saveOrder() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/trending/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: movies.map((m) => m.id) }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to save order.");
      setSuccess("Trending order saved. Unreleased movies will hold these positions until they release.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save order.");
    } finally {
      setSaving(false);
    }
  }

  async function resetOrder() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/trending/order", { method: "DELETE" });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to reset.");
      setSuccess("Pins cleared. Trending now follows automatic order.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset order.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.78)] p-6 shadow-[0_24px_70px_rgba(7,10,18,0.2)]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-text)]">
            <TrendingUp className="h-5 w-5 text-[var(--color-accent)]" />
            Trending Order
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-muted-strong)]">
            Reorder the trending list with the arrows, then save. A pinned movie that is still{" "}
            <strong>unreleased</strong> keeps its position until it releases; once released it
            reverts to the automatic order (recent releases first, then Twitter mentions). Mention
            counts refresh on a schedule.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={resetOrder} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to automatic
          </Button>
          <Button type="button" size="sm" disabled={saving || !dirty} onClick={saveOrder} className="gap-1">
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save order"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-4 py-3 text-sm text-[#ffcfcc]">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-[rgba(60,180,100,0.28)] bg-[rgba(28,80,48,0.28)] px-4 py-3 text-sm text-[#c0f0d0]">
          {success}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.44)] p-3">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--color-muted-strong)]">
            Loading trending movies...
          </div>
        ) : movies.length ? (
          <ol className="space-y-2">
            {movies.map((movie, index) => (
              <li
                key={movie.id}
                className="flex items-center gap-3 rounded-xl border border-transparent bg-transparent px-3 py-2 hover:border-[var(--color-border)] hover:bg-white/2"
              >
                <span className="w-6 shrink-0 text-center text-sm font-semibold text-[var(--color-muted)]">
                  {index + 1}
                </span>
                <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg-deep)]">
                  {movie.posterUrl ? (
                    <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Film className="h-4 w-4 text-[var(--color-muted)]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-text)]">{movie.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[var(--color-muted-strong)]">
                      {movie.releaseDate || "No date"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        movie.releaseStatus === "upcoming"
                          ? "bg-[rgba(100,160,255,0.12)] text-[#80b0ff]"
                          : "bg-[rgba(60,180,100,0.12)] text-[#60c880]"
                      }`}
                    >
                      {movie.releaseStatus === "upcoming" ? "Upcoming" : "Released"}
                    </span>
                    <span className="rounded-full bg-[rgba(194,154,98,0.12)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]">
                      {movie.mentionCount} mentions / 48h
                    </span>
                    {movie.adminOrder !== null && movie.releaseStatus === "upcoming" && (
                      <span className="rounded-full bg-[rgba(160,120,255,0.14)] px-2 py-0.5 text-[10px] font-medium text-[#c0a8ff]">
                        Pinned
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={saving || index === 0}
                    onClick={() => move(index, -1)}
                    className="h-7 w-7 p-0"
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={saving || index === movies.length - 1}
                    onClick={() => move(index, 1)}
                    className="h-7 w-7 p-0"
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted-strong)]">
            No trending movies yet.
          </div>
        )}
      </div>
    </section>
  );
}
