"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
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

interface Requisition {
  id: string;
  requisitionNumber: string;
  status: string;
  requester: { name: string; badgeNumber: string | null };
  department: { code: string; name: string };
  project: { code: string; name: string } | null;
  location: { name: string; type: string } | null;
  _count: { items: number };
  createdAt: string;
  submittedAt: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  DEPT_APPROVED: "bg-cyan-100 text-cyan-700",
  STORE_REVIEWING: "bg-indigo-100 text-indigo-700",
  APPROVED: "bg-green-100 text-green-700",
  PARTIALLY_ISSUED: "bg-amber-100 text-amber-700",
  ISSUED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRequisitions = useCallback(
    async (page = 1) => {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      try {
        const res = await fetch(`/api/requisitions?${params}`);
        const data = await res.json();
        setRequisitions(data.requisitions);
        setPagination(data.pagination);
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    const debounce = setTimeout(() => fetchRequisitions(1), 300);
    return () => clearTimeout(debounce);
  }, [fetchRequisitions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Requisitions
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage store requisition requests
          </p>
        </div>
        <Link href="/requisitions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Requisition
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by number or requester..."
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
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="DEPT_APPROVED">Dept. Approved</option>
              <option value="APPROVED">Approved</option>
              <option value="PARTIALLY_ISSUED">Partially Issued</option>
              <option value="ISSUED">Issued</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
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
          ) : requisitions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <FileText className="mb-3 h-10 w-10" />
              <p className="font-medium">No requisitions found</p>
              <p className="text-sm">Create your first requisition</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Requisition #</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Project / Location</TableHead>
                    <TableHead className="text-center w-[80px]">Items</TableHead>
                    <TableHead className="w-[130px]">Status</TableHead>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requisitions.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {req.requisitionNumber}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{req.department.name}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{req.requester.name}</p>
                          {req.requester.badgeNumber && (
                            <p className="text-xs text-muted-foreground">
                              Badge: {req.requester.badgeNumber}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {req.project && (
                            <span>Project {req.project.code}</span>
                          )}
                          {req.project && req.location && <span> — </span>}
                          {req.location && <span>{req.location.name}</span>}
                          {!req.project && !req.location && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {req._count.items}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusColors[req.status] || ""}
                        >
                          {req.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/requisitions/${req.id}`}>
                          <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1}–
                    {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                    of {pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchRequisitions(pagination.page - 1)}
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
                      onClick={() => fetchRequisitions(pagination.page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
