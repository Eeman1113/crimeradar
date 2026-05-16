import { cn } from "@/lib/utils";

type Props = {
  compact?: boolean;
};

// Bands mirror RiskBadge.tsx:
//   score < 25         -> Lower    (emerald)
//   25 <= score < 50   -> Moderate (amber)
//   50 <= score < 75   -> Elevated (orange)
//   score >= 75        -> High     (red)
const TICKS = [0, 25, 50, 75, 100];
const LABELS = [
  { value: 0, text: "Lower" },
  { value: 25, text: "Moderate" },
  { value: 50, text: "Elevated" },
  { value: 75, text: "High" },
];

export default function RiskLegend({ compact = false }: Props) {
  return (
    <div
      className={cn(
        "w-full select-none",
        compact ? "text-[10px]" : "text-xs",
      )}
      aria-label="Risk score legend"
    >
      <div
        className={cn(
          "w-full rounded-full ring-1 ring-black/10 dark:ring-white/10",
          compact ? "h-2" : "h-3",
          // Color stops align with bucket thresholds (0/25/50/75/100).
          "bg-[linear-gradient(to_right,theme(colors.emerald.500)_0%,theme(colors.emerald.500)_25%,theme(colors.amber.500)_25%,theme(colors.amber.500)_50%,theme(colors.orange.500)_50%,theme(colors.orange.500)_75%,theme(colors.red.500)_75%,theme(colors.red.500)_100%)]",
        )}
        role="img"
        aria-hidden="true"
      />
      <div
        className={cn(
          "mt-1 flex w-full justify-between tabular-nums text-muted-foreground",
          compact && "mt-0.5",
        )}
        aria-hidden="true"
      >
        {TICKS.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div
        className={cn(
          "mt-0.5 grid w-full grid-cols-4 font-medium",
          compact ? "gap-0.5" : "gap-1",
        )}
      >
        {LABELS.map((l) => (
          <span
            key={l.value}
            className={cn(
              "text-center",
              l.value === 0 &&
                "text-emerald-700 dark:text-emerald-400",
              l.value === 25 &&
                "text-amber-700 dark:text-amber-300",
              l.value === 50 &&
                "text-orange-600 dark:text-orange-400",
              l.value === 75 && "text-red-600 dark:text-red-400",
            )}
          >
            {l.text}
          </span>
        ))}
      </div>
    </div>
  );
}
