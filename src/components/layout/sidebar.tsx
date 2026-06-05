"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Building2,
  MapPin,
  FolderOpen,
  Users,
  BarChart3,
  Upload,
  PanelLeft,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountMenu } from "@/components/layout/account-menu";

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  count?: "requisitions";
};
type NavSection = { group: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    group: "Main menu",
    items: [
      { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { key: "inventory", label: "Inventory", href: "/inventory", icon: Package },
      { key: "requisitions", label: "Requisitions", href: "/requisitions", icon: ClipboardList, count: "requisitions" },
    ],
  },
  {
    group: "Organisation",
    items: [
      { key: "departments", label: "Departments", href: "/departments", icon: Building2 },
      { key: "locations", label: "Locations", href: "/locations", icon: MapPin },
      { key: "projects", label: "Projects", href: "/projects", icon: FolderOpen },
    ],
  },
  {
    group: "Administration",
    items: [
      { key: "users", label: "Users", href: "/users", icon: Users },
      { key: "reports", label: "Reports", href: "/reports", icon: BarChart3 },
      { key: "import", label: "Import", href: "/import", icon: Upload },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [counts, setCounts] = useState<{ requisitions: number }>({
    requisitions: 0,
  });

  useEffect(() => {
    if (localStorage.getItem("safeen.collapsed") === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((dash) => {
        if (cancelled) return;
        setCounts({ requisitions: dash?.stats?.pendingRequisitions ?? 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function toggleCollapse() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("safeen.collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <>
      {/* Mobile open button */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="fixed top-3 left-3 z-50 grid size-10 place-items-center rounded-[0.7rem] border border-line bg-surface text-subtle shadow-sm lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "z-40 flex shrink-0 flex-col bg-sidebar pt-4 pb-3.5 transition-all duration-200",
          collapsed ? "px-2.5 lg:w-[4.6rem]" : "px-3 lg:w-[16.5rem]",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:w-[16.5rem] max-lg:shadow-2xl",
          mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-2 pb-4",
            collapsed && "flex-col gap-2 px-0"
          )}
        >
          {collapsed ? (
            <span className="grid size-[2.3rem] shrink-0 place-items-center overflow-hidden rounded-[0.7rem] bg-surface ring-1 ring-line-soft shadow-[0_1px_2px_oklch(0.5_0.01_75_/_0.06)]">
              <Image
                src="/safeen-favicon.png"
                alt="SAFEEN"
                width={72}
                height={72}
                priority
                className="size-full object-contain p-1"
              />
            </span>
          ) : (
            <Image
              src="/safeen.png"
              alt="SAFEEN Subsea"
              width={500}
              height={150}
              priority
              className="h-[2.1rem] w-auto shrink-0 object-contain"
            />
          )}
          <button
            onClick={toggleCollapse}
            aria-label="Collapse sidebar"
            className={cn(
              "ml-auto hidden size-[1.9rem] place-items-center rounded-[0.5rem] text-faint transition-colors hover:bg-[oklch(0.96_0.005_60)] hover:text-ink lg:grid",
              collapsed && "ml-0"
            )}
          >
            <PanelLeft className="size-[1.05rem]" />
          </button>
        </div>

        {/* Nav */}
        <nav
          className={cn(
            "flex flex-1 flex-col gap-0.5",
            collapsed ? "overflow-visible" : "overflow-y-auto"
          )}
        >
          {NAV.map((section) => (
            <div key={section.group}>
              {collapsed ? (
                <div className="mx-2 my-2 h-px bg-[oklch(0.9_0.012_56)]" />
              ) : (
                <p className="px-2.5 pt-3.5 pb-1 text-[0.7rem] font-medium text-[oklch(0.6_0.02_60)]">
                  {section.group}
                </p>
              )}
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const count = item.count ? counts[item.count] : 0;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-label={collapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-[0.7rem] px-2.5 py-2 text-[0.88rem] font-medium transition-colors",
                      collapsed && "justify-center px-2.5",
                      active
                        ? "bg-brand-soft font-semibold text-brand-ink shadow-[0_1px_2px_oklch(0.55_0.18_256_/_0.18),inset_0_1px_0_oklch(1_0_0_/_0.5)]"
                        : "text-[oklch(0.45_0.015_55)] hover:bg-[oklch(0.96_0.005_60)] hover:text-ink"
                    )}
                  >
                    <item.icon
                      className={cn("size-[1.1rem] shrink-0", active && "text-brand")}
                      strokeWidth={1.8}
                    />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {collapsed && (
                      <span className="pointer-events-none absolute left-[calc(100%+0.55rem)] top-1/2 z-50 -translate-x-1 -translate-y-1/2 whitespace-nowrap rounded-[0.5rem] bg-ink px-2.5 py-1.5 text-[0.74rem] font-medium text-[oklch(0.97_0.005_80)] opacity-0 shadow-[0_8px_20px_-8px_oklch(0.2_0.02_60_/_0.55)] transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
                        {item.label}
                        {count > 0 && (
                          <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.5 text-[0.68rem] font-semibold text-[oklch(0.99_0.01_70)]">
                            {count}
                          </span>
                        )}
                      </span>
                    )}
                    {!collapsed && count > 0 && (
                      <span
                        className={cn(
                          "grid h-[1.4rem] min-w-[1.4rem] place-items-center rounded-full px-1.5 text-[0.72rem] font-semibold",
                          active
                            ? "bg-brand text-[oklch(0.99_0.01_70)]"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Account */}
        <AccountMenu collapsed={collapsed} />
      </aside>
    </>
  );
}
