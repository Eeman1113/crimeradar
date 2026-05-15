"use client";

import { ShieldAlert, Users } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
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
    const next = new URLSearchParams(params.toString());
    if (isWomen) next.delete("women");
    else next.set("women", "1");
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <Button
      variant={isWomen ? "default" : "outline"}
      size="sm"
      onClick={flip}
      aria-pressed={isWomen}
      aria-label={
        isWomen ? t("women_mode_off_label") : t("women_mode_on_label")
      }
      disabled={pending}
      className="gap-2"
    >
      {isWomen ? (
        <ShieldAlert className="h-3.5 w-3.5" />
      ) : (
        <Users className="h-3.5 w-3.5" />
      )}
      <span className="hidden xs:inline sm:inline">
        {isWomen ? t("women_mode_on") : t("women_mode_off")}
      </span>
    </Button>
  );
}
