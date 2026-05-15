"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function NightToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const isNight = params.get("night") === "1";

  const flip = () => {
    const next = new URLSearchParams(params.toString());
    if (isNight) next.delete("night");
    else next.set("night", "1");
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <button
      type="button"
      onClick={flip}
      aria-pressed={isNight}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
        isNight
          ? "bg-indigo-600 border-indigo-500 text-white"
          : "bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
      } ${pending ? "opacity-70" : ""}`}
      title="Apply per-category night-time multipliers"
    >
      <span aria-hidden>{isNight ? "🌙" : "☀️"}</span>
      <span>{isNight ? "Night mode" : "Day mode"}</span>
    </button>
  );
}
