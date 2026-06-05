"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Loader2, ShieldCheck } from "lucide-react";
import {
  PageHead,
  SearchControl,
  SelectControl,
  Pill,
  Avatar,
  FormDialog,
} from "@/components/safeen/ui";

interface Department {
  id: string;
  code: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  badgeNumber: string | null;
  role: string;
  status: string;
  department: { code: string; name: string } | null;
  departmentId: string | null;
  createdAt: string;
}

type Tone = "green" | "amber" | "red" | "blue" | "violet" | "grey" | "accent";

const roleLabels: Record<string, { label: string; tone: Tone }> = {
  SUPER_ADMIN: { label: "Super Admin", tone: "accent" },
  STORE_MANAGER: { label: "Store Manager", tone: "blue" },
  STORE_STAFF: { label: "Store Staff", tone: "violet" },
  DEPT_HEAD: { label: "Dept Head", tone: "amber" },
  REQUESTER: { label: "Requester", tone: "grey" },
};

const statusLabels: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Active", tone: "green" },
  INACTIVE: { label: "Inactive", tone: "grey" },
  SUSPENDED: { label: "Suspended", tone: "red" },
};

interface UserFormData {
  name: string;
  email: string;
  password: string;
  badgeNumber: string;
  role: string;
  departmentId: string;
  status: string;
}

const defaultForm: UserFormData = {
  name: "",
  email: "",
  password: "",
  badgeNumber: "",
  role: "REQUESTER",
  departmentId: "",
  status: "ACTIVE",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      ...(search && { search }),
      ...(roleFilter && { role: roleFilter }),
    });
    try {
      const res = await fetch(`/api/users?${params}`);
      setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then(setDepartments);
  }, []);

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  function openAdd() {
    setEditUser(null);
    setForm(defaultForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(user: User) {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      badgeNumber: user.badgeNumber || "",
      role: user.role,
      departmentId: user.departmentId || "",
      status: user.status,
    });
    setFormError("");
    setFormOpen(true);
  }

  function update(field: keyof UserFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.name || !form.email || !form.role || !form.departmentId) {
      setFormError("Name, email, role, and department are required");
      return;
    }
    if (!editUser && !form.password) {
      setFormError("Password is required for new users");
      return;
    }

    setSaving(true);
    try {
      const url = editUser ? `/api/users/${editUser.id}` : "/api/users";
      const method = editUser ? "PATCH" : "POST";

      const payload: Record<string, string> = {
        name: form.name,
        email: form.email,
        role: form.role,
        departmentId: form.departmentId,
        badgeNumber: form.badgeNumber,
        status: form.status,
      };
      if (form.password) payload.password = form.password;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save user");
      }

      setFormOpen(false);
      fetchUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHead
        eyebrow="Access management"
        title="Users"
        sub="Manage accounts, roles and access across the SAFEEN workspace."
      >
        <button onClick={openAdd} className="btn primary">
          <Plus />
          Add User
        </button>
      </PageHead>

      <div className="filters shrink-0">
        <SearchControl
          placeholder="Search name, email or badge…"
          style={{ flex: 1, maxWidth: "24rem" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <SelectControl
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          {Object.entries(roleLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </SelectControl>
      </div>

      <div className="tablewrap flex min-h-0 flex-1 flex-col">
        <div className="safeen-scroll min-h-0 flex-1 overflow-y-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Badge</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="size-6 animate-spin text-faint" />
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">
                      <b>No users found</b>
                      <span>Adjust your search or filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const role = roleLabels[user.role] || roleLabels.REQUESTER;
                  const status =
                    statusLabels[user.status] || statusLabels.ACTIVE;
                  return (
                    <tr
                      key={user.id}
                      className="clickable"
                      onClick={() => openEdit(user)}
                    >
                      <td>
                        <div className="who-cell">
                          <Avatar name={user.name} />
                          <span className="strong">{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td className="cellcode">{user.badgeNumber || "—"}</td>
                      <td>{user.department?.name || "—"}</td>
                      <td>
                        <Pill tone={role.tone}>{role.label}</Pill>
                      </td>
                      <td>
                        <Pill tone={status.tone} dot>
                          {status.label}
                        </Pill>
                      </td>
                      <td>
                        <span className="rowact">
                          <button
                            className="btn sm ghost icon"
                            title="Edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(user);
                            }}
                          >
                            <Pencil />
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

      {/* Add/Edit User Dialog */}
      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editUser ? "Edit user" : "Add user"}
        description="Create or update a user account."
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
                Full name <span className="req">*</span>
              </label>
              <input
                className="inp"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div className="field">
              <label>Email <span className="req">*</span></label>
              <input
                className="inp"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="user@safeen.ae"
              />
            </div>
            <div className="field">
              <label>Badge number</label>
              <input
                className="inp"
                value={form.badgeNumber}
                onChange={(e) => update("badgeNumber", e.target.value)}
                placeholder="10120"
              />
            </div>
            <div className="field">
              <label>
                {editUser ? (
                  <>
                    Password <span className="hint">(blank keeps current)</span>
                  </>
                ) : (
                  <>
                    Password <span className="req">*</span>
                  </>
                )}
              </label>
              <input
                className="inp"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder={editUser ? "••••••••" : "Min 6 chars"}
              />
            </div>
            <div className="field">
              <label>
                Department <span className="req">*</span>
              </label>
              <SelectControl
                variant="inp"
                value={form.departmentId}
                onChange={(e) => update("departmentId", e.target.value)}
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </SelectControl>
            </div>
            <div className="field">
              <label>
                Role <span className="req">*</span>
              </label>
              <SelectControl
                variant="inp"
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
              >
                <option value="REQUESTER">Requester</option>
                <option value="DEPT_HEAD">Department Head</option>
                <option value="STORE_STAFF">Store Staff</option>
                <option value="STORE_MANAGER">Store Manager</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </SelectControl>
            </div>
            {editUser && (
              <div className="field span2">
                <label>Status</label>
                <SelectControl
                  variant="inp"
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </SelectControl>
              </div>
            )}
            <div className="field span2">
              <div className="rounded-[0.6rem] border border-line-soft bg-field p-3 text-[0.78rem] leading-relaxed text-subtle">
                <div className="mb-1 flex items-center gap-1.5 font-medium text-ink">
                  <ShieldCheck className="size-3.5" />
                  Role permissions
                </div>
                <ul className="ml-5 list-disc space-y-0.5">
                  <li>
                    <strong className="text-ink">Requester</strong> — create and
                    submit requisitions
                  </li>
                  <li>
                    <strong className="text-ink">Dept. Head</strong> — approve
                    department requisitions
                  </li>
                  <li>
                    <strong className="text-ink">Store Staff</strong> — review,
                    approve, and issue items
                  </li>
                  <li>
                    <strong className="text-ink">Store Manager</strong> — full
                    store access + user management
                  </li>
                  <li>
                    <strong className="text-ink">Super Admin</strong> —
                    everything
                  </li>
                </ul>
              </div>
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
              {editUser ? "Save changes" : "Create user"}
            </button>
          </div>
        </form>
      </FormDialog>
    </div>
  );
}
