"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Loader2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const roleLabels: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: "Super Admin", color: "bg-purple-100 text-purple-700" },
  STORE_MANAGER: { label: "Store Manager", color: "bg-blue-100 text-blue-700" },
  STORE_STAFF: { label: "Store Staff", color: "bg-cyan-100 text-cyan-700" },
  DEPT_HEAD: { label: "Dept. Head", color: "bg-amber-100 text-amber-700" },
  REQUESTER: { label: "Requester", color: "bg-gray-100 text-gray-700" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-700" },
  INACTIVE: { label: "Inactive", color: "bg-gray-100 text-gray-500" },
  SUSPENDED: { label: "Suspended", color: "bg-red-100 text-red-700" },
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and role assignments
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or badge..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="STORE_MANAGER">Store Manager</option>
              <option value="STORE_STAFF">Store Staff</option>
              <option value="DEPT_HEAD">Dept. Head</option>
              <option value="REQUESTER">Requester</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Users className="mb-3 h-10 w-10" />
              <p className="font-medium">No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[90px]">Badge</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="w-[120px]">Role</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const role = roleLabels[user.role] || roleLabels.REQUESTER;
                  const status = statusLabels[user.status] || statusLabels.ACTIVE;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <span className="text-sm font-medium">
                            {user.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {user.badgeNumber || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.department?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={role.color}>
                          {role.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={status.color}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => openEdit(user)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editUser ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label>Badge Number</Label>
                <Input
                  value={form.badgeNumber}
                  onChange={(e) => update("badgeNumber", e.target.value)}
                  placeholder="10120"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="user@safeen.ae"
                />
              </div>
              <div className="space-y-2">
                <Label>{editUser ? "New Password" : "Password *"}</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder={editUser ? "Leave blank to keep" : "Min 6 chars"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.departmentId}
                  onChange={(e) => update("departmentId", e.target.value)}
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                >
                  <option value="REQUESTER">Requester</option>
                  <option value="DEPT_HEAD">Department Head</option>
                  <option value="STORE_STAFF">Store Staff</option>
                  <option value="STORE_MANAGER">Store Manager</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>

            {editUser && (
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            )}

            {/* Role Explanation */}
            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="font-medium">Role Permissions</span>
              </div>
              <ul className="ml-5 space-y-0.5 list-disc">
                <li><strong>Requester</strong> — Create and submit requisitions</li>
                <li><strong>Dept. Head</strong> — Approve department requisitions</li>
                <li><strong>Store Staff</strong> — Review, approve, and issue items</li>
                <li><strong>Store Manager</strong> — Full store access + user management</li>
                <li><strong>Super Admin</strong> — Everything</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editUser ? "Save Changes" : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
