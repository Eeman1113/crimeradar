"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

type FontSize = "default" | "large" | "xl";

const ORDER: FontSize[] = ["default", "large", "xl"];
const LABEL: Record<FontSize, string> = {
  default: "A·",
  large: "A",
  xl: "A+",
};
const ARIA: Record<FontSize, string> = {
  default: "Font size: default. Click to increase.",
  large: "Font size: large. Click to increase.",
  xl: "Font size: extra large. Click to reset.",
};
const STORAGE_KEY = "cr.fontSize";

function isFontSize(value: unknown): value is FontSize {
  return value === "default" || value === "large" || value === "xl";
}

function applyToRoot(size: FontSize) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-font-size", size);
}

export function FontSizeToggle() {
  const [size, setSize] = React.useState<FontSize>("default");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    let initial: FontSize = "default";
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isFontSize(stored)) initial = stored;
    } catch {
      // ignore storage errors (private mode, etc.)
    }
    setSize(initial);
    applyToRoot(initial);
    setMounted(true);
  }, []);

  const cycle = React.useCallback(() => {
    setSize((prev) => {
      const next = ORDER[(ORDER.indexOf(prev) + 1) % ORDER.length];
      applyToRoot(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={mounted ? ARIA[size] : "Font size"}
      onClick={cycle}
    >
      <span
        aria-hidden={!mounted}
        className="text-sm font-semibold tabular-nums"
      >
        {mounted ? LABEL[size] : LABEL.default}
      </span>
    </Button>
  );
}

export default FontSizeToggle;
