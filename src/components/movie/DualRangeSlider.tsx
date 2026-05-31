"use client";

interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
  formatValue?: (value: number) => string;
}

/**
 * Two-thumb range slider built from a pair of stacked native range inputs.
 * The `.dual-range` rules in globals.css make only the thumbs interactive so
 * both handles remain draggable despite overlapping.
 */
export function DualRangeSlider({
  min,
  max,
  step = 1,
  low,
  high,
  onChange,
  formatValue,
}: DualRangeSliderProps) {
  const span = Math.max(1, max - min);
  const lowPct = ((Math.min(low, high) - min) / span) * 100;
  const highPct = ((Math.max(low, high) - min) / span) * 100;
  const label = (value: number) => (formatValue ? formatValue(value) : String(value));

  return (
    <div className="w-full">
      <div className="relative h-5">
        {/* Base track */}
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-[var(--color-border)]" />
        {/* Selected span */}
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[var(--color-accent)]"
          style={{ left: `${lowPct}%`, width: `${Math.max(0, highPct - lowPct)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(e) => onChange(Math.min(Number(e.target.value), high), high)}
          aria-label="Minimum"
          className="dual-range absolute inset-x-0 top-1/2 h-5 w-full -translate-y-1/2"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(e) => onChange(low, Math.max(Number(e.target.value), low))}
          aria-label="Maximum"
          className="dual-range absolute inset-x-0 top-1/2 h-5 w-full -translate-y-1/2"
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs font-medium text-[var(--color-text)]">
        <span>{label(Math.min(low, high))}</span>
        <span>{label(Math.max(low, high))}</span>
      </div>
    </div>
  );
}
