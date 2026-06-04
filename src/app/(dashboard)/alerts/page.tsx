"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  PackageX,
  RefreshCw,
  Check,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AlertRule {
  id: string;
  alertType: string;
  threshold: number | null;
  isActive: boolean;
  itemId: string | null;
  item: { itemCode: string; description: string; reorderPoint: number } | null;
  createdBy: { name: string };
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface SearchItem {
  id: string;
  itemCode: string;
  description: string;
  issueUnit: string;
  availableStock: number;
}

const alertTypeLabels: Record<string, { label: string; icon: typeof Bell; color: string }> = {
  LOW_STOCK: { label: "Low Stock", icon: AlertTriangle, color: "bg-amber-100 text-amber-700" },
  OUT_OF_STOCK: { label: "Out of Stock", icon: PackageX, color: "bg-red-100 text-red-700" },
  REORDER_POINT: { label: "Reorder Point", icon: RefreshCw, color: "bg-blue-100 text-blue-700" },
};

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [newAlertType, setNewAlertType] = useState("REORDER_POINT");
  const [newItemId, setNewItemId] = useState("");
  const [newThreshold, setNewThreshold] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [itemSearch, setItemSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SearchItem | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searching, setSearching] = useState(false);

  function fetchData() {
    setLoading(true);
    Promise.all([
      fetch("/api/alerts").then((r) => r.json()),
      fetch("/api/notifications").then((r) => r.json()),
    ])
      .then(([rulesData, notifData]) => {
        setRules(rulesData);
        setNotifications(notifData.notifications);
        setUnreadCount(notifData.unreadCount);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (itemSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      fetch(`/api/items/search?q=${encodeURIComponent(itemSearch)}`)
        .then((r) => r.json())
        .then((data) => {
          setSearchResults(data);
          setShowSearch(true);
        })
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [itemSearch]);

  async function handleCheckAlerts() {
    setChecking(true);
    await fetch("/api/alerts/check", { method: "POST" });
    fetchData();
    setChecking(false);
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: newItemId || null,
          alertType: newAlertType,
          threshold: newThreshold ? parseInt(newThreshold) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create rule");
      }

      setAddOpen(false);
      setNewItemId("");
      setNewThreshold("");
      setSelectedItem(null);
      setItemSearch("");
      fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRule(id: string) {
    await fetch("/api/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchData();
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "readAll" }),
    });
    fetchData();
  }

  async function handleMarkRead(notificationId: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", notificationId }),
    });
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Manage stock alert rules and notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCheckAlerts} disabled={checking}>
            {checking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Check Now
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alert Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Alert Rules ({rules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <Bell className="mb-2 h-8 w-8" />
                <p className="text-sm">No alert rules configured</p>
                <p className="text-xs">
                  Add a rule to get notified about low stock
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => {
                  const type = alertTypeLabels[rule.alertType] || alertTypeLabels.LOW_STOCK;
                  const Icon = type.icon;
                  return (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-md p-1.5 ${type.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={type.color}>
                              {type.label}
                            </Badge>
                            {rule.threshold && (
                              <span className="text-xs text-muted-foreground">
                                Threshold: {rule.threshold}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {rule.item
                              ? `${rule.item.itemCode} — ${rule.item.description.substring(0, 50)}...`
                              : "All items (global rule)"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} unread
                  </Badge>
                )}
              </CardTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <Bell className="mb-2 h-8 w-8" />
                <p className="text-sm">No notifications</p>
                <p className="text-xs">
                  Click &quot;Check Now&quot; to scan for alerts
                </p>
              </div>
            ) : (
              <div className="max-h-[500px] space-y-2 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`rounded-lg border p-3 ${
                      notif.isRead ? "opacity-60" : "border-amber-200 bg-amber-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {notif.message}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent"
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Rule Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Alert Rule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddRule} className="space-y-4">
            {formError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label>Alert Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newAlertType}
                onChange={(e) => setNewAlertType(e.target.value)}
              >
                <option value="REORDER_POINT">Reorder Point — alert when stock hits ROP</option>
                <option value="LOW_STOCK">Low Stock — alert below custom threshold</option>
                <option value="OUT_OF_STOCK">Out of Stock — alert when zero</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Item (leave empty for all items)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search item..."
                  className="pl-9"
                  value={selectedItem ? `${selectedItem.itemCode} — ${selectedItem.description.substring(0, 40)}` : itemSearch}
                  onChange={(e) => {
                    setItemSearch(e.target.value);
                    setSelectedItem(null);
                    setNewItemId("");
                  }}
                  onFocus={() => searchResults.length > 0 && setShowSearch(true)}
                  onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
                {showSearch && searchResults.length > 0 && (
                  <div className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-background shadow-lg">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          setSelectedItem(item);
                          setNewItemId(item.id);
                          setShowSearch(false);
                          setItemSearch("");
                        }}
                      >
                        <span className="font-mono">{item.itemCode}</span>
                        <span className="text-xs text-muted-foreground">
                          Stock: {item.availableStock}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedItem && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSelectedItem(null);
                    setNewItemId("");
                    setItemSearch("");
                  }}
                >
                  Clear selection (apply to all items)
                </button>
              )}
            </div>

            {newAlertType === "LOW_STOCK" && (
              <div className="space-y-2">
                <Label>Custom Threshold</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Alert when stock drops below this"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                />
              </div>
            )}

            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              {newAlertType === "REORDER_POINT" && (
                <p>Uses each item&apos;s ROP value as the threshold. No custom threshold needed.</p>
              )}
              {newAlertType === "LOW_STOCK" && (
                <p>Set a custom threshold. Alerts fire when stock is above zero but below this number.</p>
              )}
              {newAlertType === "OUT_OF_STOCK" && (
                <p>Alerts when stock reaches exactly zero. No threshold needed.</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Rule
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
