"use client";

import { useState } from "react";
import { Music, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SyncResult {
  ok: boolean;
  processed: number;
  songsAdded: number;
  songsRemoved: number;
  skipped: number;
  errors: string[];
  timestamp: string;
  error?: string;
}

export function AdminSongSync() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSync() {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/cron/sync-songs");
      const data = (await res.json()) as SyncResult;

      if (!res.ok) {
        throw new Error(data.error || "Sync failed.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Song sync failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.78)] p-6 shadow-[0_24px_70px_rgba(7,10,18,0.2)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-text)]">
            Song Auto-Sync
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted-strong)]">
            Automatically searches YouTube for songs of movies released within the last 50 days and
            adds them to the Videos section. Runs daily via cron, or trigger manually below.
          </p>
        </div>
        <Button
          onClick={runSync}
          disabled={running}
          size="lg"
          className="gap-2 shrink-0"
        >
          {running ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Music className="h-4 w-4" />
          )}
          {running ? "Syncing..." : "Run Song Sync"}
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-4 py-3 text-sm text-[#ffcfcc]">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-[rgba(60,180,100,0.28)] bg-[rgba(28,80,48,0.28)] px-4 py-3 text-sm text-[#c0f0d0]">
          <p>
            Sync complete: {result.songsAdded} songs added
            {result.songsRemoved > 0 && `, ${result.songsRemoved} irrelevant songs removed`}
            {" "}across {result.processed} movies.
            {result.skipped > 0 && ` ${result.skipped} movies skipped (already synced recently).`}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-[#ffcfcc]">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
