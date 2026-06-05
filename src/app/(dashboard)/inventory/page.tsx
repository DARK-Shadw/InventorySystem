"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TriangleAlert,
  Loader2,
} from "lucide-react";
import { ItemFormDialog } from "@/components/inventory/item-form-dialog";
import { PageHead, SearchControl, Pill, FormDialog } from "@/components/safeen/ui";
import { numberFmt } from "@/lib/ui";

interface InventoryRecord {
  id: string;
  currentBalance: number;
  availableBalance: number;
  storeroom: { code: string; name: string };
}

interface Item {
  id: string;
  itemCode: string;
  description: string;
  classDescription: string | null;
  manufacturer: string | null;
  partNumber: string | null;
  orderUnit: string;
  issueUnit: string;
  reorderPoint: number;
  economicOrderQty: number;
  leadTimeDays: number;
  averageCost: string;
  criticality: number;
  isConsumable: boolean;
  status: string;
  binLocation: string | null;
  inventoryRecords: InventoryRecord[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Seed search from a global-search `?q=` (header search lands here).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, []);

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(
    async (page = 1) => {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      try {
        const res = await fetch(`/api/items?${params}`);
        const data = await res.json();
        setItems(data.items);
        setPagination(data.pagination);
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    const debounce = setTimeout(() => fetchItems(1), 300);
    return () => clearTimeout(debounce);
  }, [fetchItems]);

  function handleEdit(item: Item) {
    setEditItem(item);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditItem(null);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      await fetch(`/api/items/${deleteDialog.id}`, { method: "DELETE" });
      setDeleteDialog(null);
      fetchItems(pagination.page);
    } finally {
      setDeleting(false);
    }
  }

  function getTotalBalance(item: Item) {
    return item.inventoryRecords.reduce((sum, r) => sum + r.currentBalance, 0);
  }

  /** out | low | in — drives the balance-cell color + warning icon. */
  function stockKey(item: Item): "out" | "low" | "in" {
    const balance = getTotalBalance(item);
    if (balance <= 0) return "out";
    if (item.reorderPoint > 0 && balance <= item.reorderPoint) return "low";
    return "in";
  }

  const STATUS_TONE: Record<string, "green" | "grey" | "red"> = {
    ACTIVE: "green",
    INACTIVE: "grey",
    DISCONTINUED: "red",
  };

  const STATUS_SEG: [string, string][] = [
    ["", "All"],
    ["ACTIVE", "Active"],
    ["INACTIVE", "Inactive"],
    ["DISCONTINUED", "Discontinued"],
  ];

  function truncate(str: string, len: number) {
    if (str.length <= len) return str;
    return str.substring(0, len) + "…";
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHead
        eyebrow="Item master catalog"
        title="Inventory"
        sub="Browse, search and manage every stocked item across storerooms."
      >
        <button onClick={handleAdd} className="btn primary">
          <Plus />
          Add Item
        </button>
      </PageHead>

      <div className="filters shrink-0">
        <SearchControl
          placeholder="Search code, description, manufacturer, part no.…"
          style={{ flex: 1, maxWidth: "24rem" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="seg">
          {STATUS_SEG.map(([v, l]) => (
            <button
              key={v || "all"}
              className={statusFilter === v ? "on" : ""}
              onClick={() => setStatusFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="tablewrap flex min-h-0 flex-1 flex-col">
        <div className="safeen-scroll min-h-0 flex-1 overflow-y-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th className="num">Balance</th>
                <th className="num">ROP</th>
                <th>Unit</th>
                <th className="num">Avg cost</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="size-6 animate-spin text-faint" />
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">
                      <b>No items found</b>
                      <span>
                        {search
                          ? "Try adjusting your search or filters."
                          : "Add your first item or import from Excel."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const balance = getTotalBalance(item);
                  const sk = stockKey(item);
                  return (
                    <tr
                      key={item.id}
                      className="clickable"
                      onClick={() => handleEdit(item)}
                    >
                      <td>
                        <div className="strong cellcode">{item.itemCode}</div>
                        <div className="sub" title={item.description}>
                          {truncate(item.description, 72)}
                        </div>
                      </td>
                      <td>{item.classDescription || "—"}</td>
                      <td className="num">
                        <span
                          className={`strong tnum${sk === "out" ? " text-bad" : ""}`}
                        >
                          {numberFmt.format(balance)}
                        </span>
                        {sk !== "in" && (
                          <TriangleAlert
                            className={`ml-1.5 inline size-[0.9rem] align-[-2px] ${
                              sk === "out" ? "text-bad" : "text-warn"
                            }`}
                          />
                        )}
                      </td>
                      <td className="num tnum">{item.reorderPoint}</td>
                      <td>{item.issueUnit}</td>
                      <td className="num tnum">
                        {Number(item.averageCost) > 0
                          ? Number(item.averageCost).toFixed(2)
                          : "—"}
                      </td>
                      <td>
                        <Pill tone={STATUS_TONE[item.status] ?? "grey"} dot>
                          {item.status.charAt(0) +
                            item.status.slice(1).toLowerCase()}
                        </Pill>
                      </td>
                      <td>
                        <span className="rowact">
                          <button
                            className="btn sm ghost icon"
                            title="Edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                          >
                            <Pencil />
                          </button>
                          <button
                            className="btn sm ghost icon"
                            title="Delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialog(item);
                            }}
                          >
                            <Trash2 />
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && items.length > 0 && (
        <div className="pagination shrink-0">
          <span className="info">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} items
          </span>
          <div className="pgbtns">
            <button
              className="btn sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchItems(pagination.page - 1)}
            >
              <ChevronLeft />
              Prev
            </button>
            <button
              className="btn sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchItems(pagination.page + 1)}
            >
              Next
              <ChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <ItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        onSuccess={() => fetchItems(pagination.page)}
      />

      {/* Delete Confirmation */}
      <FormDialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
        size="md"
        title="Delete item"
        description="This action removes the item from the catalog."
      >
        <p className="text-[0.9rem] leading-relaxed text-subtle">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-ink">
            {deleteDialog?.itemCode}
          </span>
          ? If this item has transaction history, it will be deactivated instead
          of deleted.
        </p>
        <div className="flex justify-end gap-3 pt-1">
          <button className="btn" onClick={() => setDeleteDialog(null)}>
            Cancel
          </button>
          <button
            className="btn danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting && <Loader2 className="size-4 animate-spin" />}
            Delete
          </button>
        </div>
      </FormDialog>
    </div>
  );
}
