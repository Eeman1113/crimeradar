"use client";

import { Moon, Sun } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

export default function NightToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const isNight = params.get("night") === "1";
  const { t } = useI18n();

  const flip = () => {
    posthog.capture("night_mode_toggled", { enabled: !isNight });
    const next = new URLSearchParams(params.toString());
    if (isNight) next.delete("night");
    else next.set("night", "1");
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <Button
      variant={isNight ? "default" : "outline"}
      size="sm"
      onClick={flip}
      aria-pressed={isNight}
      aria-label={isNight ? "Switch to day mode" : "Switch to night mode"}
      disabled={pending}
      className="gap-2 min-h-9"
    >
      {isNight ? (
        <Moon className="h-3.5 w-3.5" />
      ) : (
        <Sun className="h-3.5 w-3.5" />
      )}
      <span>{isNight ? t("night_night") : t("night_day")}</span>
    </Button>
  );
}
