"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Search, X, GripVertical, Check, AlertCircle } from "lucide-react";
import { useOptionalAuthUser } from "@/components/auth/AuthUserProvider";

const DRAG_MIME = "application/x-abo-entry";

export interface AboEntry {
  title: string;
  releaseDate: string | null;
}

interface CalibrationContextValue {
  active: boolean;
  toggle: () => void;
  entries: AboEntry[];
  loading: boolean;
  error: string | null;
  apply: (movieId: number, movieTitle: string, entry: AboEntry) => Promise<void>;
}

const CalibrationContext = createContext<CalibrationContextValue | null>(null);

export function useOptionalAboCalibration() {
  return useContext(CalibrationContext);
}

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatAboDate(date: string | null): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Date TBA";
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function AboCalibrationProvider({ children }: { children: ReactNode }) {
  const auth = useOptionalAuthUser();
  const isAdmin = auth?.user?.role === "admin";
  const router = useRouter();

  const [active, setActive] = useState(false);
  const [entries, setEntries] = useState<AboEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/abo-info", { cache: "no-store" });
      const data = (await res.json()) as { error?: string; results?: AboEntry[] };
      if (!res.ok || !data.results) throw new Error(data.error || "Failed to load ABO info.");
      setEntries(data.results);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ABO info.");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggle = useCallback(() => {
    setActive((value) => {
      const next = !value;
      if (next && !loaded) void loadEntries();
      return next;
    });
  }, [loaded, loadEntries]);

  const apply = useCallback(
    async (movieId: number, movieTitle: string, entry: AboEntry) => {
      const alias =
        normalizeTitle(movieTitle) === normalizeTitle(entry.title) ? undefined : entry.title;
      try {
        const res = await fetch(`/api/admin/movies/${movieId}/release-override`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ releaseDate: entry.releaseDate, alias }),
        });
        const data = (await res.json()) as { error?: string; ok?: boolean };
        if (!res.ok || !data.ok) throw new Error(data.error || "Failed to calibrate.");
        setToast({
          ok: true,
          text: `${movieTitle} → ${formatAboDate(entry.releaseDate)}${
            alias ? ` · tagged “${alias}”` : ""
          }`,
        });
        router.refresh();
      } catch (err) {
        setToast({
          ok: false,
          text: err instanceof Error ? err.message : "Failed to calibrate.",
        });
      } finally {
        setTimeout(() => setToast(null), 4000);
      }
    },
    [router]
  );

  if (!isAdmin) return <>{children}</>;

  return (
    <CalibrationContext.Provider value={{ active, toggle, entries, loading, error, apply }}>
      {children}
      <AboCalibrationSidebar />
      {toast && (
        <div
          className={`fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2.5 text-sm shadow-[0_18px_50px_rgba(7,10,18,0.5)] backdrop-blur ${
            toast.ok
              ? "border-[rgba(60,180,100,0.4)] bg-[rgba(28,80,48,0.92)] text-[#c0f0d0]"
              : "border-[rgba(220,95,95,0.4)] bg-[rgba(108,28,28,0.92)] text-[#ffcfcc]"
          }`}
        >
          {toast.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.text}
        </div>
      )}
    </CalibrationContext.Provider>
  );
}

function AboCalibrationSidebar() {
  const ctx = useContext(CalibrationContext);
  const [query, setQuery] = useState("");
  if (!ctx || !ctx.active) return null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? ctx.entries.filter((e) => e.title.toLowerCase().includes(q))
    : ctx.entries;

  return (
    <aside className="fixed right-0 top-[84px] bottom-0 z-40 flex w-[min(340px,calc(100vw-1rem))] flex-col border-l border-[var(--color-border)] bg-[var(--color-surface-strong)] shadow-[-24px_0_70px_rgba(7,10,18,0.45)]">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]">
            <CalendarClock className="h-4 w-4" /> ABO Release Dates
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-muted-strong)]">
            Drag a release onto a movie poster to set its date. A different title
            is added as a tag.
          </p>
        </div>
        <button
          type="button"
          onClick={ctx.toggle}
          aria-label="Close calibration"
          className="shrink-0 text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-[var(--color-border)] p-3">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter releases…"
            className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] pl-9 pr-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-accent)]" />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
        {ctx.loading && (
          <p className="px-2 py-6 text-center text-sm text-[var(--color-muted)]">
            Loading release calendar…
          </p>
        )}
        {ctx.error && (
          <p className="rounded-lg border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.22)] px-3 py-2 text-xs text-[#ffcfcc]">
            {ctx.error}
          </p>
        )}
        {!ctx.loading && !ctx.error && !filtered.length && (
          <p className="px-2 py-6 text-center text-sm text-[var(--color-muted)]">
            {ctx.entries.length ? "No matches." : "No upcoming ABO releases found."}
          </p>
        )}

        {filtered.map((entry, index) => (
          <div
            key={`${entry.title}-${entry.releaseDate}-${index}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(DRAG_MIME, JSON.stringify(entry));
              e.dataTransfer.setData("text/plain", entry.title);
              e.dataTransfer.effectAllowed = "copy";
            }}
            className="group flex cursor-grab items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[rgba(15,19,34,0.5)] px-3 py-2.5 transition hover:border-[rgba(194,154,98,0.5)] hover:bg-[var(--color-accent-soft)] active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 shrink-0 text-[var(--color-muted)] group-hover:text-[var(--color-accent)]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-text)]">
                {entry.title}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-accent)]">
                {formatAboDate(entry.releaseDate)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

/** Drop target overlaid on a movie card — active only in calibration mode. */
export function MovieCardDropZone({
  movieId,
  movieTitle,
}: {
  movieId: number;
  movieTitle: string;
}) {
  const ctx = useOptionalAboCalibration();
  const [over, setOver] = useState(false);
  if (!ctx || !ctx.active) return null;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        if (!over) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const raw = e.dataTransfer.getData(DRAG_MIME);
        if (!raw) return;
        try {
          const entry = JSON.parse(raw) as AboEntry;
          void ctx.apply(movieId, movieTitle, entry);
        } catch {
          /* ignore malformed payload */
        }
      }}
      className={`absolute inset-0 z-30 flex items-center justify-center rounded-[22px] border-2 border-dashed text-center transition ${
        over
          ? "border-[var(--color-accent)] bg-[rgba(194,154,98,0.28)]"
          : "border-[rgba(194,154,98,0.45)] bg-[rgba(13,16,26,0.55)]"
      }`}
    >
      <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
        {over ? "Release to set date" : "Drop ABO date"}
      </span>
    </div>
  );
}
