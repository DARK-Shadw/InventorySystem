"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Check,
  X,
  Plus,
  ArrowRight,
  Printer,
  Package,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Pill, FormDialog, NumberField } from "@/components/safeen/ui";
import { useAuth } from "@/context/auth-context";

interface RequisitionDetail {
  id: string;
  requisitionNumber: string;
  revisionNumber: number;
  status: string;
  remarks: string | null;
  createdAt: string;
  submittedAt: string | null;
  requester: { name: string; email: string; badgeNumber: string | null };
  department: { code: string; name: string };
  project: { code: string; name: string } | null;
  location: { name: string; type: string; region: string | null } | null;
  items: {
    id: string;
    unit: string;
    quantityRequired: number;
    quantityIssued: number;
    status: string;
    remarks: string | null;
    item: {
      itemCode: string;
      description: string;
      classDescription: string | null;
      issueUnit: string;
      inventoryRecords: { currentBalance: number }[];
    };
  }[];
  approvals: {
    id: string;
    level: number;
    action: string;
    comments: string | null;
    actedAt: string;
    approver: { name: string; role: string };
  }[];
}

type Tone = "green" | "amber" | "red" | "blue" | "violet" | "grey";

const REQ_TONE: Record<string, { tone: Tone; label: string }> = {
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

const LINE_TONE: Record<string, { tone: Tone; label: string }> = {
  PENDING: { tone: "grey", label: "Pending" },
  APPROVED: { tone: "blue", label: "Approved" },
  PARTIALLY_ISSUED: { tone: "amber", label: "Partial" },
  ISSUED: { tone: "green", label: "Issued" },
  REJECTED: { tone: "red", label: "Rejected" },
  BACKORDERED: { tone: "violet", label: "Backordered" },
};

const ACT: Record<string, { tint: string; Icon: LucideIcon }> = {
  CREATED: { tint: "tint-grey", Icon: Plus },
  SUBMITTED: { tint: "tint-blue", Icon: Check },
  APPROVED: { tint: "tint-green", Icon: Check },
  ISSUED: { tint: "tint-accent", Icon: ArrowRight },
  REJECTED: { tint: "tint-red", Icon: X },
};

function fullDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function relTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function RequisitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [requisition, setRequisition] = useState<RequisitionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const [approveDialog, setApproveDialog] = useState(false);
  const [approveAction, setApproveAction] = useState<"APPROVED" | "REJECTED">(
    "APPROVED"
  );
  const [approveComments, setApproveComments] = useState("");

  const [issueDialog, setIssueDialog] = useState(false);
  const [issueQuantities, setIssueQuantities] = useState<
    Record<string, number>
  >({});

  function fetchRequisition() {
    setLoading(true);
    fetch(`/api/requisitions/${id}`)
      .then((r) => r.json())
      .then(setRequisition)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchRequisition();
  }, [id]);

  async function handleSubmit() {
    setActionLoading("submit");
    await fetch(`/api/requisitions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit" }),
    });
    fetchRequisition();
    setActionLoading("");
  }

  async function handleCancel() {
    setActionLoading("cancel");
    await fetch(`/api/requisitions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    fetchRequisition();
    setActionLoading("");
  }

  async function handleApprove() {
    setActionLoading("approve");
    await fetch(`/api/requisitions/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: approveAction,
        comments: approveComments || null,
      }),
    });
    setApproveDialog(false);
    setApproveComments("");
    fetchRequisition();
    setActionLoading("");
  }

  async function handleIssue() {
    setActionLoading("issue");
    const items = Object.entries(issueQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([requisitionItemId, quantityIssued]) => ({
        requisitionItemId,
        quantityIssued,
      }));

    await fetch(`/api/requisitions/${id}/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    setIssueDialog(false);
    setIssueQuantities({});
    fetchRequisition();
    setActionLoading("");
  }

  function openIssueDialog() {
    if (!requisition) return;
    const defaults: Record<string, number> = {};
    requisition.items.forEach((item) => {
      const remaining = item.quantityRequired - item.quantityIssued;
      const stock = item.item.inventoryRecords.reduce(
        (s, r) => s + r.currentBalance,
        0
      );
      defaults[item.id] = Math.max(0, Math.min(remaining, stock));
    });
    setIssueQuantities(defaults);
    setIssueDialog(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-faint" />
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="empty py-24">
        <b>Requisition not found</b>
        <span>It may have been removed or you don&apos;t have access.</span>
      </div>
    );
  }

  const st = REQ_TONE[requisition.status] ?? {
    tone: "grey" as Tone,
    label: requisition.status.replace(/_/g, " "),
  };

  const canSubmit = requisition.status === "DRAFT";
  const canCancel = ["DRAFT", "SUBMITTED"].includes(requisition.status);
  const canApprove =
    ["SUBMITTED", "DEPT_APPROVED"].includes(requisition.status) &&
    !!user &&
    ["DEPT_HEAD", "STORE_MANAGER", "STORE_STAFF", "SUPER_ADMIN"].includes(
      user.role
    );
  const canIssue =
    ["APPROVED", "PARTIALLY_ISSUED"].includes(requisition.status) &&
    !!user &&
    ["STORE_MANAGER", "STORE_STAFF", "SUPER_ADMIN"].includes(user.role);

  const issuableItems = requisition.items.filter(
    (item) => item.quantityIssued < item.quantityRequired
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

      {/* head */}
      <div className="rq-head">
        <div style={{ flex: 1, minWidth: "16rem" }}>
          <div className="rq-title">
            <h1>{requisition.requisitionNumber}</h1>
            <Pill tone={st.tone} dot>
              {st.label}
            </Pill>
            <Pill tone="grey">Rev {requisition.revisionNumber}</Pill>
          </div>
          <div className="rq-meta">
            Created {fullDate(requisition.createdAt)}
            {requisition.submittedAt &&
              ` · Submitted ${fullDate(requisition.submittedAt)}`}
          </div>
        </div>

        <div className="toolbar">
          {canSubmit && (
            <button
              className="btn primary"
              onClick={handleSubmit}
              disabled={!!actionLoading}
            >
              {actionLoading === "submit" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check />
              )}
              Submit
            </button>
          )}
          {canApprove && (
            <>
              <button
                className="btn success"
                onClick={() => {
                  setApproveAction("APPROVED");
                  setApproveDialog(true);
                }}
              >
                <Check />
                Approve
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  setApproveAction("REJECTED");
                  setApproveDialog(true);
                }}
              >
                <X />
                Reject
              </button>
            </>
          )}
          {canIssue && (
            <button className="btn accent" onClick={openIssueDialog}>
              <Package />
              Issue Items
            </button>
          )}
          {canCancel && (
            <button
              className="btn"
              onClick={handleCancel}
              disabled={!!actionLoading}
            >
              Cancel
            </button>
          )}
          <a
            href={`/print/requisition/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            <Printer />
            Print
          </a>
        </div>
      </div>

      {/* info cards */}
      <div className="infocards">
        <div className="ic-card">
          <div className="il">Requester</div>
          <div className="iv">{requisition.requester.name}</div>
          <div className="is">
            {requisition.department.name}
            {requisition.requester.badgeNumber &&
              ` · ${requisition.requester.badgeNumber}`}
          </div>
        </div>
        <div className="ic-card">
          <div className="il">Project</div>
          <div className="iv">
            {requisition.project
              ? `${requisition.project.code} — ${requisition.project.name}`
              : "—"}
          </div>
          {requisition.remarks && <div className="is">{requisition.remarks}</div>}
        </div>
        <div className="ic-card">
          <div className="il">Location</div>
          <div className="iv">{requisition.location?.name ?? "—"}</div>
          {requisition.location && (
            <div className="is">
              {requisition.location.type}
              {requisition.location.region &&
                ` · ${requisition.location.region}`}
            </div>
          )}
        </div>
      </div>

      {/* items + history */}
      <div className="grid2">
        <div className="panel">
          <div className="panel-head">
            <h2>Items</h2>
            <Pill tone="grey" className="ml-2">
              {requisition.items.length}
            </Pill>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "2.5rem" }}>#</th>
                <th>Item</th>
                <th>Unit</th>
                <th className="num">Req</th>
                <th className="num">Issued</th>
                <th className="num">Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requisition.items.map((item, i) => {
                const stock = item.item.inventoryRecords.reduce(
                  (s, r) => s + r.currentBalance,
                  0
                );
                const ls = LINE_TONE[item.status] ?? {
                  tone: "grey" as Tone,
                  label: item.status.replace(/_/g, " "),
                };
                const qcls =
                  item.quantityIssued >= item.quantityRequired
                    ? "qty-ok"
                    : item.quantityIssued > 0
                      ? "qty-part"
                      : "qty-zero";
                return (
                  <tr key={item.id} style={{ cursor: "default" }}>
                    <td className="tnum">{i + 1}</td>
                    <td>
                      <div className="strong cellcode">
                        {item.item.itemCode}
                      </div>
                      <div className="sub">
                        {item.item.description}
                        {item.remarks && (
                          <em className="text-brand-ink not-italic">
                            {" "}
                            · {item.remarks}
                          </em>
                        )}
                      </div>
                    </td>
                    <td>{item.unit}</td>
                    <td className="num tnum strong">{item.quantityRequired}</td>
                    <td className={`num tnum font-semibold ${qcls}`}>
                      {item.quantityIssued > 0 ? item.quantityIssued : "—"}
                    </td>
                    <td className={`num tnum ${stock === 0 ? "text-bad" : ""}`}>
                      {stock}
                    </td>
                    <td>
                      <Pill tone={ls.tone}>{ls.label}</Pill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Approval history</h2>
          </div>
          <div className="panel-body">
            {requisition.approvals.length === 0 ? (
              <p className="text-[0.85rem] text-subtle">
                No approval activity yet.
              </p>
            ) : (
              <div className="timeline">
                {requisition.approvals.map((h) => {
                  const meta = ACT[h.action] ?? ACT.CREATED;
                  const Icon = meta.Icon;
                  return (
                    <div key={h.id} className="tl-item">
                      <span className={`tl-dot ${meta.tint}`}>
                        <Icon strokeWidth={2.2} />
                      </span>
                      <div className="tl-body">
                        <b>
                          {h.action.charAt(0) +
                            h.action.slice(1).toLowerCase()}{" "}
                          · {h.approver.name}
                        </b>
                        <div className="meta">
                          {h.approver.role.replace(/_/g, " ")}
                          {h.level ? ` · Level ${h.level}` : ""}
                        </div>
                        {h.comments && <div className="cmt">{h.comments}</div>}
                      </div>
                      <span className="tl-time">{relTime(h.actedAt)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* approve / reject dialog */}
      <FormDialog
        open={approveDialog}
        onOpenChange={setApproveDialog}
        size="md"
        title={
          approveAction === "APPROVED"
            ? "Approve requisition"
            : "Reject requisition"
        }
        description={
          approveAction === "APPROVED"
            ? "This advances the requisition to the next stage."
            : "This returns the requisition as rejected."
        }
      >
        <div className="field">
          <label>
            Comments <span className="hint">(optional)</span>
          </label>
          <textarea
            className="inp"
            placeholder="Add a note for the approval history…"
            value={approveComments}
            onChange={(e) => setApproveComments(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button className="btn" onClick={() => setApproveDialog(false)}>
            Cancel
          </button>
          <button
            className={`btn ${approveAction === "APPROVED" ? "success" : "danger"}`}
            onClick={handleApprove}
            disabled={!!actionLoading}
          >
            {actionLoading === "approve" && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {approveAction === "APPROVED" ? "Approve" : "Reject"}
          </button>
        </div>
      </FormDialog>

      {/* issue dialog */}
      <FormDialog
        open={issueDialog}
        onOpenChange={setIssueDialog}
        size="xl"
        title="Issue items"
        description="Quantities are capped at the lower of remaining need and available stock."
      >
        <div>
          {issuableItems.map((item) => {
            const remaining = item.quantityRequired - item.quantityIssued;
            const stock = item.item.inventoryRecords.reduce(
              (s, r) => s + r.currentBalance,
              0
            );
            const max = Math.max(0, Math.min(remaining, stock));
            return (
              <div key={item.id} className="issue-line">
                <div>
                  <div className="strong cellcode">{item.item.itemCode}</div>
                  <div className="sub">{item.item.description}</div>
                  <div className="sub">
                    Need {remaining} · stock {stock} · max {max}
                  </div>
                </div>
                <div className="qin">
                  <NumberField
                    integer
                    min={0}
                    value={issueQuantities[item.id] ?? 0}
                    onValueChange={(n) =>
                      setIssueQuantities((prev) => ({
                        ...prev,
                        [item.id]: Math.min(Math.max(0, n), max),
                      }))
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button className="btn" onClick={() => setIssueDialog(false)}>
            Cancel
          </button>
          <button
            className="btn accent"
            onClick={handleIssue}
            disabled={!!actionLoading}
          >
            {actionLoading === "issue" && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Issue items
          </button>
        </div>
      </FormDialog>
    </div>
  );
}
