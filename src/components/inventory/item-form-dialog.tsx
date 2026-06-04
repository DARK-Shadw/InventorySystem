"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ItemFormData {
  itemCode: string;
  description: string;
  classDescription: string;
  manufacturer: string;
  partNumber: string;
  orderUnit: string;
  issueUnit: string;
  reorderPoint: number;
  economicOrderQty: number;
  leadTimeDays: number;
  averageCost: number;
  criticality: number;
  isConsumable: boolean;
  binLocation: string;
  status: string;
  initialBalance: number;
}

const defaultFormData: ItemFormData = {
  itemCode: "",
  description: "",
  classDescription: "",
  manufacturer: "",
  partNumber: "",
  orderUnit: "Each",
  issueUnit: "Each",
  reorderPoint: 0,
  economicOrderQty: 0,
  leadTimeDays: 0,
  averageCost: 0,
  criticality: 3,
  isConsumable: true,
  binLocation: "",
  status: "ACTIVE",
  initialBalance: 0,
};

interface EditableItem {
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
  averageCost: string | number;
  criticality: number;
  isConsumable: boolean;
  binLocation: string | null;
  status: string;
}

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: EditableItem | null;
  onSuccess: () => void;
}

export function ItemFormDialog({
  open,
  onOpenChange,
  editItem,
  onSuccess,
}: ItemFormDialogProps) {
  const [form, setForm] = useState<ItemFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!editItem;

  useEffect(() => {
    if (editItem) {
      setForm({
        itemCode: editItem.itemCode || "",
        description: editItem.description || "",
        classDescription: editItem.classDescription || "",
        manufacturer: editItem.manufacturer || "",
        partNumber: editItem.partNumber || "",
        orderUnit: editItem.orderUnit || "Each",
        issueUnit: editItem.issueUnit || "Each",
        reorderPoint: editItem.reorderPoint || 0,
        economicOrderQty: editItem.economicOrderQty || 0,
        leadTimeDays: editItem.leadTimeDays || 0,
        averageCost: Number(editItem.averageCost) || 0,
        criticality: editItem.criticality || 3,
        isConsumable: editItem.isConsumable ?? true,
        binLocation: editItem.binLocation || "",
        status: editItem.status || "ACTIVE",
        initialBalance: 0,
      });
    } else {
      setForm(defaultFormData);
    }
    setError("");
  }, [editItem, open]);

  function update(field: keyof ItemFormData, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.itemCode.trim() || !form.description.trim()) {
      setError("Item code and description are required");
      return;
    }

    setSaving(true);
    try {
      const url = isEdit ? `/api/items/${editItem!.id}` : "/api/items";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save item");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemCode">Item Code *</Label>
                <Input
                  id="itemCode"
                  value={form.itemCode}
                  onChange={(e) => update("itemCode", e.target.value)}
                  placeholder="SS10000001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="classDescription">Class / Category</Label>
                <Input
                  id="classDescription"
                  value={form.classDescription}
                  onChange={(e) => update("classDescription", e.target.value)}
                  placeholder="CARTRIDGE,PRINTER"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Full item description..."
              />
            </div>
          </div>

          {/* Manufacturer */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Manufacturer & Part
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={form.manufacturer}
                  onChange={(e) => update("manufacturer", e.target.value)}
                  placeholder="HEWLETT PACKARD"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partNumber">Part Number</Label>
                <Input
                  id="partNumber"
                  value={form.partNumber}
                  onChange={(e) => update("partNumber", e.target.value)}
                  placeholder="CF400A"
                />
              </div>
            </div>
          </div>

          {/* Units & Quantities */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Units & Stock
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderUnit">Order Unit</Label>
                <Input
                  id="orderUnit"
                  value={form.orderUnit}
                  onChange={(e) => update("orderUnit", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issueUnit">Issue Unit</Label>
                <Input
                  id="issueUnit"
                  value={form.issueUnit}
                  onChange={(e) => update("issueUnit", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="averageCost">Avg. Cost</Label>
                <Input
                  id="averageCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.averageCost}
                  onChange={(e) =>
                    update("averageCost", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reorderPoint">Reorder Point (ROP)</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  min="0"
                  value={form.reorderPoint}
                  onChange={(e) =>
                    update("reorderPoint", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="economicOrderQty">Order Qty (EOQ)</Label>
                <Input
                  id="economicOrderQty"
                  type="number"
                  min="0"
                  value={form.economicOrderQty}
                  onChange={(e) =>
                    update("economicOrderQty", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadTimeDays">Lead Time (days)</Label>
                <Input
                  id="leadTimeDays"
                  type="number"
                  min="0"
                  value={form.leadTimeDays}
                  onChange={(e) =>
                    update("leadTimeDays", parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
            {!isEdit && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initialBalance">Initial Stock Balance</Label>
                  <Input
                    id="initialBalance"
                    type="number"
                    min="0"
                    value={form.initialBalance}
                    onChange={(e) =>
                      update("initialBalance", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Classification */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Classification
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="criticality">Criticality</Label>
                <select
                  id="criticality"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.criticality}
                  onChange={(e) =>
                    update("criticality", parseInt(e.target.value))
                  }
                >
                  <option value={1}>1 — Critical</option>
                  <option value={2}>2 — Important</option>
                  <option value={3}>3 — Standard</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="DISCONTINUED">Discontinued</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="binLocation">Bin Location</Label>
                <Input
                  id="binLocation"
                  value={form.binLocation}
                  onChange={(e) => update("binLocation", e.target.value)}
                  placeholder="A-01-03"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isConsumable}
                  onChange={(e) => update("isConsumable", e.target.checked)}
                  className="rounded border-gray-300"
                />
                Consumable
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
