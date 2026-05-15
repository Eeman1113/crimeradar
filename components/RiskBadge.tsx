type Props = {
  score: number;
  size?: "sm" | "md" | "lg";
};

function bucket(score: number) {
  if (score >= 75) return { label: "High", className: "bg-rose-600 text-rose-50" };
  if (score >= 50) return { label: "Elevated", className: "bg-orange-500 text-orange-50" };
  if (score >= 25) return { label: "Moderate", className: "bg-amber-500 text-amber-950" };
  return { label: "Lower", className: "bg-emerald-600 text-emerald-50" };
}

export default function RiskBadge({ score, size = "md" }: Props) {
  const b = bucket(score);
  const sizing =
    size === "lg"
      ? "text-3xl px-4 py-2"
      : size === "sm"
        ? "text-xs px-2 py-0.5"
        : "text-sm px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-semibold ${b.className} ${sizing}`}
    >
      <span>{score}</span>
      <span className="opacity-80 font-medium">{b.label}</span>
    </span>
  );
}
