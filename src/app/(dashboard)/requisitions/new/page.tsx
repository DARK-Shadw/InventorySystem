"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Loader2,
  ChevronLeft,
  Check,
  Save,
  X,
} from "lucide-react";
import { PageHead, Pill, SelectControl, NumberField } from "@/components/safeen/ui";

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
    if (lineItems.some((li) => li.itemId === item.id)) {
      setItemSearch("");
      setShowSearch(false);
      return;
    }
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

  function updateQty(index: number, value: number) {
    setLineItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantityRequired: Math.max(1, value) } : item
      )
    );
  }

  function truncate(str: string, len: number) {
    return str.length <= len ? str : str.substring(0, len) + "…";
  }

  async function handleSubmit(asDraft: boolean) {
    setError("");
    if (lineItems.length === 0) {
      setError("Add at least one item to the requisition");
      return;
    }
    if (lineItems.some((li) => li.quantityRequired <= 0)) {
      setError("Every quantity must be greater than 0");
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

  const totalQty = lineItems.reduce(
    (s, l) => s + (Number(l.quantityRequired) || 0),
    0
  );

  return (
    <div>
      <Link
        href="/requisitions"
        className="btn sm ghost mb-3"
        style={{ width: "fit-content" }}
      >
        <ChevronLeft />
        All requisitions
      </Link>

      <PageHead
        eyebrow="Material request"
        title="New requisition"
        sub="Build a requisition, add line items and submit for approval."
      />

      {error && (
        <div className="mb-4 rounded-[0.65rem] bg-bad-bg px-3 py-2.5 text-[0.82rem] text-bad">
          {error}
        </div>
      )}

      <div className="grid2">
        {/* left column */}
        <div className="flex flex-col gap-[1.1rem]">
          {/* header panel */}
          <div className="panel">
            <div className="panel-head">
              <h2>Header</h2>
            </div>
            <div className="panel-body">
              <div className="formgrid">
                <div className="field">
                  <label>Project</label>
                  <SelectControl
                    variant="inp"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    <option value="">— None —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </SelectControl>
                </div>
                <div className="field">
                  <label>Location / vessel</label>
                  <SelectControl
                    variant="inp"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                  >
                    <option value="">— None —</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.type})
                      </option>
                    ))}
                  </SelectControl>
                </div>
                <div className="field span2">
                  <label>Remarks</label>
                  <textarea
                    className="inp"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add context for the store team…"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* items panel */}
          <div className="panel overflow-visible">
            <div className="panel-head">
              <h2>Items</h2>
              <Pill tone="grey" className="ml-2">
                {lineItems.length}
              </Pill>
            </div>
            <div className="panel-body">
              <div className="ta mb-[0.6rem]">
                <label className="control" style={{ width: "100%" }}>
                  <Search aria-hidden style={{ color: "var(--color-faint)" }} />
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Search items to add (min 2 characters)…"
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      width: "100%",
                      fontSize: "0.88rem",
                    }}
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    onFocus={() =>
                      searchResults.length > 0 && setShowSearch(true)
                    }
                    onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                  />
                  {searching && (
                    <Loader2 className="size-4 animate-spin text-faint" />
                  )}
                </label>
                <div className={`ta-drop${showSearch ? " open" : ""}`}>
                  {searchResults.length === 0 ? (
                    <div
                      className="ta-opt"
                      style={{ cursor: "default", color: "var(--color-subtle)" }}
                    >
                      No matching items
                    </div>
                  ) : (
                    searchResults.map((item) => {
                      const added = lineItems.some(
                        (li) => li.itemId === item.id
                      );
                      return (
                        <div
                          key={item.id}
                          className="ta-opt"
                          style={added ? { opacity: 0.5 } : undefined}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if (!added) addItem(item);
                          }}
                        >
                          <div>
                            <div className="strong cellcode">
                              {item.itemCode}
                            </div>
                            <div className="sub">
                              {truncate(item.description, 64)}
                            </div>
                          </div>
                          <div className="meta">
                            <Pill
                              tone={item.availableStock === 0 ? "red" : "green"}
                            >
                              {item.availableStock} {item.issueUnit}
                            </Pill>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                {lineItems.length === 0 ? (
                  <div className="empty" style={{ padding: "2rem 1rem" }}>
                    <div className="ei">
                      <Plus />
                    </div>
                    <b>No items yet</b>
                    <span>Search above to add line items.</span>
                  </div>
                ) : (
                  lineItems.map((item, index) => (
                    <div key={item.itemId} className="lineitem">
                      <div>
                        <div className="strong cellcode">{item.itemCode}</div>
                        <div className="sub">
                          {truncate(item.description, 60)}
                        </div>
                      </div>
                      <NumberField
                        integer
                        min={1}
                        value={item.quantityRequired}
                        onValueChange={(n) => updateQty(index, n)}
                      />
                      <Pill
                        tone={item.availableStock === 0 ? "red" : "green"}
                        className="justify-self-center"
                      >
                        {item.availableStock} {item.unit}
                      </Pill>
                      <button
                        type="button"
                        className="rm"
                        title="Remove"
                        onClick={() => removeItem(index)}
                      >
                        <X />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* right column — summary */}
        <div className="sticky-side">
          <div className="panel">
            <div className="panel-head">
              <h2>Summary</h2>
            </div>
            <div className="panel-body">
              <div className="mb-2 flex justify-between text-[0.86rem] text-subtle">
                <span>Line items</span>
                <b className="text-ink">{lineItems.length}</b>
              </div>
              <div className="flex justify-between text-[0.86rem] text-subtle">
                <span>Total quantity</span>
                <b className="text-ink tnum">{totalQty.toLocaleString()}</b>
              </div>
              <div className="my-4 h-px bg-line-soft" />
              <button
                className="btn primary mb-[0.55rem] w-full"
                onClick={() => handleSubmit(false)}
                disabled={saving || lineItems.length === 0}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check />}
                Submit Requisition
              </button>
              <button
                className="btn w-full"
                onClick={() => handleSubmit(true)}
                disabled={saving || lineItems.length === 0}
              >
                <Save />
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
