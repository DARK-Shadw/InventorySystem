/* ============================================================
   SAFEEN — shared presentation helpers (formatting + visuals)
   No data here — these only shape how real data is displayed.
   ============================================================ */

export const numberFmt = new Intl.NumberFormat("en-US");

/** Initials from a person's name, e.g. "Omar Haddad" -> "OH". */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, oklch(0.62 0.15 290), oklch(0.56 0.17 320))",
  "linear-gradient(135deg, oklch(0.64 0.13 200), oklch(0.58 0.14 235))",
  "linear-gradient(135deg, oklch(0.66 0.14 50), oklch(0.6 0.16 28))",
  "linear-gradient(135deg, oklch(0.62 0.14 160), oklch(0.56 0.14 188))",
  "linear-gradient(135deg, oklch(0.6 0.16 300), oklch(0.55 0.16 330))",
];

/** Deterministic avatar gradient from a seed string. */
export function avatarGradient(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

/** Compact AED stock value: "AED 4.28M", "AED 312.5K", "AED 940". */
export function formatAED(value: number): string {
  if (value >= 1_000_000) return `AED ${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 10_000) return `AED ${(value / 1_000).toFixed(1)}K`;
  return `AED ${numberFmt.format(Math.round(value))}`;
}

/** Relative date for activity, anchored to "now". */
export function relDate(iso: string | Date | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diff <= 0)
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Short absolute date, e.g. "3 Jun". */
export function shortDate(iso: string | Date | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

/** User role -> badge tone + label (matches the SAFEEN spec). */
export const ROLE_META: Record<string, { label: string; tone: string }> = {
  SUPER_ADMIN: { label: "Super Admin", tone: "iris" },
  STORE_MANAGER: { label: "Store Manager", tone: "info" },
  STORE_STAFF: { label: "Store Staff", tone: "brand" },
  DEPT_HEAD: { label: "Dept Head", tone: "warn" },
  REQUESTER: { label: "Requester", tone: "stone" },
};

/** Requisition status -> badge palette + label (matches the SAFEEN spec). */
export const REQ_STATUS: Record<string, { tone: string; label: string }> = {
  DRAFT: { tone: "stone", label: "Draft" },
  SUBMITTED: { tone: "info", label: "Submitted" },
  DEPT_APPROVED: { tone: "iris", label: "Dept Approved" },
  STORE_REVIEWING: { tone: "warn", label: "Store Reviewing" },
  APPROVED: { tone: "ok", label: "Approved" },
  PARTIALLY_ISSUED: { tone: "warn", label: "Partially Issued" },
  ISSUED: { tone: "ok", label: "Issued" },
  REJECTED: { tone: "bad", label: "Rejected" },
  CANCELLED: { tone: "stone", label: "Cancelled" },
};

/** Tailwind classes for a colored badge tone. */
export const BADGE_TONE: Record<string, string> = {
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  info: "bg-info-bg text-info",
  iris: "bg-iris-bg text-iris",
  stone: "bg-stone-bg text-stone",
  brand: "bg-brand-soft text-brand-ink",
};
