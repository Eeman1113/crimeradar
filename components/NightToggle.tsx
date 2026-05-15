"use client";

import { Moon, Sun } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

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
    <Button
      variant={isNight ? "default" : "outline"}
      size="sm"
      onClick={flip}
      aria-pressed={isNight}
      aria-label={isNight ? "Switch to day mode" : "Switch to night mode"}
      disabled={pending}
      className="gap-2"
    >
      {isNight ? (
        <Moon className="h-3.5 w-3.5" />
      ) : (
        <Sun className="h-3.5 w-3.5" />
      )}
      <span className="hidden xs:inline sm:inline">
        {isNight ? "Night" : "Day"}
      </span>
    </Button>
  );
}
