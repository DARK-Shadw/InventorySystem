"use client";

import { Settings, LogOut, ShieldCheck } from "lucide-react";
import { Popover } from "@/components/ui/popover";
import { useAuth } from "@/context/auth-context";
import { initials, avatarGradient, ROLE_META, BADGE_TONE } from "@/lib/ui";
import { cn } from "@/lib/utils";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[0.66rem] font-medium uppercase tracking-wider text-faint">
        {label}
      </p>
      <p className="truncate text-[0.84rem] text-ink">{value || "—"}</p>
    </div>
  );
}

export function SettingsMenu() {
  const { user, logout } = useAuth();
  const role = user ? ROLE_META[user.role] ?? ROLE_META.REQUESTER : null;

  return (
    <Popover
      side="bottom"
      align="end"
      className="w-[21rem]"
      trigger={({ open, toggle }) => (
        <button
          onClick={toggle}
          aria-label="Settings"
          aria-expanded={open}
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-[0.7rem] border border-line bg-surface text-subtle transition hover:bg-[oklch(0.97_0.003_80)] hover:text-ink active:scale-95",
            open && "border-brand/60 bg-brand-soft text-brand-ink"
          )}
        >
          <Settings className="size-[1.1rem]" />
        </button>
      )}
    >
      {(close) => (
        <div className="overflow-hidden rounded-[0.95rem] border border-line bg-surface shadow-[0_12px_40px_-12px_oklch(0.4_0.02_60_/_0.35),0_2px_6px_-3px_oklch(0.4_0.02_60_/_0.25)]">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-line-soft px-4 py-3.5">
            <span
              className="grid size-11 shrink-0 place-items-center rounded-full text-[0.92rem] font-semibold text-[oklch(0.99_0.01_80)]"
              style={{ background: user ? avatarGradient(user.name) : undefined }}
            >
              {user ? initials(user.name) : "—"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[0.95rem] font-semibold text-ink">
                {user?.name ?? "—"}
              </p>
              <p className="truncate text-[0.8rem] text-subtle">
                {user?.email ?? "—"}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 px-4 py-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <div className="space-y-0.5">
                <p className="text-[0.66rem] font-medium uppercase tracking-wider text-faint">
                  Role
                </p>
                {role && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[0.74rem] font-semibold",
                      BADGE_TONE[role.tone] ?? BADGE_TONE.stone
                    )}
                  >
                    {role.label}
                  </span>
                )}
              </div>
              <Field label="Department" value={user?.departmentCode ?? "—"} />
              <Field label="Name" value={user?.name ?? ""} />
              <Field label="Email" value={user?.email ?? ""} />
            </div>

            <div className="flex items-start gap-2 rounded-[0.6rem] bg-field px-3 py-2.5 text-[0.74rem] leading-snug text-subtle">
              <ShieldCheck className="mt-px size-3.5 shrink-0 text-faint" />
              <span>
                To change your password or account details, contact a Store
                Manager or Super Admin from the Users page.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line-soft pt-4">
              <Field label="Application" value="SAFEEN Inventory" />
              <Field label="Version" value="0.1.0" />
            </div>
          </div>

          {/* Sign out */}
          <div className="border-t border-line-soft p-2">
            <button
              onClick={() => {
                close();
                logout();
              }}
              className="flex w-full items-center gap-2 rounded-[0.6rem] px-3 py-2 text-[0.86rem] font-medium text-bad transition-colors hover:bg-bad-bg"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}
