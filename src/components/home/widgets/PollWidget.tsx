"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetEmpty, WidgetShell } from "@/components/home/widgets/WidgetShell";
import type { PollView } from "@/services/community";

interface PollWidgetProps {
  polls: PollView[];
}

/** One active poll at a time: vote, then see the split. Arrows cycle polls. */
export function PollWidget({ polls: initialPolls }: PollWidgetProps) {
  const [polls, setPolls] = useState(initialPolls);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const poll = polls[index];

  async function vote(optionIndex: number) {
    if (!poll || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIndex }),
      });
      const data = (await res.json()) as { error?: string; poll?: PollView | null };
      if (!res.ok) throw new Error(data.error || "Could not record your vote.");
      if (data.poll) {
        setPolls((list) => list.map((entry) => (entry.id === data.poll!.id ? data.poll! : entry)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record your vote.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WidgetShell title="Polls" icon={BarChart3} note="Voice your opinion">
      {!poll ? (
        <WidgetEmpty>No open polls right now.</WidgetEmpty>
      ) : (
        <div id={`poll-${poll.id}`}>
          {poll.movieTitle && (
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-accent)]">
              {poll.movieId ? (
                <Link href={`/movie/${poll.movieId}`} className="hover:underline">
                  {poll.movieTitle}
                </Link>
              ) : (
                poll.movieTitle
              )}
            </p>
          )}
          <p className="text-sm font-semibold leading-snug text-[var(--color-text)]">{poll.question}</p>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
            {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
          </p>

          <ul className="mt-3 space-y-1.5">
            {poll.options.map((option, optionIndex) => {
              const voted = poll.myVote !== null;
              const isMine = poll.myVote === optionIndex;
              return (
                <li key={option.label}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => vote(optionIndex)}
                    aria-pressed={isMine}
                    className={cn(
                      "relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition",
                      isMine
                        ? "border-[var(--color-accent)] text-[var(--color-text)]"
                        : "border-[var(--color-border)] text-[var(--color-muted-strong)] hover:border-[rgba(194,154,98,0.5)] hover:text-[var(--color-text)]"
                    )}
                  >
                    {voted && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 bg-[var(--color-accent-soft)] transition-all"
                        style={{ width: `${option.percent}%` }}
                      />
                    )}
                    <span className="relative flex items-center justify-between gap-3">
                      <span>{option.label}</span>
                      {voted && (
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--color-accent-strong)]">
                          {option.percent}%
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {busy && <Loader2 className="mt-2 h-4 w-4 animate-spin text-[var(--color-accent)]" />}
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

          {polls.length > 1 && (
            <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-muted)]">
              <button
                type="button"
                onClick={() => setIndex((i) => (i - 1 + polls.length) % polls.length)}
                className="inline-flex items-center gap-1 hover:text-[var(--color-text)]"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <span>
                {index + 1} / {polls.length}
              </span>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % polls.length)}
                className="inline-flex items-center gap-1 hover:text-[var(--color-text)]"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
