"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowRight,
  BarChart3,
  Package,
  ClipboardList,
  TriangleAlert,
  CircleOff,
  Ship,
  Anchor,
  Waves,
  ShieldCheck,
  Truck,
  Boxes,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  formatAED,
  numberFmt,
  initials,
  avatarGradient,
  shortDate,
  relDate,
} from "@/lib/ui";
import { useAuth } from "@/context/auth-context";

interface DashboardData {
  stats: {
    totalItems: number;
    stockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    pendingRequisitions: number;
  };
  lowStockAlerts: {
    itemCode: string;
    description: string;
    classDescription: string | null;
    currentBalance: number;
    reorderPoint: number;
    criticality: number;
  }[];
  recentRequisitions: {
    id: string;
    requisitionNumber: string;
    department: string;
    requester: string;
    project: string | null;
    location: string | null;
    itemCount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

type Req = DashboardData["recentRequisitions"][number];

const COLUMNS: {
  title: string;
  dot: string;
  bar: string;
  statuses: string[];
}[] = [
  { title: "Submitted", dot: "bg-info", bar: "bg-info", statuses: ["DRAFT", "SUBMITTED"] },
  {
    title: "In review",
    dot: "bg-warn",
    bar: "bg-warn",
    statuses: ["DEPT_APPROVED", "STORE_REVIEWING", "APPROVED"],
  },
  { title: "Issued", dot: "bg-ok", bar: "bg-ok", statuses: ["ISSUED", "PARTIALLY_ISSUED"] },
];

const PROGRESS: Record<string, number> = {
  DRAFT: 4,
  SUBMITTED: 18,
  DEPT_APPROVED: 42,
  STORE_REVIEWING: 58,
  APPROVED: 72,
  PARTIALLY_ISSUED: 88,
  ISSUED: 100,
};

const DEPT_ICONS: { match: RegExp; icon: LucideIcon }[] = [
  { match: /subsea|rov/i, icon: Boxes },
  { match: /surv/i, icon: Waves },
  { match: /div/i, icon: Anchor },
  { match: /safe|hse|health/i, icon: ShieldCheck },
  { match: /marine|vessel/i, icon: Ship },
  { match: /log|transport/i, icon: Truck },
];
const TONES = ["brand", "info", "ok", "warn", "iris"] as const;
const TONE_CLASS: Record<string, string> = {
  brand: "bg-brand-soft text-brand",
  info: "bg-info-bg text-info",
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  iris: "bg-iris-bg text-iris",
};

function deptIcon(dept: string): LucideIcon {
  return DEPT_ICONS.find((d) => d.match.test(dept))?.icon ?? ClipboardList;
}
function deptTone(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [now, setNow] = useState<Date | null>(null);

  // Stamp the current time on mount so the greeting + date render client-side.
  useEffect(() => {
    setNow(new Date());
  }, []);
  const [dismissed, setDismissed] = useState(false);
  const showWelcome = now != null && !dismissed;

  const greeting =
    now == null
      ? "Welcome"
      : now.getHours() < 12
        ? "Good morning"
        : now.getHours() < 17
          ? "Good afternoon"
          : "Good evening";
  const displayName = user?.name ?? "there";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(
            `Couldn't load dashboard data (HTTP ${res.status}). Is the database running and seeded?`
          );
        }
        return res.json();
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load dashboard.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = data
    ? [
        {
          label: "Total items",
          value: numberFmt.format(data.stats.totalItems),
          cap: "active SKUs",
          href: "/inventory",
          icon: Package,
          tone: "brand",
        },
        {
          label: "Pending requisitions",
          value: numberFmt.format(data.stats.pendingRequisitions),
          cap: "awaiting review",
          href: "/requisitions",
          icon: ClipboardList,
          tone: "info",
        },
        {
          label: "Low stock alerts",
          value: numberFmt.format(data.stats.lowStockCount),
          cap: "below reorder point",
          href: "/inventory",
          icon: TriangleAlert,
          tone: "warn",
        },
        {
          label: "Out of stock",
          value: numberFmt.format(data.stats.outOfStockCount),
          cap: "zero balance items",
          href: "/inventory",
          icon: CircleOff,
          tone: "bad",
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-[1400px]">
      {error && (
        <div className="reveal mb-5 flex items-start gap-2.5 rounded-2xl border border-bad/20 bg-bad-bg px-4 py-3 text-[0.86rem] text-bad">
          <TriangleAlert className="mt-0.5 size-[1.05rem] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Welcome chip — first visit in a while */}
      {showWelcome && now && (
        <div className="reveal mb-6 flex items-center gap-3.5 rounded-2xl border border-line-soft bg-[linear-gradient(105deg,oklch(0.99_0.006_256),oklch(0.95_0.04_256)_135%)] px-5 py-4 shadow-[0_1px_2px_oklch(0.5_0.01_75_/_0.04)]">
          <span
            className="grid size-[3.1rem] shrink-0 place-items-center rounded-full text-[1.05rem] font-semibold text-[oklch(0.99_0.01_80)]"
            style={{ background: avatarGradient(user?.name ?? "SAFEEN") }}
          >
            {initials(user?.name ?? "SS")}
          </span>
          <div className="min-w-0">
            <div className="text-[1.4rem] font-semibold leading-tight tracking-tight">
              {greeting}, {displayName}
            </div>
            <div className="mt-1 text-[0.85rem] text-subtle">
              You have{" "}
              <b className="font-semibold text-brand">
                {numberFmt.format(data?.stats.pendingRequisitions ?? 0)}{" "}
                {(data?.stats.pendingRequisitions ?? 0) === 1
                  ? "requisition"
                  : "requisitions"}
              </b>{" "}
              awaiting review and{" "}
              <b className="font-semibold text-warn">
                {numberFmt.format(data?.stats.lowStockCount ?? 0)}{" "}
                {(data?.stats.lowStockCount ?? 0) === 1 ? "item" : "items"}
              </b>{" "}
              below reorder point.
            </div>
          </div>
          <div className="ml-auto shrink-0 text-right">
            <div className="text-[0.9rem] font-semibold tracking-tight tabular-nums">
              {now.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="mt-0.5 text-[0.8rem] text-subtle">
              {now.toLocaleDateString("en-US", { weekday: "long" })}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="grid size-8 shrink-0 self-start place-items-center rounded-[0.55rem] text-faint transition hover:bg-[oklch(0.96_0.005_60)] hover:text-ink"
          >
            <X className="size-[1.1rem]" />
          </button>
        </div>
      )}

      {/* Hero */}
      <div className="reveal mb-7 flex flex-wrap items-end gap-4">
        <div className="min-w-64 flex-1">
          <p className="flex items-center gap-1.5 text-[0.8rem] font-medium text-subtle">
            <span className="text-[0.95rem]">📦</span> Safeen Survey &amp; Subsea
            — Main Store
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Total stock value on hand
          </h1>
          <div className="mt-1 bg-[linear-gradient(95deg,oklch(0.46_0.2_262),oklch(0.55_0.18_256)_52%,oklch(0.66_0.15_238))] bg-clip-text text-[3.2rem] font-extrabold leading-none tracking-[-0.045em] text-transparent tabular-nums">
            {loading ? "AED —" : formatAED(data?.stats.stockValue ?? 0)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/reports"
            className="inline-flex h-[2.55rem] items-center justify-center gap-2 rounded-[0.7rem] border border-line bg-surface px-4 text-[0.875rem] font-medium text-ink transition hover:bg-[oklch(0.975_0.003_80)]"
          >
            <BarChart3 className="size-4" />
            Reports
          </Link>
          <Link
            href="/requisitions/new"
            className="inline-flex h-[2.55rem] items-center justify-center gap-2 rounded-[0.7rem] border-0 bg-[linear-gradient(to_bottom,oklch(0.33_0.02_285),oklch(0.215_0.006_285)_58%)] px-4 text-[0.875rem] font-semibold text-primary-foreground shadow-[0_1px_2px_oklch(0.2_0.02_285_/_0.3),0_10px_22px_-12px_oklch(0.2_0.02_285_/_0.6),inset_0_1px_0_oklch(1_0_0_/_0.6),inset_0_-1px_1px_oklch(0_0_0_/_0.18)] transition active:translate-y-px"
          >
            <Plus className="size-4" />
            New Requisition
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-7 grid grid-cols-4 gap-3.5 max-[1180px]:grid-cols-2">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-[7.5rem] rounded-2xl" />
            ))
          : stats.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="reveal block rounded-2xl border border-line-soft bg-surface p-4 shadow-[0_1px_2px_oklch(0.5_0.01_75_/_0.03)] transition-all hover:-translate-y-0.5 hover:border-line hover:shadow-[0_16px_30px_-18px_oklch(0.4_0.02_75_/_0.4)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[0.82rem] font-medium text-subtle">
                    {s.label}
                  </div>
                  <span
                    className={`grid size-[1.9rem] place-items-center rounded-[0.55rem] ${TONE_CLASS[s.tone] ?? "bg-bad-bg text-bad"}`}
                  >
                    <s.icon className="size-[1.05rem]" />
                  </span>
                </div>
                <div className="mt-2 text-[1.9rem] font-extrabold leading-none tracking-tight tabular-nums">
                  {s.value}
                </div>
                <div className="mt-3 text-[0.76rem] text-subtle">{s.cap}</div>
              </Link>
            ))}
      </div>

      {/* Section head */}
      <div className="mb-4 flex items-center gap-2.5">
        <h2 className="text-[1.15rem] font-semibold tracking-tight">
          Recent requisitions
        </h2>
        <Link
          href="/requisitions"
          className="ml-auto inline-flex items-center gap-1 text-[0.84rem] font-medium text-subtle transition hover:text-brand"
        >
          View all <ArrowRight className="size-[0.9rem]" />
        </Link>
      </div>

      {/* Board */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3.5 max-[1180px]:grid-cols-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2.5">
              <div className="skeleton ml-0.5 h-5 w-2/5" />
              <div className="skeleton h-[9.5rem] rounded-2xl" />
              <div className="skeleton h-[9.5rem] rounded-2xl" />
            </div>
          ))}
        </div>
      ) : (
        <Board reqs={data?.recentRequisitions ?? []} />
      )}
    </div>
  );
}

function Board({ reqs }: { reqs: Req[] }) {
  return (
    <div className="grid grid-cols-3 items-start gap-3.5 max-[1180px]:grid-cols-1">
      {COLUMNS.map((col) => {
        const cards = reqs.filter((r) => col.statuses.includes(r.status));
        return (
          <div key={col.title}>
            <div className="flex items-center gap-1.5 px-0.5 pb-2.5 text-[0.84rem] font-semibold text-ink">
              <span className={`size-2 rounded-full ${col.dot}`} />
              {col.title}
              <span className="grid h-[1.3rem] min-w-[1.3rem] place-items-center rounded-full border border-line-soft bg-canvas px-1.5 text-[0.72rem] font-semibold text-subtle">
                {cards.length}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {cards.map((r) => (
                <ReqCard key={r.id} req={r} bar={col.bar} />
              ))}
              <Link
                href="/requisitions/new"
                className="flex items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-brand/40 bg-surface p-3.5 text-[0.84rem] font-medium text-subtle transition hover:border-brand hover:bg-[oklch(0.97_0.003_80)] hover:text-brand"
              >
                <Plus className="size-4" />
                Add requisition
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReqCard({ req, bar }: { req: Req; bar: string }) {
  const Icon = deptIcon(req.department);
  const tone = deptTone(req.department);
  const title = req.project ?? req.department;
  const progress = PROGRESS[req.status] ?? 0;

  return (
    <Link
      href={`/requisitions/${req.id}`}
      className="reveal block rounded-2xl border border-line-soft bg-surface p-3.5 shadow-[0_1px_2px_oklch(0.5_0.01_75_/_0.03)] transition-all hover:-translate-y-0.5 hover:border-line hover:shadow-[0_16px_30px_-18px_oklch(0.4_0.02_75_/_0.4)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`grid size-[1.9rem] place-items-center rounded-[0.55rem] ${TONE_CLASS[tone]}`}
        >
          <Icon className="size-[1.05rem]" strokeWidth={1.9} />
        </span>
        <span
          className="grid size-[1.55rem] place-items-center rounded-full border-[1.5px] border-surface text-[0.6rem] font-semibold text-[oklch(0.99_0.01_80)]"
          style={{ background: avatarGradient(req.requester) }}
          title={req.requester}
        >
          {initials(req.requester)}
        </span>
      </div>
      <div className="mono mt-2.5 text-[0.72rem] text-faint">
        {req.requisitionNumber}
      </div>
      <div className="mt-0.5 line-clamp-2 text-[0.92rem] font-semibold leading-snug tracking-[-0.01em]">
        {title}
      </div>
      <div className="mt-1 truncate text-[0.76rem] text-subtle">
        {req.department} · {req.itemCount} item{req.itemCount === 1 ? "" : "s"}
      </div>
      <div className="mt-3 flex gap-4">
        <span className="text-[0.74rem] text-subtle">
          Created
          <b className="mt-0.5 block font-semibold text-ink">
            {shortDate(req.createdAt)}
          </b>
        </span>
        <span className="text-[0.74rem] text-subtle">
          Updated
          <b className="mt-0.5 block font-semibold text-ink">
            {relDate(req.updatedAt)}
          </b>
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[oklch(0.92_0.006_80)]">
        <i className={`block h-full rounded-full ${bar}`} style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 border-t border-line-soft pt-2.5 text-[0.74rem] text-faint">
        {req.location ? (
          <>
            Destination: <b className="font-semibold text-subtle">{req.location}</b>
          </>
        ) : (
          <>
            Requested by{" "}
            <b className="font-semibold text-subtle">{req.requester}</b>
          </>
        )}
      </div>
    </Link>
  );
}
