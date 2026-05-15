import { cn } from "@/lib/utils";

type Props = {
  score: number;
  size?: "sm" | "md" | "lg";
};

function bucket(score: number) {
  if (score >= 75)
    return {
      label: "High",
      className:
        "bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/30",
    };
  if (score >= 50)
    return {
      label: "Elevated",
      className:
        "bg-orange-500/15 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/30",
    };
  if (score >= 25)
    return {
      label: "Moderate",
      className:
        "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/30",
    };
  return {
    label: "Lower",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/30",
  };
}

export default function RiskBadge({ score, size = "md" }: Props) {
  const b = bucket(score);
  const sizing =
    size === "lg"
      ? "text-2xl px-3.5 py-1.5 gap-2"
      : size === "sm"
        ? "text-xs px-2 py-0.5 gap-1"
        : "text-sm px-2.5 py-1 gap-1.5";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold tabular-nums",
        b.className,
        sizing,
      )}
    >
      <span>{score}</span>
      <span className="opacity-70 font-medium">{b.label}</span>
    </span>
  );
}
