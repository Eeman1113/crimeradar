"use client";

import { Info, ShieldAlert, Users } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

export default function WomenToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const isWomen = params.get("women") === "1";
  const { t } = useI18n();

  const flip = () => {
    posthog.capture("women_mode_toggled", { enabled: !isWomen });
    const next = new URLSearchParams(params.toString());
    if (isWomen) next.delete("women");
    else next.set("women", "1");
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <Button
        variant={isWomen ? "default" : "outline"}
        size="sm"
        onClick={flip}
        aria-pressed={isWomen}
        aria-label={
          isWomen ? t("women_mode_off_label") : t("women_mode_on_label")
        }
        disabled={pending}
        className="gap-2 min-h-9"
      >
        {isWomen ? (
          <ShieldAlert className="h-3.5 w-3.5" />
        ) : (
          <Users className="h-3.5 w-3.5" />
        )}
        <span>{isWomen ? t("women_mode_on") : t("women_mode_off")}</span>
      </Button>
      {isWomen ? (
        <span
          title="Sexual and domestic offences in India are under-reported by an estimated 70–99% (NFHS-5). A low score may reflect low reporting, not high safety."
          aria-label="Sexual and domestic offences in India are under-reported by an estimated 70–99% (NFHS-5). A low score may reflect low reporting, not high safety."
          tabIndex={0}
          className="inline-flex items-center text-muted-foreground cursor-help shrink-0"
        >
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      ) : null}
    </span>
  );
}
