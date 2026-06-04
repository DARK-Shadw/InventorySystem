"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Search,
  Loader2,
  ArrowLeft,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  itemCode: string;
  description: string;
  classDescription: string | null;
  issueUnit: string;
  availableStock: number;
}

interface LineItem {
  itemId: string;
  itemCode: string;
  description: string;
  unit: string;
  quantityRequired: number;
  availableStock: number;
  remarks: string;
}

interface Project {
  id: string;
  code: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  type: string;
}

export default function NewRequisitionPage() {
  const router = useRouter();
  const [projectId, setProjectId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [itemSearch, setItemSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/locations").then((r) => r.json()),
    ]).then(([p, l]) => {
      setProjects(p);
      setLocations(l);
    });
  }, []);

  useEffect(() => {
    if (itemSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const debounce = setTimeout(() => {
      fetch(`/api/items/search?q=${encodeURIComponent(itemSearch)}`)
        .then((r) => r.json())
        .then((data) => {
          setSearchResults(data);
          setShowSearch(true);
        })
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(debounce);
  }, [itemSearch]);

  function addItem(item: SearchResult) {
    if (lineItems.some((li) => li.itemId === item.id)) return;
    setLineItems((prev) => [
      ...prev,
      {
        itemId: item.id,
        itemCode: item.itemCode,
        description: item.description,
        unit: item.issueUnit,
        quantityRequired: 1,
        availableStock: item.availableStock,
        remarks: "",
      },
    ]);
    setItemSearch("");
    setShowSearch(false);
    setSearchResults([]);
  }

  function removeItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function truncate(str: string, len: number) {
    return str.length <= len ? str : str.substring(0, len) + "...";
  }

  async function handleSubmit(asDraft: boolean) {
    setError("");
    if (lineItems.length === 0) {
      setError("Add at least one item to the requisition");
      return;
    }

    const invalidItems = lineItems.filter((li) => li.quantityRequired <= 0);
    if (invalidItems.length > 0) {
      setError("All items must have a quantity greater than 0");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/requisitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId || null,
          locationId: locationId || null,
          remarks: remarks || null,
          items: lineItems.map((li) => ({
            itemId: li.itemId,
            quantityRequired: li.quantityRequired,
            unit: li.unit,
            remarks: li.remarks || undefined,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create requisition");
      }

      const requisition = await res.json();

      if (!asDraft) {
        await fetch(`/api/requisitions/${requisition.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "submit" }),
        });
      }

      router.push(`/requisitions/${requisition.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-md p-2 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            New Requisition
          </h1>
          <p className="text-sm text-muted-foreground">
            Request items from the main store
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Header Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requisition Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Project</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Select project (optional)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Location / Vessel</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                <option value="">Select location (optional)</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Search + Add */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items by code, description, part number..."
              className="pl-9"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}

            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
                {searchResults.map((item) => {
                  const alreadyAdded = lineItems.some(
                    (li) => li.itemId === item.id
                  );
                  return (
                    <button
                      key={item.id}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
                      onClick={() => addItem(item)}
                      disabled={alreadyAdded}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">
                            {item.itemCode}
                          </span>
                          {item.classDescription && (
                            <span className="text-xs text-muted-foreground">
                              {item.classDescription}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {truncate(item.description, 80)}
                        </p>
                      </div>
                      <div className="ml-3 text-right">
                        <p className="text-xs font-medium">
                          Stock: {item.availableStock}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.issueUnit}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Line Items */}
          {lineItems.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Package className="mb-2 h-8 w-8" />
              <p className="text-sm">Search and add items above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[1fr_80px_80px_80px_120px_40px] gap-2 px-2 text-xs font-semibold text-muted-foreground">
                <span>Item</span>
                <span className="text-center">Stock</span>
                <span className="text-center">Qty</span>
                <span>Unit</span>
                <span>Remarks</span>
                <span />
              </div>

              {lineItems.map((item, index) => (
                <div
                  key={item.itemId}
                  className="grid grid-cols-[1fr_80px_80px_80px_120px_40px] items-center gap-2 rounded-md border p-2"
                >
                  <div>
                    <span className="text-sm font-medium">{item.itemCode}</span>
                    <p className="text-xs text-muted-foreground">
                      {truncate(item.description, 60)}
                    </p>
                  </div>
                  <div className="text-center">
                    <Badge
                      variant="secondary"
                      className={
                        item.availableStock === 0
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }
                    >
                      {item.availableStock}
                    </Badge>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantityRequired}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "quantityRequired",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="h-8 text-center text-sm"
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.unit}
                  </span>
                  <Input
                    value={item.remarks}
                    onChange={(e) =>
                      updateItem(index, "remarks", e.target.value)
                    }
                    className="h-8 text-sm"
                    placeholder="Note..."
                  />
                  <button
                    onClick={() => removeItem(index)}
                    className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit(true)}
          disabled={saving || lineItems.length === 0}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit(false)}
          disabled={saving || lineItems.length === 0}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Requisition
        </Button>
      </div>
    </div>
  );
}
