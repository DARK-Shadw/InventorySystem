"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, Check } from "lucide-react";
import { PageHead, Pill, FormDialog } from "@/components/safeen/ui";

interface Department {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isStore: boolean;
  _count?: { users: number; requisitions: number };
}

interface FormData {
  code: string;
  name: string;
  description: string;
  isStore: boolean;
}

const defaultForm: FormData = {
  code: "",
  name: "",
  description: "",
  isStore: false,
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Department | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/departments");
      setDepartments(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  function openAdd() {
    setEditItem(null);
    setForm(defaultForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(dept: Department) {
    setEditItem(dept);
    setForm({
      code: dept.code,
      name: dept.name,
      description: dept.description || "",
      isStore: dept.isStore,
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.code || !form.name) {
      setFormError("Code and name are required");
      return;
    }

    setSaving(true);
    try {
      const url = editItem
        ? `/api/departments/${editItem.id}`
        : "/api/departments";
      const method = editItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save department");
      }

      setFormOpen(false);
      fetchDepartments();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(dept: Department) {
    if (
      !confirm(`Delete department "${dept.name}" (${dept.code})? This cannot be undone.`)
    )
      return;

    const res = await fetch(`/api/departments/${dept.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to delete department");
      return;
    }
    fetchDepartments();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHead
        eyebrow="Organisation"
        title="Departments"
        sub="Requesting departments and the central store."
      >
        <button onClick={openAdd} className="btn primary">
          <Plus />
          Add Department
        </button>
      </PageHead>

      <div className="tablewrap flex min-h-0 flex-1 flex-col">
        <div className="safeen-scroll min-h-0 flex-1 overflow-y-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Description</th>
                <th className="num">Users</th>
                <th className="num">Requisitions</th>
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
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <b>No departments found</b>
                      <span>Create your first department to get started.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr
                    key={dept.id}
                    className="clickable"
                    onClick={() => openEdit(dept)}
                  >
                    <td className="cellcode strong">{dept.code}</td>
                    <td>
                      <span className="strong">{dept.name}</span>
                      {dept.isStore && (
                        <Pill tone="accent" className="ml-1.5">
                          Store
                        </Pill>
                      )}
                    </td>
                    <td>{dept.description || "—"}</td>
                    <td className="num tnum">{dept._count?.users ?? 0}</td>
                    <td className="num tnum">
                      {dept._count?.requisitions ?? 0}
                    </td>
                    <td>
                      <span className="rowact">
                        <button
                          className="btn sm ghost icon"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(dept);
                          }}
                        >
                          <Pencil />
                        </button>
                        <button
                          className="btn sm ghost icon"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(dept);
                          }}
                        >
                          <Trash2 />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editItem ? "Edit department" : "Add department"}
        description="Requesting departments and the central store."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="rounded-[0.65rem] bg-bad-bg px-3 py-2.5 text-[0.82rem] text-bad">
              {formError}
            </div>
          )}

          <div className="formgrid">
            <div className="field">
              <label>
                Code <span className="req">*</span>
              </label>
              <input
                className="inp uppercase"
                value={form.code}
                onChange={(e) =>
                  setForm((p) => ({ ...p, code: e.target.value }))
                }
                placeholder="SUR"
              />
            </div>
            <div className="field">
              <label>
                Name <span className="req">*</span>
              </label>
              <input
                className="inp"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Survey Department"
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
            <div className="field span2">
              <label className="checkrow">
                <input
                  type="checkbox"
                  checked={form.isStore}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isStore: e.target.checked }))
                  }
                />
                <span className="box">
                  <Check strokeWidth={3.2} />
                </span>
                This department is the central store
              </label>
            </div>
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
              {editItem ? "Save changes" : "Create department"}
            </button>
          </div>
        </form>
      </FormDialog>
    </div>
  );
}
