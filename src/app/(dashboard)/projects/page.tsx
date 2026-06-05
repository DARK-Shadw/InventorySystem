"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, Check } from "lucide-react";
import { PageHead, Pill, FormDialog } from "@/components/safeen/ui";

interface Project {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count?: { requisitions: number };
}

interface FormData {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

const defaultForm: FormData = {
  code: "",
  name: "",
  description: "",
  isActive: true,
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Project | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects?all=true");
      setProjects(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  function openAdd() {
    setEditItem(null);
    setForm(defaultForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(proj: Project) {
    setEditItem(proj);
    setForm({
      code: proj.code,
      name: proj.name,
      description: proj.description || "",
      isActive: proj.isActive,
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
      const url = editItem ? `/api/projects/${editItem.id}` : "/api/projects";
      const method = editItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save project");
      }

      setFormOpen(false);
      fetchProjects();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(proj: Project) {
    if (
      !confirm(`Delete project "${proj.name}" (${proj.code})? This cannot be undone.`)
    )
      return;

    const res = await fetch(`/api/projects/${proj.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to delete project");
      return;
    }
    fetchProjects();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHead
        eyebrow="Cost allocation"
        title="Projects"
        sub="Projects that requisitions can be charged against."
      >
        <button onClick={openAdd} className="btn primary">
          <Plus />
          Add Project
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
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      <b>No projects found</b>
                      <span>Create your first project to get started.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((proj) => (
                  <tr
                    key={proj.id}
                    className="clickable"
                    onClick={() => openEdit(proj)}
                  >
                    <td className="cellcode strong">{proj.code}</td>
                    <td>
                      <span className="strong">{proj.name}</span>
                    </td>
                    <td>{proj.description || "—"}</td>
                    <td className="num tnum">
                      {proj._count?.requisitions ?? 0}
                    </td>
                    <td>
                      <Pill tone={proj.isActive ? "green" : "grey"} dot>
                        {proj.isActive ? "Active" : "Inactive"}
                      </Pill>
                    </td>
                    <td>
                      <span className="rowact">
                        <button
                          className="btn sm ghost icon"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(proj);
                          }}
                        >
                          <Pencil />
                        </button>
                        <button
                          className="btn sm ghost icon"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(proj);
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
        title={editItem ? "Edit project" : "Add project"}
        description="Projects that requisitions can be charged against."
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
                className="inp"
                value={form.code}
                onChange={(e) =>
                  setForm((p) => ({ ...p, code: e.target.value }))
                }
                placeholder="2035"
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
                placeholder="Offshore Survey 2026"
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
              {editItem ? "Save changes" : "Create project"}
            </button>
          </div>
        </form>
      </FormDialog>
    </div>
  );
}
