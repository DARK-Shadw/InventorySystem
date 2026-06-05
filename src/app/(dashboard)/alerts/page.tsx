"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, RefreshCw, Search } from "lucide-react";
import { PageHead, Pill, FormDialog, SelectControl } from "@/components/safeen/ui";

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

type Tone = "green" | "amber" | "red" | "blue" | "violet" | "grey";

const alertTypeLabels: Record<string, { label: string; tone: Tone }> = {
  LOW_STOCK: { label: "Low Stock", tone: "blue" },
  OUT_OF_STOCK: { label: "Out of Stock", tone: "red" },
  REORDER_POINT: { label: "Reorder Point", tone: "amber" },
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
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-faint" />
      </div>
    );
  }

  return (
    <div>
      <PageHead
        eyebrow="Stock monitoring"
        title="Alerts"
        sub="Configure alert rules and review stock notifications."
      >
        <button
          className="btn"
          onClick={handleCheckAlerts}
          disabled={checking}
        >
          {checking ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw />}
          Check Now
        </button>
        <button className="btn primary" onClick={() => setAddOpen(true)}>
          <Plus />
          Add Rule
        </button>
      </PageHead>

      <div className="alerts-grid">
        {/* Alert Rules */}
        <div className="panel">
          <div className="panel-head">
            <h2>Alert rules</h2>
            <Pill tone="grey" className="ml-2">
              {rules.length}
            </Pill>
          </div>
          {rules.length === 0 ? (
            <div className="empty" style={{ padding: "2.5rem 1rem" }}>
              <b>No rules</b>
              <span>Add a rule to start monitoring stock.</span>
            </div>
          ) : (
            <div>
              {rules.map((rule) => {
                const type =
                  alertTypeLabels[rule.alertType] || alertTypeLabels.LOW_STOCK;
                return (
                  <div key={rule.id} className="rule">
                    <Pill tone={type.tone}>{type.label}</Pill>
                    <div>
                      <div className="text-[0.86rem] font-medium">
                        {rule.item
                          ? `${rule.item.itemCode} — ${rule.item.description.length > 44 ? rule.item.description.substring(0, 44) + "…" : rule.item.description}`
                          : "All items"}
                      </div>
                      <div className="text-[0.78rem] text-subtle">
                        {rule.threshold != null
                          ? `Threshold: ${rule.threshold}`
                          : "Uses item reorder point"}
                      </div>
                    </div>
                    <button
                      className="rm"
                      title="Delete rule"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="panel">
          <div className="panel-head">
            <h2>Notifications</h2>
            <Pill tone="accent" className="ml-2">
              {unreadCount}
            </Pill>
            <span className="grow" />
            {unreadCount > 0 && (
              <button className="btn sm ghost" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="empty" style={{ padding: "2.5rem 1rem" }}>
              <b>No notifications</b>
              <span>Click “Check Now” to scan for alerts.</span>
            </div>
          ) : (
            <div className="max-h-[34rem] overflow-y-auto safeen-scroll">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`ntf ${notif.isRead ? "read" : "unread"}`}
                  onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                >
                  <span className="ndot" />
                  <div className="nb">
                    <b>{notif.title}</b>
                    <p>{notif.message}</p>
                  </div>
                  <span className="nt">
                    {new Date(notif.createdAt).toLocaleString("en-US", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Rule Dialog */}
      <FormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        size="md"
        title="Add alert rule"
        description="Generate notifications when stock crosses a threshold."
      >
        <form onSubmit={handleAddRule} className="space-y-5">
          {formError && (
            <div className="rounded-[0.65rem] bg-bad-bg px-3 py-2.5 text-[0.82rem] text-bad">
              {formError}
            </div>
          )}

          <div className="formgrid">
            <div className="field span2">
              <label>Alert type</label>
              <SelectControl
                variant="inp"
                value={newAlertType}
                onChange={(e) => setNewAlertType(e.target.value)}
              >
                <option value="REORDER_POINT">
                  Reorder Point — uses each item&apos;s ROP
                </option>
                <option value="LOW_STOCK">
                  Low Stock — below a custom threshold
                </option>
                <option value="OUT_OF_STOCK">
                  Out of Stock — exactly zero
                </option>
              </SelectControl>
            </div>

            <div className="field span2">
              <label>
                Item <span className="hint">(leave empty for all items)</span>
              </label>
              <div className="ta">
                <label className="control" style={{ width: "100%" }}>
                  <Search
                    aria-hidden
                    style={{ color: "var(--color-faint)" }}
                  />
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Search item…"
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      width: "100%",
                      fontSize: "0.88rem",
                    }}
                    value={
                      selectedItem
                        ? `${selectedItem.itemCode} — ${selectedItem.description.substring(0, 40)}`
                        : itemSearch
                    }
                    onChange={(e) => {
                      setItemSearch(e.target.value);
                      setSelectedItem(null);
                      setNewItemId("");
                    }}
                    onFocus={() =>
                      searchResults.length > 0 && setShowSearch(true)
                    }
                    onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                  />
                  {searching && (
                    <Loader2 className="size-4 animate-spin text-faint" />
                  )}
                </label>
                <div
                  className={`ta-drop${showSearch && searchResults.length > 0 ? " open" : ""}`}
                >
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="ta-opt"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedItem(item);
                        setNewItemId(item.id);
                        setShowSearch(false);
                        setItemSearch("");
                      }}
                    >
                      <div>
                        <div className="strong cellcode">{item.itemCode}</div>
                        <div className="sub">
                          {item.description.substring(0, 48)}
                        </div>
                      </div>
                      <div className="meta">
                        <Pill tone={item.availableStock === 0 ? "red" : "green"}>
                          {item.availableStock} {item.issueUnit}
                        </Pill>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {selectedItem && (
                <button
                  type="button"
                  className="mt-1 self-start text-[0.78rem] text-subtle transition hover:text-ink"
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
              <div className="field span2">
                <label>Threshold</label>
                <input
                  className="inp"
                  type="number"
                  min="1"
                  placeholder="Alert when stock drops below this"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                />
              </div>
            )}

            <div className="field span2">
              <div className="rounded-[0.6rem] border border-line-soft bg-field p-3 text-[0.78rem] leading-relaxed text-subtle">
                {newAlertType === "REORDER_POINT" &&
                  "Uses each item's ROP value as the threshold. No custom threshold needed."}
                {newAlertType === "LOW_STOCK" &&
                  "Alerts fire when stock is above zero but below this number."}
                {newAlertType === "OUT_OF_STOCK" &&
                  "Alerts when stock reaches exactly zero. No threshold needed."}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              className="btn"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Add rule
            </button>
          </div>
        </form>
      </FormDialog>
    </div>
  );
}
