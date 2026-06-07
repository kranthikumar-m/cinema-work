"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X, Loader2, RotateCcw } from "lucide-react";
import { useOptionalAuthUser } from "@/components/auth/AuthUserProvider";
import type { DetailCompany, DetailFact, MovieCompanyCredits } from "@/types/admin";

interface FactDraft {
  label: string;
  value: string; // comma-separated values for editing
}

type CompanyGroupKey = "production" | "distributors" | "other";

const COMPANY_GROUPS: { key: CompanyGroupKey; label: string }[] = [
  { key: "production", label: "Production" },
  { key: "distributors", label: "Distributors" },
  { key: "other", label: "Other Companies" },
];

interface MovieDetailsAdminEditorProps {
  movieId: number;
  facts: DetailFact[];
  companies: MovieCompanyCredits;
  hasOverride: boolean;
}

/**
 * Admin-only editor for a movie's Movie Facts + Company Credits. Pre-filled with
 * the current (auto-sourced or already-overridden) data; lets admins edit, add
 * or remove any row and saves a full snapshot. "Reset to automatic" clears it.
 */
export function MovieDetailsAdminEditor({
  movieId,
  facts,
  companies,
  hasOverride,
}: MovieDetailsAdminEditorProps) {
  const auth = useOptionalAuthUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [factDrafts, setFactDrafts] = useState<FactDraft[]>([]);
  const [companyDrafts, setCompanyDrafts] = useState<MovieCompanyCredits>({
    production: [],
    distributors: [],
    other: [],
  });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seed drafts from current data whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setFactDrafts(facts.map((f) => ({ label: f.label, value: f.values.join(", ") })));
    setCompanyDrafts({
      production: companies.production.map((c) => ({ ...c })),
      distributors: companies.distributors.map((c) => ({ ...c })),
      other: companies.other.map((c) => ({ ...c })),
    });
  }, [open, facts, companies]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (auth?.user?.role !== "admin") return null;

  function setCompany(group: CompanyGroupKey, idx: number, patch: Partial<DetailCompany>) {
    setCompanyDrafts((prev) => ({
      ...prev,
      [group]: prev[group].map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }));
  }
  function removeCompany(group: CompanyGroupKey, idx: number) {
    setCompanyDrafts((prev) => ({
      ...prev,
      [group]: prev[group].filter((_, i) => i !== idx),
    }));
  }
  function addCompany(group: CompanyGroupKey) {
    setCompanyDrafts((prev) => ({
      ...prev,
      [group]: [...prev[group], { name: "", detail: null }],
    }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const factsPayload: DetailFact[] = factDrafts
        .map((f) => ({
          label: f.label.trim(),
          values: f.value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
        }))
        .filter((f) => f.label && f.values.length);
      const companiesPayload: MovieCompanyCredits = {
        production: companyDrafts.production.filter((c) => c.name.trim()),
        distributors: companyDrafts.distributors.filter((c) => c.name.trim()),
        other: companyDrafts.other.filter((c) => c.name.trim()),
      };
      const res = await fetch(`/api/admin/movies/${movieId}/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facts: factsPayload, companies: companiesPayload }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to save.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function resetToAuto() {
    setResetting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/movies/${movieId}/details`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to reset.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset.");
    } finally {
      setResetting(false);
    }
  }

  const inputClass =
    "h-9 rounded-lg border border-[var(--color-border)] bg-[rgba(15,19,34,0.72)] px-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[rgba(194,154,98,0.46)]";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(194,154,98,0.32)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)] transition hover:border-[rgba(194,154,98,0.6)] hover:bg-[var(--color-accent-soft)]"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit details
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] shadow-[0_30px_90px_rgba(7,10,18,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                Edit Movie Facts &amp; Company Credits
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-5">
              {/* Facts */}
              <div>
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Movie Facts
                </p>
                <div className="space-y-2">
                  {factDrafts.map((fact, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        value={fact.label}
                        onChange={(e) =>
                          setFactDrafts((prev) =>
                            prev.map((f, i) => (i === idx ? { ...f, label: e.target.value } : f))
                          )
                        }
                        placeholder="Label"
                        className={`${inputClass} w-44 shrink-0`}
                      />
                      <input
                        value={fact.value}
                        onChange={(e) =>
                          setFactDrafts((prev) =>
                            prev.map((f, i) => (i === idx ? { ...f, value: e.target.value } : f))
                          )
                        }
                        placeholder="Value (comma-separated)"
                        className={`${inputClass} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => setFactDrafts((prev) => prev.filter((_, i) => i !== idx))}
                        aria-label="Remove fact"
                        className="shrink-0 text-[#ff9a94] transition hover:text-[#ffb4b0]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setFactDrafts((prev) => [...prev, { label: "", value: "" }])}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]"
                >
                  <Plus className="h-3.5 w-3.5" /> Add fact
                </button>
              </div>

              {/* Companies */}
              {COMPANY_GROUPS.map((group) => (
                <div key={group.key}>
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {companyDrafts[group.key].map((company, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          value={company.name}
                          onChange={(e) => setCompany(group.key, idx, { name: e.target.value })}
                          placeholder="Company name"
                          className={`${inputClass} flex-1`}
                        />
                        <input
                          value={company.detail ?? ""}
                          onChange={(e) =>
                            setCompany(group.key, idx, { detail: e.target.value || null })
                          }
                          placeholder="Detail (e.g. India · theatrical)"
                          className={`${inputClass} w-56 shrink-0`}
                        />
                        <button
                          type="button"
                          onClick={() => removeCompany(group.key, idx)}
                          aria-label="Remove company"
                          className="shrink-0 text-[#ff9a94] transition hover:text-[#ffb4b0]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addCompany(group.key)}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add company
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <p className="mx-5 rounded-lg border border-[rgba(220,95,95,0.28)] bg-[rgba(108,28,28,0.28)] px-3 py-2 text-xs text-[#ffcfcc]">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-5 py-4">
              {hasOverride ? (
                <button
                  type="button"
                  onClick={resetToAuto}
                  disabled={resetting || saving}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted-strong)] transition hover:text-[var(--color-text)] disabled:opacity-60"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {resetting ? "Resetting…" : "Reset to automatic"}
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-muted-strong)] transition hover:text-[var(--color-text)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || resetting}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-accent-contrast)] transition hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
