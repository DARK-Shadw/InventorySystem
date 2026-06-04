"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    function fetchCount() {
      fetch("/api/notifications?unread=true")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setUnreadCount(data.unreadCount);
        });
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items, requisitions..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/alerts">
          <button className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]"
              >
                {unreadCount}
              </Badge>
            )}
          </button>
        </Link>
      </div>
    </header>
  );
}
