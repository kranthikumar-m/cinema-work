"use client";

import { useState } from "react";

interface ExpandableTextProps {
  text: string;
  /** Show the toggle only when the text is longer than this. */
  threshold?: number;
}

/** Renders body text clamped to a few lines with a Read more / Show less toggle. */
export function ExpandableText({ text, threshold = 360 }: ExpandableTextProps) {
  const [open, setOpen] = useState(false);
  if (!text) return null;

  const showToggle = text.length > threshold;

  return (
    <div>
      <p
        className={`whitespace-pre-line text-sm leading-relaxed text-[var(--color-muted-strong)] ${
          open || !showToggle ? "" : "line-clamp-[8]"
        }`}
      >
        {text}
      </p>
      {showToggle && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-2 text-xs font-semibold text-[var(--color-accent)] transition hover:text-[var(--color-accent-strong)]"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
