"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { PageHead, SearchControl, SelectControl, Pill, Avatar } from "@/components/safeen/ui";

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

type Tone = "green" | "amber" | "red" | "blue" | "violet" | "grey";

const STATUS_META: Record<string, { tone: Tone; label: string }> = {
  DRAFT: { tone: "grey", label: "Draft" },
  SUBMITTED: { tone: "blue", label: "Submitted" },
  DEPT_APPROVED: { tone: "violet", label: "Dept Approved" },
  STORE_REVIEWING: { tone: "amber", label: "Store Reviewing" },
  APPROVED: { tone: "green", label: "Approved" },
  PARTIALLY_ISSUED: { tone: "amber", label: "Partially Issued" },
  ISSUED: { tone: "green", label: "Issued" },
  REJECTED: { tone: "red", label: "Rejected" },
  CANCELLED: { tone: "grey", label: "Cancelled" },
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
  const router = useRouter();

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
    <div className="flex h-full min-h-0 flex-col">
      <PageHead
        eyebrow="Material requests"
        title="Requisitions"
        sub="Every material requisition across departments and projects."
      >
        <Link href="/requisitions/new" className="btn primary">
          <Plus />
          New Requisition
        </Link>
      </PageHead>

      <div className="filters shrink-0">
        <SearchControl
          placeholder="Search by number or requester…"
          style={{ flex: 1, maxWidth: "24rem" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <SelectControl
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => (
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
                <th>Requisition</th>
                <th>Department</th>
                <th>Requester</th>
                <th>Project / Location</th>
                <th className="num">Items</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="size-6 animate-spin text-faint" />
                    </div>
                  </td>
                </tr>
              ) : requisitions.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">
                      <b>No requisitions found</b>
                      <span>
                        Adjust your filters or create a new requisition.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                requisitions.map((req) => {
                  const st = STATUS_META[req.status] ?? {
                    tone: "grey" as Tone,
                    label: req.status.replace(/_/g, " "),
                  };
                  return (
                    <tr
                      key={req.id}
                      className="clickable"
                      onClick={() => router.push(`/requisitions/${req.id}`)}
                    >
                      <td>
                        <div className="strong cellcode">
                          {req.requisitionNumber}
                        </div>
                      </td>
                      <td>{req.department.name}</td>
                      <td>
                        <div className="who-cell">
                          <Avatar name={req.requester.name} />
                          <div>
                            <div className="strong" style={{ fontWeight: 500 }}>
                              {req.requester.name}
                            </div>
                            {req.requester.badgeNumber && (
                              <div className="sub">
                                {req.requester.badgeNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          {req.project ? (
                            `Project ${req.project.code}`
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </div>
                        {req.location && (
                          <div className="sub">{req.location.name}</div>
                        )}
                      </td>
                      <td className="num tnum">{req._count.items}</td>
                      <td>
                        <Pill tone={st.tone} dot>
                          {st.label}
                        </Pill>
                      </td>
                      <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className="rowact">
                          <Link
                            href={`/requisitions/${req.id}`}
                            className="btn sm ghost"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                            <ChevronRight />
                          </Link>
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

      {!loading && requisitions.length > 0 && pagination.totalPages > 1 && (
        <div className="pagination shrink-0">
          <span className="info">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} requisitions
          </span>
          <div className="pgbtns">
            <button
              className="btn sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchRequisitions(pagination.page - 1)}
            >
              <ChevronLeft />
              Prev
            </button>
            <button
              className="btn sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchRequisitions(pagination.page + 1)}
            >
              Next
              <ChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
