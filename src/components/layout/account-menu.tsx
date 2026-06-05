"use client";

import { ChevronUp, LogOut, Mail, Building2 } from "lucide-react";
import { Popover } from "@/components/ui/popover";
import { useAuth } from "@/context/auth-context";
import { initials, avatarGradient, ROLE_META, BADGE_TONE } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function AccountMenu({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuth();
  const role = user ? ROLE_META[user.role] ?? ROLE_META.REQUESTER : null;

  return (
    <Popover
      side="top"
      align="start"
      className="w-[15.5rem]"
      trigger={({ open, toggle }) => (
        <button
          onClick={toggle}
          aria-label="Account"
          aria-expanded={open}
          className={cn(
            "mt-2.5 flex w-full items-center gap-2.5 rounded-[1rem] border border-white/85 bg-white/70 px-2 py-2 text-left shadow-[0_4px_12px_-8px_oklch(0.5_0.1_45_/_0.35)] transition-colors hover:bg-white/90",
            open && "bg-white/95",
            collapsed && "justify-center px-1.5"
          )}
        >
          <span
            className="grid size-[2.1rem] shrink-0 place-items-center rounded-full text-[0.78rem] font-semibold text-[oklch(0.99_0.01_80)]"
            style={{ background: user ? avatarGradient(user.name) : undefined }}
          >
            {user ? initials(user.name) : "—"}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 leading-tight">
                <b className="block truncate text-[0.84rem] font-semibold">
                  {user?.name ?? "—"}
                </b>
                <span className="text-[0.72rem] text-subtle">
                  {role?.label ?? ""}
                </span>
              </span>
              <ChevronUp className="ml-auto size-4 text-faint" />
            </>
          )}
        </button>
      )}
    >
      {(close) => (
        <div className="overflow-hidden rounded-[0.95rem] border border-line bg-surface shadow-[0_12px_40px_-12px_oklch(0.4_0.02_60_/_0.35),0_2px_6px_-3px_oklch(0.4_0.02_60_/_0.25)]">
          {/* Identity */}
          <div className="flex items-center gap-3 border-b border-line-soft px-3.5 py-3.5">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-full text-[0.85rem] font-semibold text-[oklch(0.99_0.01_80)]"
              style={{ background: user ? avatarGradient(user.name) : undefined }}
            >
              {user ? initials(user.name) : "—"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[0.9rem] font-semibold text-ink">
                {user?.name ?? "—"}
              </p>
              {role && (
                <span
                  className={cn(
                    "mt-0.5 inline-flex items-center rounded-full px-1.5 py-px text-[0.7rem] font-semibold",
                    BADGE_TONE[role.tone] ?? BADGE_TONE.stone
                  )}
                >
                  {role.label}
                </span>
              )}
            </div>
          </div>

          {/* Account info */}
          <div className="space-y-2 px-3.5 py-3 text-[0.82rem]">
            <div className="flex items-center gap-2 text-subtle">
              <Mail className="size-3.5 shrink-0 text-faint" />
              <span className="truncate text-ink">{user?.email ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-subtle">
              <Building2 className="size-3.5 shrink-0 text-faint" />
              <span className="truncate text-ink">
                {user?.departmentCode ?? "No department"}
              </span>
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
