"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IndianRupee, Loader2, Trash2, X } from "lucide-react";
import { useOptionalAuthUser } from "@/components/auth/AuthUserProvider";

interface MovieBoxOfficeEditorProps {
  movieId: number;
  current: { worldwideGross: string; note: string | null; asOf: string | null } | null;
}

/** Admin-only inline editor for a film's worldwide gross (free text, e.g. "₹120 Cr"). */
export function MovieBoxOfficeEditor({ movieId, current }: MovieBoxOfficeEditorProps) {
  const auth = useOptionalAuthUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [gross, setGross] = useState(current?.worldwideGross ?? "");
  const [note, setNote] = useState(current?.note ?? "");
  const [asOf, setAsOf] = useState(current?.asOf ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (auth?.user?.role !== "admin") return null;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/movies/${movieId}/box-office`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worldwideGross: gross, note: note || null, asOf: asOf || null }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not save.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      await fetch(`/api/admin/movies/${movieId}/box-office`, { method: "DELETE" });
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)] transition hover:border-[rgba(194,154,98,0.5)] hover:bg-[var(--color-accent-soft)]"
      >
        <IndianRupee className="h-3.5 w-3.5" />
        {current ? "Edit box office" : "Add box office"}
      </button>
      {open && (
        <form
          onSubmit={save}
          className="absolute right-0 top-10 z-30 w-72 space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center justify-between">
            <p className="eyebrow-label text-[var(--color-muted)]">Worldwide gross</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-[var(--color-muted)]">
              <X className="h-4 w-4" />
            </button>
          </div>
          <input
            value={gross}
            onChange={(event) => setGross(event.target.value)}
            placeholder="₹120 Cr"
            required
            maxLength={60}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
          <input
            value={asOf}
            onChange={(event) => setAsOf(event.target.value)}
            type="date"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Source or note (optional)"
            maxLength={200}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-accent-contrast)] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </button>
            {current && (
              <button
                type="button"
                onClick={remove}
                disabled={saving}
                className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
