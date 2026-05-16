"use client";

import * as React from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PdfExportButtonProps {
  /**
   * Optional CSS selector for the element to scope printing to.
   * When set, `data-pdf-export-target` is applied to <html> just before
   * `window.print()` so the print stylesheet can hide everything except
   * the matching element (and its ancestors).
   */
  targetSelector?: string;
  /** Show a pre-flight info modal before triggering print. Default: true. */
  showPreflight?: boolean;
  /** Optional className for the trigger Button. */
  className?: string;
  /** Optional override for the visible button label. */
  label?: string;
  /** Optional Button variant. Defaults to "ghost". */
  variant?: React.ComponentProps<typeof Button>["variant"];
  /** Optional Button size. Defaults to "icon". */
  size?: React.ComponentProps<typeof Button>["size"];
}

const TARGET_ATTR = "data-pdf-export-target";
const TARGET_ANCESTOR_ATTR = "data-pdf-export-target-ancestor";

/**
 * Save as PDF button — uses the browser's native print-to-PDF flow.
 *
 * No heavy dependencies: we mark a target element (and its ancestors)
 * with data-attributes, call window.print(), then clean up. The matching
 * print-only CSS in `app/globals.css` hides everything else.
 */
export default function PdfExportButton({
  targetSelector,
  showPreflight = true,
  className,
  label = "Save as PDF",
  variant = "ghost",
  size = "icon",
}: PdfExportButtonProps) {
  const [open, setOpen] = React.useState(false);

  const runPrint = React.useCallback(() => {
    if (typeof window === "undefined") return;

    // Apply scoping markers, if requested.
    let target: HTMLElement | null = null;
    const ancestors: HTMLElement[] = [];
    if (targetSelector) {
      try {
        target = document.querySelector<HTMLElement>(targetSelector);
      } catch {
        target = null;
      }
      if (target) {
        target.setAttribute(TARGET_ATTR, "");
        let parent: HTMLElement | null = target.parentElement;
        while (parent && parent !== document.body) {
          parent.setAttribute(TARGET_ANCESTOR_ATTR, "");
          ancestors.push(parent);
          parent = parent.parentElement;
        }
      }
    }

    // Defer to next tick so the modal close paints before the print dialog opens.
    window.setTimeout(() => {
      try {
        window.print();
      } finally {
        if (target) target.removeAttribute(TARGET_ATTR);
        for (const el of ancestors) el.removeAttribute(TARGET_ANCESTOR_ATTR);
      }
    }, 0);
  }, [targetSelector]);

  const handleClick = React.useCallback(() => {
    if (showPreflight) {
      setOpen(true);
    } else {
      runPrint();
    }
  }, [runPrint, showPreflight]);

  const confirm = React.useCallback(() => {
    setOpen(false);
    runPrint();
  }, [runPrint]);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        aria-label={label}
        title={label}
        className={cn("print:hidden", className)}
      >
        <Printer className="h-4 w-4" aria-hidden="true" />
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-export-title"
          aria-describedby="pdf-export-desc"
          className="print:hidden fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-card text-card-foreground border rounded-lg shadow-lg max-w-sm w-full p-5 animate-pop-in">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 id="pdf-export-title" className="text-base font-semibold">
                Save as PDF
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            <p
              id="pdf-export-desc"
              className="text-sm text-muted-foreground mb-4"
            >
              This opens your system print dialog. Choose{" "}
              <strong className="text-foreground">Save as PDF</strong> as the
              destination to download a copy.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={confirm}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/*
        Print-only brand/footer block. Hidden on screen, rendered when printing.
        Uses suppressHydrationWarning because the date is locale-dependent and
        is rendered fresh on mount.
      */}
      <PrintFooter />
    </>
  );
}

function PrintFooter() {
  const [date, setDate] = React.useState<string>("");

  React.useEffect(() => {
    try {
      setDate(
        new Date().toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      );
    } catch {
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, []);

  return (
    <div
      data-pdf-print-footer
      aria-hidden="true"
      className="hidden print:block mt-8 pt-4 border-t text-xs text-muted-foreground"
    >
      <div className="font-semibold text-foreground">CrimeRadar</div>
      <div>
        Methodology: <span>/methodology</span>
        {date ? <> · Exported {date}</> : null}
      </div>
    </div>
  );
}
