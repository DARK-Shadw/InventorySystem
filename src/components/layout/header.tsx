"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, TriangleAlert } from "lucide-react";
import { SettingsMenu } from "@/components/layout/settings-menu";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  inventory: "Inventory",
  requisitions: "Requisitions",
  alerts: "Alerts",
  departments: "Departments",
  locations: "Locations",
  projects: "Projects",
  users: "Users",
  reports: "Reports",
  import: "Import",
  settings: "Settings",
  new: "New",
};

function buildCrumb(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);
  const labels = segments.map((seg) => {
    if (SEGMENT_LABELS[seg]) return SEGMENT_LABELS[seg];
    // ids / unknown segments: show as a short ref
    if (seg.length > 12) return seg.slice(0, 10) + "…";
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  });
  return ["Store", ...labels];
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  const crumb = buildCrumb(pathname);
  const alertsActive =
    pathname === "/alerts" || pathname.startsWith("/alerts/");

  function runSearch() {
    const q = query.trim();
    if (!q) return;
    router.push(`/inventory?q=${encodeURIComponent(q)}`);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex flex-none items-center gap-2.5 border-b border-line-soft px-[1.1rem] py-3.5 max-lg:pl-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[0.86rem] text-subtle">
        {crumb.map((part, i) => {
          const last = i === crumb.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5">
              {last ? (
                <b className="font-semibold text-ink">{part}</b>
              ) : (
                <>
                  <span>{part}</span>
                  <span className="text-faint">/</span>
                </>
              )}
            </span>
          );
        })}
      </nav>

      <span className="ml-auto" />

      {/* Search */}
      <label className="flex h-10 w-[17rem] items-center gap-2 rounded-[0.7rem] border border-line bg-field px-3 text-faint transition focus-within:border-brand/70 focus-within:bg-surface focus-within:shadow-[0_0_0_3px_oklch(0.55_0.18_256_/_0.16)] max-md:w-auto max-md:flex-1">
        <Search className="size-4 shrink-0" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search items, requisitions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
          className="w-full bg-transparent text-[0.875rem] text-ink outline-none placeholder:text-faint"
        />
        <span className="flex items-center gap-1 max-sm:hidden">
          <kbd className="grid h-[1.2rem] min-w-[1.2rem] place-items-center rounded-[0.34rem] border border-line bg-canvas text-[0.72rem] font-medium text-faint">
            ⌘
          </kbd>
          <kbd className="grid h-[1.2rem] min-w-[1.2rem] place-items-center rounded-[0.34rem] border border-line bg-canvas text-[0.72rem] font-medium text-faint">
            /
          </kbd>
        </span>
      </label>

      {/* Notifications */}
      <NotificationsMenu />

      {/* Alerts */}
      <button
        onClick={() => router.push("/alerts")}
        aria-label="Alerts"
        title="Stock alerts"
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-[0.7rem] border border-line bg-surface text-subtle transition hover:bg-[oklch(0.97_0.003_80)] hover:text-ink active:scale-95",
          alertsActive && "border-brand/60 bg-brand-soft text-brand-ink"
        )}
      >
        <TriangleAlert className="size-[1.1rem]" />
      </button>

      {/* Settings */}
      <SettingsMenu />
    </div>
  );
}
