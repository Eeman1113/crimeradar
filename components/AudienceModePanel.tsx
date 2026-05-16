"use client";

import {
  Baby,
  Building2,
  Car,
  Compass,
  Heart,
  MoonStar,
  Rainbow,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import type { ComponentType, SVGProps } from "react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";

export type AudienceMode =
  | "late-night"
  | "senior"
  | "family"
  | "driver"
  | "tourist"
  | "queer"
  | "survivor"
  | "rwa";

type ModeDef = {
  id: AudienceMode;
  label: string;
  blurb: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const MODES: ReadonlyArray<ModeDef> = [
  {
    id: "late-night",
    label: "Late-night",
    blurb: "weighting 10pm–4am incidents",
    Icon: MoonStar,
  },
  {
    id: "senior",
    label: "Senior",
    blurb: "chain-snatching, ATM scams, burglary",
    Icon: UserRound,
  },
  {
    id: "family",
    label: "Family",
    blurb: "child + women safety",
    Icon: Baby,
  },
  {
    id: "driver",
    label: "Driver",
    blurb: "vehicle theft, route safety",
    Icon: Car,
  },
  {
    id: "tourist",
    label: "Tourist",
    blurb: "pickpocket and scam alerts",
    Icon: Compass,
  },
  {
    id: "queer",
    label: "Queer",
    blurb: "harassment + hate signals",
    Icon: Rainbow,
  },
  {
    id: "survivor",
    label: "Survivor",
    blurb: "privacy: logging off, quick-exit",
    Icon: Heart,
  },
  {
    id: "rwa",
    label: "RWA",
    blurb: "CCTV & streetlight overlay",
    Icon: Building2,
  },
];

const MODE_IDS = new Set<AudienceMode>(MODES.map((m) => m.id));
const PARAM_KEY = "modes";

function parseModes(raw: string | null): Set<AudienceMode> {
  const out = new Set<AudienceMode>();
  if (!raw) return out;
  for (const piece of raw.split(",")) {
    const trimmed = piece.trim();
    if (MODE_IDS.has(trimmed as AudienceMode)) {
      out.add(trimmed as AudienceMode);
    }
  }
  return out;
}

function serializeModes(set: Set<AudienceMode>): string {
  // preserve canonical order from MODES so URL is stable
  return MODES.filter((m) => set.has(m.id))
    .map((m) => m.id)
    .join(",");
}

export function useAudienceModes(): {
  modes: Set<AudienceMode>;
  toggleMode: (mode: AudienceMode) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get(PARAM_KEY);

  const modes = useMemo(() => parseModes(raw), [raw]);

  const toggleMode = useCallback(
    (mode: AudienceMode) => {
      if (!MODE_IDS.has(mode)) return;
      const next = new Set(parseModes(raw));
      const wasActive = next.has(mode);
      if (wasActive) next.delete(mode);
      else next.add(mode);

      const usp = new URLSearchParams(params.toString());
      const serialized = serializeModes(next);
      if (serialized) usp.set(PARAM_KEY, serialized);
      else usp.delete(PARAM_KEY);

      posthog.capture("audience_mode_toggled", {
        mode,
        enabled: !wasActive,
        active_modes: Array.from(next),
      });

      const qs = usp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [params, pathname, raw, router],
  );

  return { modes, toggleMode };
}

function describeBlend(active: ReadonlyArray<ModeDef>): string {
  if (active.length === 0) return "No modes active — showing default view.";
  if (active.length === 1) {
    return `${active[0].label} mode — ${active[0].blurb}.`;
  }
  const labels = active.map((m) => m.label);
  const head = labels.slice(0, -1).join(", ");
  const tail = labels[labels.length - 1];
  return `${active.length} modes active — blending ${head} + ${tail}.`;
}

export default function AudienceModePanel() {
  const { modes, toggleMode } = useAudienceModes();
  const [pending, startTransition] = useTransition();

  const activeDefs = useMemo(
    () => MODES.filter((m) => modes.has(m.id)),
    [modes],
  );

  return (
    <section
      aria-label="Audience modes"
      className="flex flex-col gap-2 rounded-lg border bg-card p-3"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
        <h2 className="text-sm font-medium">Audience modes</h2>
      </div>
      <div
        role="group"
        aria-label="Toggle audience modes"
        className="flex flex-wrap gap-1.5"
      >
        {MODES.map(({ id, label, Icon }) => {
          const active = modes.has(id);
          return (
            <Button
              key={id}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              aria-pressed={active}
              aria-label={
                active ? `Turn off ${label} mode` : `Turn on ${label} mode`
              }
              disabled={pending}
              onClick={() => startTransition(() => toggleMode(id))}
              className="gap-1.5 min-h-9"
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              <span>{label}</span>
            </Button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {describeBlend(activeDefs)}
      </p>
    </section>
  );
}
