"use client";

import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { FormDialog, NumberField, SelectControl } from "@/components/safeen/ui";

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
  stockBalance: number;
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
  stockBalance: 0,
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
  inventoryRecords?: { currentBalance: number }[];
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
        stockBalance: (editItem.inventoryRecords ?? []).reduce(
          (s, r) => s + (r.currentBalance || 0),
          0
        ),
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
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={isEdit ? "Edit item" : "Add item"}
      description="Create or update an inventory item record."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-[0.65rem] bg-bad-bg px-3 py-2.5 text-[0.82rem] text-bad">
              {error}
            </div>
          )}

          <div className="formgrid">
            <div className="field">
              <label>
                Item code <span className="req">*</span>
              </label>
              <input
                className="inp"
                value={form.itemCode}
                onChange={(e) => update("itemCode", e.target.value)}
                placeholder="SBS-00000"
              />
            </div>
            <div className="field">
              <label>Category</label>
              <input
                className="inp"
                value={form.classDescription}
                onChange={(e) => update("classDescription", e.target.value)}
                placeholder="CARTRIDGE, PRINTER"
              />
            </div>

            <div className="field span2">
              <label>
                Description <span className="req">*</span>
              </label>
              <input
                className="inp"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Full item description"
              />
            </div>

            <div className="field">
              <label>Manufacturer</label>
              <input
                className="inp"
                value={form.manufacturer}
                onChange={(e) => update("manufacturer", e.target.value)}
                placeholder="HEWLETT PACKARD"
              />
            </div>
            <div className="field">
              <label>Part number</label>
              <input
                className="inp"
                value={form.partNumber}
                onChange={(e) => update("partNumber", e.target.value)}
                placeholder="CF400A"
              />
            </div>

            <div className="field">
              <label>Order unit</label>
              <input
                className="inp"
                value={form.orderUnit}
                onChange={(e) => update("orderUnit", e.target.value)}
                placeholder="EA"
              />
            </div>
            <div className="field">
              <label>Issue unit</label>
              <input
                className="inp"
                value={form.issueUnit}
                onChange={(e) => update("issueUnit", e.target.value)}
                placeholder="EA"
              />
            </div>

            <div className="field">
              <label>Average cost (AED)</label>
              <NumberField
                min={0}
                step={0.01}
                value={form.averageCost}
                onValueChange={(n) => update("averageCost", n)}
              />
            </div>
            <div className="field">
              <label>Reorder point (ROP)</label>
              <NumberField
                integer
                min={0}
                value={form.reorderPoint}
                onValueChange={(n) => update("reorderPoint", n)}
              />
            </div>

            <div className="field">
              <label>EOQ</label>
              <NumberField
                integer
                min={0}
                value={form.economicOrderQty}
                onValueChange={(n) => update("economicOrderQty", n)}
              />
            </div>
            <div className="field">
              <label>Lead time (days)</label>
              <NumberField
                integer
                min={0}
                value={form.leadTimeDays}
                onValueChange={(n) => update("leadTimeDays", n)}
              />
            </div>

            {isEdit ? (
              <div className="field">
                <label>Stock balance</label>
                <NumberField
                  integer
                  min={0}
                  value={form.stockBalance}
                  onValueChange={(n) => update("stockBalance", n)}
                />
              </div>
            ) : (
              <div className="field">
                <label>Initial stock balance</label>
                <NumberField
                  integer
                  min={0}
                  value={form.initialBalance}
                  onValueChange={(n) => update("initialBalance", n)}
                />
              </div>
            )}
            <div className="field">
              <label>Bin location</label>
              <input
                className="inp"
                value={form.binLocation}
                onChange={(e) => update("binLocation", e.target.value)}
                placeholder="A-00-00"
              />
            </div>

            <div className="field">
              <label>Criticality</label>
              <SelectControl
                variant="inp"
                value={form.criticality}
                onChange={(e) => update("criticality", parseInt(e.target.value))}
              >
                <option value={1}>1 — Critical</option>
                <option value={2}>2 — Important</option>
                <option value={3}>3 — Standard</option>
              </SelectControl>
            </div>
            <div className="field">
              <label>Status</label>
              <SelectControl
                variant="inp"
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DISCONTINUED">Discontinued</option>
              </SelectControl>
            </div>

            <div className="field span2">
              <label className="checkrow">
                <input
                  type="checkbox"
                  checked={form.isConsumable}
                  onChange={(e) => update("isConsumable", e.target.checked)}
                />
                <span className="box">
                  <Check strokeWidth={3.2} />
                </span>
                Consumable item
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              className="btn"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Save item"}
            </button>
          </div>
        </form>
    </FormDialog>
  );
}
