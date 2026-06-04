"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  X,
  Package,
  Loader2,
  Clock,
  User,
  MapPin,
  FolderKanban,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  DEPT_APPROVED: "bg-cyan-100 text-cyan-700",
  APPROVED: "bg-green-100 text-green-700",
  PARTIALLY_ISSUED: "bg-amber-100 text-amber-700",
  ISSUED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  PENDING: "bg-gray-100 text-gray-700",
};

export default function RequisitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [requisition, setRequisition] = useState<RequisitionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const [approveDialog, setApproveDialog] = useState(false);
  const [approveAction, setApproveAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [approveComments, setApproveComments] = useState("");

  const [issueDialog, setIssueDialog] = useState(false);
  const [issueQuantities, setIssueQuantities] = useState<Record<string, number>>({});

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
      defaults[item.id] = Math.min(remaining, stock);
    });
    setIssueQuantities(defaults);
    setIssueDialog(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!requisition) {
    return <p className="py-20 text-center text-muted-foreground">Not found</p>;
  }

  const canSubmit = requisition.status === "DRAFT";
  const canCancel = ["DRAFT", "SUBMITTED"].includes(requisition.status);
  const canApprove =
    ["SUBMITTED", "DEPT_APPROVED"].includes(requisition.status) &&
    user &&
    ["DEPT_HEAD", "STORE_MANAGER", "STORE_STAFF", "SUPER_ADMIN"].includes(user.role);
  const canIssue =
    ["APPROVED", "PARTIALLY_ISSUED"].includes(requisition.status) &&
    user &&
    ["STORE_MANAGER", "STORE_STAFF", "SUPER_ADMIN"].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/requisitions")}
            className="rounded-md p-2 hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {requisition.requisitionNumber}
              </h1>
              <Badge
                variant="secondary"
                className={statusColors[requisition.status] || ""}
              >
                {requisition.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Created {new Date(requisition.createdAt).toLocaleDateString()}
              {requisition.submittedAt &&
                ` — Submitted ${new Date(requisition.submittedAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <a
            href={`/requisitions/${id}/print`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="default">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </a>
          {canSubmit && (
            <Button onClick={handleSubmit} disabled={!!actionLoading}>
              {actionLoading === "submit" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit
            </Button>
          )}
          {canApprove && (
            <>
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                onClick={() => {
                  setApproveAction("REJECTED");
                  setApproveDialog(true);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setApproveAction("APPROVED");
                  setApproveDialog(true);
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
          {canIssue && (
            <Button onClick={openIssueDialog}>
              <Package className="mr-2 h-4 w-4" />
              Issue Items
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={!!actionLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{requisition.requester.name}</p>
              <p className="text-xs text-muted-foreground">
                {requisition.department.name}
              </p>
            </div>
          </CardContent>
        </Card>
        {requisition.project && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Project {requisition.project.code}
                </p>
                <p className="text-xs text-muted-foreground">
                  {requisition.project.name}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {requisition.location && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {requisition.location.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {requisition.location.type}
                  {requisition.location.region &&
                    ` — ${requisition.location.region}`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {requisition.remarks && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Remarks
              </p>
              <p className="text-sm">{requisition.remarks}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Requested Items ({requisition.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead className="w-[110px]">Item Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[70px]">Unit</TableHead>
                <TableHead className="w-[80px] text-center">Required</TableHead>
                <TableHead className="w-[80px] text-center">Issued</TableHead>
                <TableHead className="w-[80px] text-center">Stock</TableHead>
                <TableHead className="w-[110px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requisition.items.map((item, index) => {
                const stock = item.item.inventoryRecords.reduce(
                  (s, r) => s + r.currentBalance,
                  0
                );
                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium">
                      {item.item.itemCode}
                    </TableCell>
                    <TableCell>
                      <p
                        className="max-w-sm text-sm"
                        title={item.item.description}
                      >
                        {item.item.description.length > 70
                          ? item.item.description.substring(0, 70) + "..."
                          : item.item.description}
                      </p>
                      {item.remarks && (
                        <p className="text-xs text-muted-foreground">
                          Note: {item.remarks}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{item.unit}</TableCell>
                    <TableCell className="text-center text-sm font-medium">
                      {item.quantityRequired}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {item.quantityIssued > 0 ? (
                        <span
                          className={
                            item.quantityIssued >= item.quantityRequired
                              ? "text-green-600 font-medium"
                              : "text-amber-600 font-medium"
                          }
                        >
                          {item.quantityIssued}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <span
                        className={stock === 0 ? "text-red-600" : "text-muted-foreground"}
                      >
                        {stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[item.status] || ""}
                      >
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approval History */}
      {requisition.approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Approval History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requisition.approvals.map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <div
                    className={`mt-0.5 rounded-full p-1 ${
                      approval.action === "APPROVED"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {approval.action === "APPROVED" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {approval.approver.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Level {approval.level} — {approval.approver.role}
                      </span>
                    </div>
                    {approval.comments && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {approval.comments}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(approval.actedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve/Reject Dialog */}
      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approveAction === "APPROVED"
                ? "Approve Requisition"
                : "Reject Requisition"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Add comments (optional)..."
              value={approveComments}
              onChange={(e) => setApproveComments(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setApproveDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={!!actionLoading}
                className={
                  approveAction === "REJECTED"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }
              >
                {actionLoading === "approve" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {approveAction === "APPROVED" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Issue Dialog */}
      <Dialog open={issueDialog} onOpenChange={setIssueDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Issue Items</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the quantity to issue for each item. Pre-filled with the
              maximum issuable amount based on stock.
            </p>
            <div className="space-y-2">
              {requisition.items
                .filter((item) => item.quantityIssued < item.quantityRequired)
                .map((item) => {
                  const remaining =
                    item.quantityRequired - item.quantityIssued;
                  const stock = item.item.inventoryRecords.reduce(
                    (s, r) => s + r.currentBalance,
                    0
                  );
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-md border p-3"
                    >
                      <div className="flex-1">
                        <span className="text-sm font-medium">
                          {item.item.itemCode}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Need: {remaining} {item.unit} — Stock: {stock}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max={Math.min(remaining, stock)}
                        value={issueQuantities[item.id] || 0}
                        onChange={(e) =>
                          setIssueQuantities((prev) => ({
                            ...prev,
                            [item.id]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-20 text-center"
                      />
                    </div>
                  );
                })}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIssueDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleIssue} disabled={!!actionLoading}>
                {actionLoading === "issue" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Issue Items
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
