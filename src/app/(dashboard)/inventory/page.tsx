"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ItemFormDialog } from "@/components/inventory/item-form-dialog";

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

  function getStockStatus(item: Item) {
    const balance =
      item.inventoryRecords.reduce((sum, r) => sum + r.currentBalance, 0);

    if (balance === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
    if (balance <= item.reorderPoint)
      return { label: "Low Stock", color: "bg-amber-100 text-amber-700" };
    return { label: "In Stock", color: "bg-green-100 text-green-700" };
  }

  function getTotalBalance(item: Item) {
    return item.inventoryRecords.reduce((sum, r) => sum + r.currentBalance, 0);
  }

  const criticalityLabel: Record<number, { text: string; color: string }> = {
    1: { text: "Critical", color: "bg-red-100 text-red-700" },
    2: { text: "Important", color: "bg-amber-100 text-amber-700" },
    3: { text: "Standard", color: "bg-gray-100 text-gray-700" },
  };

  function truncate(str: string, len: number) {
    if (str.length <= len) return str;
    return str.substring(0, len) + "...";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Manage items, stock levels, and reorder points
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by code, description, manufacturer, part number..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Package className="mb-3 h-10 w-10" />
              <p className="font-medium">No items found</p>
              <p className="text-sm">
                {search
                  ? "Try adjusting your search"
                  : "Add your first item or import from Excel"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Item Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Category</TableHead>
                    <TableHead className="w-[80px] text-center">
                      Stock
                    </TableHead>
                    <TableHead className="w-[80px] text-center">ROP</TableHead>
                    <TableHead className="w-[80px]">Unit</TableHead>
                    <TableHead className="w-[90px] text-right">Cost</TableHead>
                    <TableHead className="w-[100px] text-center">
                      Status
                    </TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const stock = getStockStatus(item);
                    const balance = getTotalBalance(item);
                    const crit = criticalityLabel[item.criticality] || criticalityLabel[3];

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {item.itemCode}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="text-sm" title={item.description}>
                              {truncate(item.description, 80)}
                            </p>
                            {item.manufacturer && (
                              <p className="text-xs text-muted-foreground">
                                {item.manufacturer}
                                {item.partNumber && ` — ${item.partNumber}`}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.classDescription && (
                            <span className="text-xs text-muted-foreground">
                              {item.classDescription}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-bold">{balance}</span>
                            {balance <= item.reorderPoint &&
                              item.reorderPoint > 0 && (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {item.reorderPoint}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.issueUnit}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {Number(item.averageCost) > 0
                            ? `$${Number(item.averageCost).toFixed(2)}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={stock.color}
                          >
                            {stock.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteDialog(item)}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} items
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchItems(pagination.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchItems(pagination.page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <ItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        onSuccess={() => fetchItems(pagination.page)}
      />

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteDialog}
        onOpenChange={() => setDeleteDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {deleteDialog?.itemCode}
            </span>
            ? If this item has transaction history, it will be deactivated
            instead of deleted.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
