"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  Hospital,
  Layers,
  Lightbulb,
  Phone,
  School,
  Shield,
  Train,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LAYER_META, type LayerKind } from "@/lib/layers";

const PARAM_KEY = "layers";

type LucideIcon = React.ComponentType<{ className?: string }>;

// Map of `LAYER_META[kind].icon` strings to actual Lucide components. Anything
// not present here falls back to the generic Layers glyph so a new LayerKind
// added in lib/layers.ts won't crash this component.
const ICON_BY_NAME: Record<string, LucideIcon> = {
  Camera,
  Hospital,
  Lightbulb,
  Phone,
  School,
  Shield,
  Train,
};

function parseLayersParam(raw: string | null): Set<LayerKind> {
  if (!raw) return new Set<LayerKind>();
  const allowed = new Set(Object.keys(LAYER_META) as LayerKind[]);
  const out = new Set<LayerKind>();
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (allowed.has(trimmed as LayerKind)) out.add(trimmed as LayerKind);
  }
  return out;
}

function serializeLayers(active: Set<LayerKind>): string {
  // Preserve LAYER_META declaration order for stable URLs.
  const ordered = (Object.keys(LAYER_META) as LayerKind[]).filter((k) =>
    active.has(k),
  );
  return ordered.join(",");
}

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export type LayerToggleProps = {
  onChange?: (activeKinds: Set<LayerKind>) => void;
  className?: string;
};

export default function LayerToggle({ onChange, className }: LayerToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Read URL state. Before mount we render an "all inactive" view so the
  // server-rendered markup is deterministic; after mount the real selection
  // takes over without mismatching the initial HTML.
  const urlActive = React.useMemo(
    () => parseLayersParam(params.get(PARAM_KEY)),
    [params],
  );
  const active = mounted ? urlActive : new Set<LayerKind>();

  // Notify parent whenever the (mounted) active set changes. Compare by value
  // so consumers aren't spammed on every render.
  const lastEmittedRef = React.useRef<Set<LayerKind> | null>(null);
  React.useEffect(() => {
    if (!mounted) return;
    const prev = lastEmittedRef.current;
    if (prev && setsEqual(prev, urlActive)) return;
    lastEmittedRef.current = new Set(urlActive);
    onChange?.(new Set(urlActive));
  }, [mounted, urlActive, onChange]);

  const toggle = React.useCallback(
    (kind: LayerKind) => {
      const next = new Set(urlActive);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);

      const search = new URLSearchParams(params.toString());
      const serialized = serializeLayers(next);
      if (serialized) search.set(PARAM_KEY, serialized);
      else search.delete(PARAM_KEY);

      const qs = search.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [urlActive, params, pathname, router],
  );

  const entries = Object.entries(LAYER_META) as [
    LayerKind,
    (typeof LAYER_META)[LayerKind],
  ][];

  return (
    <div
      role="group"
      aria-label="Map layers"
      className={
        "flex flex-wrap items-center gap-1.5 " + (className ?? "")
      }
    >
      {entries.map(([kind, meta]) => {
        const isActive = active.has(kind);
        const Icon: LucideIcon = ICON_BY_NAME[meta.icon] ?? Layers;
        return (
          <Button
            key={kind}
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => toggle(kind)}
            aria-pressed={isActive}
            aria-label={`Toggle ${meta.label} layer`}
            disabled={pending && !mounted}
            className="gap-2 min-h-9 rounded-full"
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{meta.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
