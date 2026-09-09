"use client";

import { useState } from "react";
import { BrainCircuit, Check, ChevronRight, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetEmpty, WidgetShell } from "@/components/home/widgets/WidgetShell";
import type { QuizView } from "@/services/community";

interface QuizWidgetProps {
  questions: QuizView[];
}

/** One quiz question at a time; answering reveals the right option and the crowd stats. */
export function QuizWidget({ questions: initialQuestions }: QuizWidgetProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = questions[index];

  async function answer(optionIndex: number) {
    if (!question || busy || question.myAnswer !== null) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/quiz/${question.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIndex }),
      });
      const data = (await res.json()) as { error?: string; question?: QuizView | null };
      if (!res.ok) throw new Error(data.error || "Could not record your answer.");
      if (data.question) {
        setQuestions((list) =>
          list.map((entry) => (entry.id === data.question!.id ? data.question! : entry))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record your answer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WidgetShell title="Quiz" icon={BrainCircuit} note="Test your movie knowledge">
      {!question ? (
        <WidgetEmpty>No quiz questions open right now.</WidgetEmpty>
      ) : (
        <div id={`quiz-${question.id}`}>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-accent)]">
            {question.category}
          </p>
          <p className="text-sm font-semibold leading-snug text-[var(--color-text)]">{question.question}</p>
          <p className="mt-1 text-[11px] text-[var(--color-muted)]">
            {question.participants} {question.participants === 1 ? "participant" : "participants"}
            {question.participants ? ` · ${question.correctPercent}% answered correctly` : ""}
          </p>

          <ul className="mt-3 space-y-1.5">
            {question.options.map((option, optionIndex) => {
              const answered = question.myAnswer !== null;
              const isMine = question.myAnswer === optionIndex;
              const isCorrect = question.correctIndex === optionIndex;
              return (
                <li key={option}>
                  <button
                    type="button"
                    disabled={busy || answered}
                    onClick={() => answer(optionIndex)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition",
                      answered && isCorrect
                        ? "border-emerald-500/70 bg-emerald-500/10 text-[var(--color-text)]"
                        : answered && isMine
                          ? "border-red-500/60 bg-red-500/10 text-[var(--color-text)]"
                          : "border-[var(--color-border)] text-[var(--color-muted-strong)] enabled:hover:border-[rgba(194,154,98,0.5)] enabled:hover:text-[var(--color-text)]"
                    )}
                  >
                    <span>{option}</span>
                    {answered && isCorrect && <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
                    {answered && isMine && !isCorrect && <X className="h-4 w-4 shrink-0 text-red-400" />}
                  </button>
                </li>
              );
            })}
          </ul>
          {busy && <Loader2 className="mt-2 h-4 w-4 animate-spin text-[var(--color-accent)]" />}
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          {question.myAnswer !== null && (
            <p className="mt-2 text-xs text-[var(--color-muted-strong)]">
              {question.myAnswer === question.correctIndex ? "Correct!" : "Not quite. The right answer is highlighted."}
            </p>
          )}

          {questions.length > 1 && (
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % questions.length)}
              className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              Next question <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </WidgetShell>
  );
}
