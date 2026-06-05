"use client";

import * as React from "react";
import { Search, ChevronUp, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials, avatarGradient } from "@/lib/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Page header — eyebrow + title + sub on the left, action buttons on the right.
 * Matches the `.pagehead` block from the SAFEEN design system.
 */
export function PageHead({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="pagehead shrink-0">
      <div className="lead">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {children && <div className="toolbar">{children}</div>}
    </div>
  );
}

/**
 * Inline search field — `.control.search-inline` with a leading search icon
 * and a ⌘/Ctrl+`/` focus shortcut (shown as a hint, wins over the global one).
 */
export function SearchControl({
  className,
  style,
  ...props
}: React.ComponentProps<"input"> & {
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        // Capture phase + stop so the page search wins over the global one.
        e.stopImmediatePropagation();
        ref.current?.focus();
        ref.current?.select();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  return (
    <label className={cn("control search-inline", className)} style={style}>
      <Search aria-hidden />
      <input ref={ref} type="text" className="min-w-0 flex-1" {...props} />
      <span className="ml-1 hidden items-center gap-1 sm:flex">
        <kbd className="grid h-[1.2rem] min-w-[1.2rem] place-items-center rounded-[0.34rem] border border-line bg-canvas text-[0.72rem] font-medium text-faint">
          ⌘
        </kbd>
        <kbd className="grid h-[1.2rem] min-w-[1.2rem] place-items-center rounded-[0.34rem] border border-line bg-canvas text-[0.72rem] font-medium text-faint">
          /
        </kbd>
      </span>
    </label>
  );
}

/**
 * Custom select with a fully designed dropdown panel (native option lists
 * can't be styled). Reads `<option>` children and keeps the familiar
 * `value` / `onChange(e.target.value)` API so call sites stay unchanged.
 */
export function SelectControl({
  value,
  onChange,
  children,
  className,
  variant = "control",
  disabled,
}: {
  value?: string | number;
  onChange?: (e: { target: { value: string } }) => void;
  children: React.ReactNode;
  className?: string;
  variant?: "control" | "inp";
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [hi, setHi] = React.useState(-1);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const opts = React.useMemo(
    () =>
      React.Children.toArray(children)
        .filter((c): c is React.ReactElement<{ value?: string | number; children?: React.ReactNode }> =>
          React.isValidElement(c)
        )
        .map((c) => ({
          value: String(c.props.value ?? ""),
          label: c.props.children,
        })),
    [children]
  );

  const current = String(value ?? "");
  const selected = opts.find((o) => o.value === current);

  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function pick(v: string) {
    onChange?.({ target: { value: v } });
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      if (!open) {
        e.preventDefault();
        setOpen(true);
        setHi(Math.max(0, opts.findIndex((o) => o.value === current)));
        return;
      }
    }
    if (!open) return;
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(h + 1, opts.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (opts[hi]) pick(opts[hi].value);
    }
  }

  return (
    <div ref={wrapRef} className={cn("selectwrap", className)}>
      <button
        type="button"
        disabled={disabled}
        data-open={open}
        className={cn("select-trigger", variant === "inp" && "inp")}
        onClick={() => {
          setOpen((o) => !o);
          setHi(opts.findIndex((o) => o.value === current));
        }}
        onKeyDown={onKeyDown}
      >
        <span className={cn("sv", !selected && "ph")}>
          {selected ? selected.label : opts[0]?.label ?? "Select…"}
        </span>
        <ChevronDown className="chev" aria-hidden />
      </button>
      {open && (
        <div className="select-panel safeen-scroll" role="listbox">
          {opts.map((o, i) => (
            <div
              key={o.value + i}
              role="option"
              aria-selected={o.value === current}
              className={cn(
                "select-opt",
                o.value === current && "sel",
                i === hi && "hi"
              )}
              onMouseEnter={() => setHi(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(o.value);
              }}
            >
              <span>{o.label}</span>
              {o.value === current && <Check className="ck" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** A colored pill. `tone` maps to the `b-*` palette; `dot` adds a leading dot. */
export function Pill({
  tone,
  dot,
  className,
  children,
}: {
  tone:
    | "green"
    | "amber"
    | "red"
    | "blue"
    | "violet"
    | "grey"
    | "accent";
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("badge", `b-${tone}`, dot && "dotb", className)}>
      {children}
    </span>
  );
}

/** Small circular avatar with deterministic gradient + initials. */
export function Avatar({ name }: { name: string }) {
  return (
    <span className="av-sm" style={{ background: avatarGradient(name) }}>
      {initials(name)}
    </span>
  );
}

/**
 * Scroll shell for a table page: a rounded `.tablewrap` that fills remaining
 * height with the table scrolling internally (sticky header stays put).
 */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="tablewrap flex min-h-0 flex-1 flex-col">
      <div className="safeen-scroll min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

/**
 * Standard popup shell — roomy padding and consistent header typography
 * (title + muted description) shared across every dialog in the app.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  size = "lg",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: "md" | "lg" | "xl";
  children: React.ReactNode;
}) {
  const max =
    size === "xl"
      ? "sm:max-w-2xl"
      : size === "md"
        ? "sm:max-w-md"
        : "sm:max-w-lg";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "safeen-scroll max-h-[88vh] gap-5 overflow-y-auto rounded-2xl p-7 max-sm:p-5",
          max
        )}
      >
        <DialogHeader className="gap-1">
          <DialogTitle className="text-[1.2rem] font-semibold tracking-[-0.02em] text-ink">
            {title}
          </DialogTitle>
          {description && (
            <p className="text-[0.85rem] leading-snug text-subtle">
              {description}
            </p>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Number input fused with an integrated up/down stepper — one clean well,
 * no detached native browser spinner.
 */
export function NumberField({
  value,
  onValueChange,
  min = 0,
  step = 1,
  integer = false,
  className,
}: {
  value: number;
  onValueChange: (n: number) => void;
  min?: number;
  step?: number;
  integer?: boolean;
  className?: string;
}) {
  const clamp = (n: number) => (min != null ? Math.max(min, n) : n);
  const commit = (n: number) =>
    onValueChange(integer ? Math.round(clamp(n)) : clamp(n));

  return (
    <div className={cn("numfield", className)}>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => {
          const raw = integer
            ? parseInt(e.target.value)
            : parseFloat(e.target.value);
          onValueChange(Number.isNaN(raw) ? (min ?? 0) : raw);
        }}
      />
      <div className="numsteps">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Increase"
          onClick={() => commit((Number(value) || 0) + step)}
        >
          <ChevronUp />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Decrease"
          onClick={() => commit((Number(value) || 0) - step)}
        >
          <ChevronDown />
        </button>
      </div>
    </div>
  );
}
