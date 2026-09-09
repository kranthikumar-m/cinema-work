"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, BrainCircuit, Eye, EyeOff, Loader2, MessageSquareText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import type { PollView, QuizView, UserReviewView } from "@/services/community";

type Tab = "polls" | "quiz" | "reviews";

const TABS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: "polls", label: "Polls", icon: BarChart3 },
  { key: "quiz", label: "Quiz", icon: BrainCircuit },
  { key: "reviews", label: "Reviews", icon: MessageSquareText },
];

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]";

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data;
}

/**
 * Admin console section for community content: create and close polls and
 * quiz questions, and moderate (hide / unhide / delete) user reviews.
 */
export function AdminCommunityManager() {
  const [tab, setTab] = useState<Tab>("polls");
  const [polls, setPolls] = useState<PollView[]>([]);
  const [questions, setQuestions] = useState<QuizView[]>([]);
  const [reviews, setReviews] = useState<UserReviewView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Poll form
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState("");
  const [pollMovieId, setPollMovieId] = useState("");
  const [pollMovieTitle, setPollMovieTitle] = useState("");
  // Quiz form
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState("");
  const [quizCorrect, setQuizCorrect] = useState("1");
  const [quizCategory, setQuizCategory] = useState("General");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pollData, quizData, reviewData] = await Promise.all([
        fetch("/api/admin/polls").then((res) => readJson<{ polls: PollView[] }>(res)),
        fetch("/api/admin/quiz").then((res) => readJson<{ questions: QuizView[] }>(res)),
        fetch("/api/admin/reviews").then((res) => readJson<{ reviews: UserReviewView[] }>(res)),
      ]);
      setPolls(pollData.polls ?? []);
      setQuestions(quizData.questions ?? []);
      setReviews(reviewData.reviews ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load community data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 2500);
  }

  async function createPoll(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await fetch("/api/admin/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: pollQuestion,
          options: pollOptions.split("\n").map((line) => line.trim()).filter(Boolean),
          movieId: pollMovieId ? Number(pollMovieId) : null,
          movieTitle: pollMovieTitle || null,
        }),
      }).then((res) => readJson(res));
      setPollQuestion("");
      setPollOptions("");
      setPollMovieId("");
      setPollMovieTitle("");
      flash("Poll created.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the poll.");
    }
  }

  async function createQuestion(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await fetch("/api/admin/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: quizQuestion,
          options: quizOptions.split("\n").map((line) => line.trim()).filter(Boolean),
          correctIndex: Number(quizCorrect) - 1,
          category: quizCategory,
        }),
      }).then((res) => readJson(res));
      setQuizQuestion("");
      setQuizOptions("");
      setQuizCorrect("1");
      flash("Question created.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the question.");
    }
  }

  async function toggle(kind: "polls" | "quiz", id: number, isActive: boolean) {
    setError(null);
    try {
      await fetch(`/api/admin/${kind}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }).then((res) => readJson(res));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    }
  }

  async function remove(kind: "polls" | "quiz" | "reviews", id: number) {
    if (!window.confirm("Delete permanently?")) return;
    setError(null);
    try {
      await fetch(`/api/admin/${kind}/${id}`, { method: "DELETE" }).then((res) => readJson(res));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
    }
  }

  async function setReviewStatus(id: number, status: "published" | "hidden") {
    setError(null);
    try {
      await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((res) => readJson(res));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the review.");
    }
  }

  return (
    <section className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(19,23,36,0.78)] p-6 shadow-[0_24px_70px_rgba(7,10,18,0.2)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-text)]">
            Community
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-muted-strong)]">
            Polls and quiz questions appear in the homepage feed and widget rail. Reviews written by
            readers can be hidden here without deleting them.
          </p>
        </div>
        <div className="flex gap-2">
          {TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => setTab(entry.key)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm transition",
                tab === entry.key
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                  : "border border-[var(--color-border)] text-[var(--color-text)] hover:border-[rgba(194,154,98,0.34)]"
              )}
            >
              <entry.icon className="h-4 w-4" />
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {notice && <p className="mt-4 text-sm text-[var(--color-accent)]">{notice}</p>}
      {loading && <Loader2 className="mt-4 h-5 w-5 animate-spin text-[var(--color-accent)]" />}

      {tab === "polls" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <form onSubmit={createPoll} className="space-y-3">
            <p className="eyebrow-label text-[var(--color-muted)]">New poll</p>
            <input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Question" required className={inputClass} />
            <textarea value={pollOptions} onChange={(e) => setPollOptions(e.target.value)} placeholder={"One option per line\nYes, it is likely\nNo chance at all"} rows={4} required className={inputClass} />
            <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
              <input value={pollMovieId} onChange={(e) => setPollMovieId(e.target.value)} placeholder="TMDB id" inputMode="numeric" className={inputClass} />
              <input value={pollMovieTitle} onChange={(e) => setPollMovieTitle(e.target.value)} placeholder="Movie title (optional)" className={inputClass} />
            </div>
            <Button type="submit" size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Create poll
            </Button>
          </form>
          <ul className="space-y-2">
            {polls.map((poll) => (
              <li key={poll.id} className="rounded-xl border border-[var(--color-border)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text)]">{poll.question}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {poll.movieTitle ? `${poll.movieTitle} · ` : ""}
                      {poll.totalVotes} votes · {formatDate(poll.createdAt)} ·{" "}
                      <span className={poll.isActive ? "text-emerald-400" : "text-[var(--color-muted)]"}>
                        {poll.isActive ? "Open" : "Closed"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted-strong)]">
                      {poll.options.map((option) => `${option.label} ${option.percent}%`).join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => toggle("polls", poll.id, !poll.isActive)} className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text)] hover:border-[rgba(194,154,98,0.5)]">
                      {poll.isActive ? "Close" : "Reopen"}
                    </button>
                    <button type="button" onClick={() => remove("polls", poll.id)} aria-label="Delete poll" className="rounded-full p-1.5 text-[var(--color-muted)] hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {!polls.length && !loading && <li className="text-sm text-[var(--color-muted)]">No polls yet.</li>}
          </ul>
        </div>
      )}

      {tab === "quiz" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <form onSubmit={createQuestion} className="space-y-3">
            <p className="eyebrow-label text-[var(--color-muted)]">New question</p>
            <input value={quizQuestion} onChange={(e) => setQuizQuestion(e.target.value)} placeholder="Question" required className={inputClass} />
            <textarea value={quizOptions} onChange={(e) => setQuizOptions(e.target.value)} placeholder={"One option per line\nAllu Arjun\nMahesh Babu\nJr NTR\nRam Charan"} rows={4} required className={inputClass} />
            <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-2">
              <input value={quizCorrect} onChange={(e) => setQuizCorrect(e.target.value)} placeholder="Correct option #" inputMode="numeric" required className={inputClass} />
              <input value={quizCategory} onChange={(e) => setQuizCategory(e.target.value)} placeholder="Category" className={inputClass} />
            </div>
            <Button type="submit" size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Create question
            </Button>
          </form>
          <ul className="space-y-2">
            {questions.map((question) => (
              <li key={question.id} className="rounded-xl border border-[var(--color-border)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text)]">{question.question}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {question.category} · {question.participants} answered · {question.correctPercent}% correct ·{" "}
                      <span className={question.isActive ? "text-emerald-400" : "text-[var(--color-muted)]"}>
                        {question.isActive ? "Open" : "Closed"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted-strong)]">
                      {question.options
                        .map((option, index) => (index === question.correctIndex ? `✓ ${option}` : option))
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => toggle("quiz", question.id, !question.isActive)} className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text)] hover:border-[rgba(194,154,98,0.5)]">
                      {question.isActive ? "Close" : "Reopen"}
                    </button>
                    <button type="button" onClick={() => remove("quiz", question.id)} aria-label="Delete question" className="rounded-full p-1.5 text-[var(--color-muted)] hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {!questions.length && !loading && <li className="text-sm text-[var(--color-muted)]">No questions yet.</li>}
          </ul>
        </div>
      )}

      {tab === "reviews" && (
        <ul className="mt-6 space-y-2">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-[var(--color-border)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {review.title}
                    <span className="ml-2 text-xs font-normal text-[var(--color-muted)]">
                      on {review.movieTitle}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {review.authorName} · {formatDate(review.createdAt)}
                    {review.rating ? ` · ${review.rating}/5` : ""} ·{" "}
                    <span className={review.status === "published" ? "text-emerald-400" : "text-amber-400"}>
                      {review.status}
                    </span>
                  </p>
                  <p className="mt-1 line-clamp-3 text-xs text-[var(--color-muted-strong)]">{review.body}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setReviewStatus(review.id, review.status === "published" ? "hidden" : "published")}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text)] hover:border-[rgba(194,154,98,0.5)]"
                  >
                    {review.status === "published" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {review.status === "published" ? "Hide" : "Publish"}
                  </button>
                  <button type="button" onClick={() => remove("reviews", review.id)} aria-label="Delete review" className="rounded-full p-1.5 text-[var(--color-muted)] hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
          {!reviews.length && !loading && <li className="text-sm text-[var(--color-muted)]">No user reviews yet.</li>}
        </ul>
      )}
    </section>
  );
}
