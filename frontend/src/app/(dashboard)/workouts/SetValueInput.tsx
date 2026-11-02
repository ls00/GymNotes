"use client";

interface SetValueInputProps {
  id?: string;
  label: string;
  value: number;
  min: number;
  step: number;
  inputMode: "decimal" | "numeric";
  increments: readonly number[];
  onChange: (value: number) => void;
  size?: "compact" | "comfortable";
}

export default function SetValueInput({
  id,
  label,
  value,
  min,
  step,
  inputMode,
  increments,
  onChange,
  size = "compact",
}: SetValueInputProps) {
  const isCompact = size === "compact";

  return (
    <div className="min-w-0 space-y-1">
      <input
        id={id}
        type="number"
        inputMode={inputMode}
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        className={`w-full rounded-lg border border-border bg-surface px-1 text-center font-mono text-white outline-none focus:border-brand ${
          isCompact
            ? "min-h-9 text-xs"
            : "min-h-10 text-sm font-semibold"
        }`}
      />
      <div className={`grid gap-1 ${increments.length === 4 ? "grid-cols-4" : "grid-cols-2"}`}>
        {increments.map((increment) => {
          const nextValue = Math.max(min, value + increment);
          const direction = increment < 0 ? "Diminuir" : "Aumentar";
          const adjustment =
            Math.abs(increment) === 1
              ? direction === "Diminuir"
                ? "−"
                : "+"
              : `${increment < 0 ? "−" : "+"}${Math.abs(increment)}`;

          return (
            <button
              key={increment}
              type="button"
              onClick={() => onChange(nextValue)}
              disabled={value + increment < min}
              aria-label={`${direction} ${label} em ${Math.abs(increment)}`}
              className={`flex min-w-0 items-center justify-center rounded-md border border-border text-muted transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 ${
                isCompact ? "min-h-7 text-[10px]" : "min-h-8 text-xs"
              }`}
            >
              {adjustment}
            </button>
          );
        })}
      </div>
    </div>
  );
}
