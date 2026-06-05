"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Popover } from "@/components/ui/popover";
import { relDate } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      });
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", notificationId: id }),
    });
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "readAll" }),
    });
  }

  return (
    <Popover
      side="bottom"
      align="end"
      className="w-[22rem]"
      trigger={({ open, toggle }) => (
        <button
          onClick={() => {
            if (!open) fetchNotifications();
            toggle();
          }}
          aria-label="Notifications"
          aria-expanded={open}
          className={cn(
            "relative grid size-10 shrink-0 place-items-center rounded-[0.7rem] border border-line bg-surface text-subtle transition hover:bg-[oklch(0.97_0.003_80)] hover:text-ink active:scale-95",
            open && "border-brand/60 bg-brand-soft text-brand-ink"
          )}
        >
          <Bell className="size-[1.1rem]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 grid h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full border-2 border-surface bg-brand px-1 text-[0.66rem] font-bold leading-none text-[oklch(0.99_0.01_70)] shadow-[0_1px_3px_oklch(0.55_0.18_256_/_0.5)]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <div className="overflow-hidden rounded-[0.95rem] border border-line bg-surface shadow-[0_12px_40px_-12px_oklch(0.4_0.02_60_/_0.35),0_2px_6px_-3px_oklch(0.4_0.02_60_/_0.25)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-[0.92rem] font-semibold text-ink">
                Notifications
              </p>
              {unreadCount > 0 && (
                <span className="grid h-[1.2rem] min-w-[1.2rem] place-items-center rounded-full bg-brand-soft px-1.5 text-[0.7rem] font-semibold text-brand-ink">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 rounded-[0.5rem] px-1.5 py-1 text-[0.74rem] font-medium text-subtle transition-colors hover:bg-field hover:text-ink"
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
              <Bell className="size-7 text-faint" />
              <p className="text-[0.86rem] font-medium text-ink">All caught up</p>
              <p className="text-[0.76rem] text-subtle">
                No notifications right now
              </p>
            </div>
          ) : (
            <div className="safeen-scroll max-h-[22rem] divide-y divide-line-soft overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "group flex items-start gap-2.5 px-4 py-3 transition-colors hover:bg-field/60",
                    !n.isRead && "bg-brand-soft/40"
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-[0.5rem] shrink-0 rounded-full",
                      n.isRead ? "bg-transparent" : "bg-brand"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.84rem] font-medium leading-snug text-ink">
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[0.78rem] leading-snug text-subtle">
                      {n.message}
                    </p>
                    <p className="mt-1 text-[0.7rem] text-faint">
                      {relDate(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n.id)}
                      title="Mark as read"
                      className="shrink-0 rounded-[0.45rem] p-1 text-faint opacity-0 transition hover:bg-surface hover:text-brand group-hover:opacity-100"
                    >
                      <Check className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <Link
            href="/alerts"
            onClick={close}
            className="block border-t border-line-soft px-4 py-2.5 text-center text-[0.8rem] font-medium text-subtle transition-colors hover:bg-field hover:text-ink"
          >
            Manage alerts
          </Link>
        </div>
      )}
    </Popover>
  );
}
