"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, Check } from "lucide-react";
import { PageHead, Pill, FormDialog, SelectControl } from "@/components/safeen/ui";

interface Location {
  id: string;
  name: string;
  type: string;
  region: string | null;
  description: string | null;
  isActive: boolean;
  _count?: { requisitions: number };
}

interface FormData {
  name: string;
  type: string;
  region: string;
  description: string;
  isActive: boolean;
}

const defaultForm: FormData = {
  name: "",
  type: "VESSEL",
  region: "",
  description: "",
  isActive: true,
};

type Tone = "green" | "amber" | "red" | "blue" | "violet" | "grey" | "accent";

const typeLabels: Record<string, { label: string; tone: Tone }> = {
  VESSEL: { label: "Vessel", tone: "blue" },
  BARGE: { label: "Barge", tone: "violet" },
  SITE: { label: "Site", tone: "amber" },
  WAREHOUSE: { label: "Warehouse", tone: "green" },
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Location | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/locations?all=true");
      setLocations(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  function openAdd() {
    setEditItem(null);
    setForm(defaultForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(loc: Location) {
    setEditItem(loc);
    setForm({
      name: loc.name,
      type: loc.type,
      region: loc.region || "",
      description: loc.description || "",
      isActive: loc.isActive,
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.name || !form.type) {
      setFormError("Name and type are required");
      return;
    }

    setSaving(true);
    try {
      const url = editItem ? `/api/locations/${editItem.id}` : "/api/locations";
      const method = editItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save location");
      }

      setFormOpen(false);
      fetchLocations();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(loc: Location) {
    if (!confirm(`Delete location "${loc.name}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/locations/${loc.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to delete location");
      return;
    }
    fetchLocations();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHead
        eyebrow="Delivery destinations"
        title="Locations"
        sub="Vessels, barges, sites and warehouses requisitions ship to."
      >
        <button onClick={openAdd} className="btn primary">
          <Plus />
          Add Location
        </button>
      </PageHead>

      <div className="tablewrap flex min-h-0 flex-1 flex-col">
        <div className="safeen-scroll min-h-0 flex-1 overflow-y-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Region</th>
                <th className="num">Requisitions</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="size-6 animate-spin text-faint" />
                    </div>
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <b>No locations found</b>
                      <span>Create your first location to get started.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                locations.map((loc) => {
                  const type = typeLabels[loc.type] || typeLabels.VESSEL;
                  return (
                    <tr
                      key={loc.id}
                      className="clickable"
                      onClick={() => openEdit(loc)}
                    >
                      <td>
                        <span className="strong">{loc.name}</span>
                      </td>
                      <td>
                        <Pill tone={type.tone}>{type.label}</Pill>
                      </td>
                      <td>{loc.region || "—"}</td>
                      <td className="num tnum">
                        {loc._count?.requisitions ?? 0}
                      </td>
                      <td>
                        <Pill tone={loc.isActive ? "green" : "grey"} dot>
                          {loc.isActive ? "Active" : "Inactive"}
                        </Pill>
                      </td>
                      <td>
                        <span className="rowact">
                          <button
                            className="btn sm ghost icon"
                            title="Edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(loc);
                            }}
                          >
                            <Pencil />
                          </button>
                          <button
                            className="btn sm ghost icon"
                            title="Delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(loc);
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

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editItem ? "Edit location" : "Add location"}
        description="Vessels, barges, sites and warehouses requisitions ship to."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="rounded-[0.65rem] bg-bad-bg px-3 py-2.5 text-[0.82rem] text-bad">
              {formError}
            </div>
          )}

          <div className="formgrid">
            <div className="field span2">
              <label>
                Name <span className="req">*</span>
              </label>
              <input
                className="inp"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="ASTRO ARCHERNER"
              />
            </div>
            <div className="field">
              <label>
                Type <span className="req">*</span>
              </label>
              <SelectControl
                variant="inp"
                value={form.type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, type: e.target.value }))
                }
              >
                <option value="VESSEL">Vessel</option>
                <option value="BARGE">Barge</option>
                <option value="SITE">Site</option>
                <option value="WAREHOUSE">Warehouse</option>
              </SelectControl>
            </div>
            <div className="field">
              <label>Region</label>
              <input
                className="inp"
                value={form.region}
                onChange={(e) =>
                  setForm((p) => ({ ...p, region: e.target.value }))
                }
                placeholder="UAE"
              />
            </div>
            <div className="field span2">
              <label>Description</label>
              <input
                className="inp"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Optional description"
              />
            </div>
            {editItem && (
              <div className="field span2">
                <label className="checkrow">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, isActive: e.target.checked }))
                    }
                  />
                  <span className="box">
                    <Check strokeWidth={3.2} />
                  </span>
                  Active (available for new requisitions)
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              className="btn"
              onClick={() => setFormOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editItem ? "Save changes" : "Create location"}
            </button>
          </div>
        </form>
      </FormDialog>
    </div>
  );
}
