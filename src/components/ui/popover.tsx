"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TriggerProps = { open: boolean; toggle: () => void };

/**
 * Lightweight click-outside popover. Positions an absolute panel relative to
 * its trigger — no portal, matches the SAFEEN shell design language.
 */
export function Popover({
  trigger,
  children,
  side = "bottom",
  align = "end",
  className,
}: {
  trigger: (props: TriggerProps) => ReactNode;
  children: (close: () => void) => ReactNode;
  side?: "top" | "bottom";
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          role="dialog"
          className={cn(
            "absolute z-50 origin-top animate-in fade-in-0 zoom-in-95 duration-150",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
            align === "end" ? "right-0" : "left-0",
            className
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
