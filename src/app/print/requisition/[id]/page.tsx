"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Printer, Loader2 } from "lucide-react";

interface RequisitionDetail {
  requisitionNumber: string;
  revisionNumber: number;
  status: string;
  remarks: string | null;
  createdAt: string;
  requester: { name: string; badgeNumber: string | null };
  department: { code: string; name: string };
  project: { code: string; name: string } | null;
  location: { name: string; type: string; region: string | null } | null;
  items: {
    id: string;
    unit: string;
    quantityRequired: number;
    quantityIssued: number;
    remarks: string | null;
    item: { itemCode: string; description: string };
  }[];
  approvals: { action: string }[];
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  DEPT_APPROVED: "Dept Approved",
  STORE_REVIEWING: "Store Reviewing",
  APPROVED: "Approved",
  PARTIALLY_ISSUED: "Partially Issued",
  ISSUED: "Issued",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

function fullDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RequisitionPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [req, setReq] = useState<RequisitionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/requisitions/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setReq)
      .finally(() => setLoading(false));
  }, [id]);

  const lines = req?.items ?? [];
  const filler = Math.max(0, 14 - lines.length);
  const approvedCount = req?.approvals.filter((a) => a.action === "APPROVED").length ?? 0;

  return (
    <div className="pp-wrap">
      <style>{PRINT_CSS}</style>

      <div className="pp-bar">
        <button className="pp-btn" onClick={() => router.back()}>
          <ChevronLeft className="size-4" />
          Back
        </button>
        <span className="pp-grow" />
        <button
          className="pp-btn primary"
          onClick={() => window.print()}
          disabled={loading || !req}
        >
          <Printer className="size-4" />
          Print
        </button>
      </div>

      {loading ? (
        <div className="pp-loading">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : !req ? (
        <div className="pp-loading">Requisition not found.</div>
      ) : (
        <div className="pp-page">
          {/* header */}
          <div className="pp-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/safeen.png" alt="SAFEEN Subsea" className="pp-logo" />
            <div className="pp-org">
              <b>SAFEEN</b>
              <span>Survey &amp; Subsea · AD Ports Group</span>
            </div>
            <div className="pp-doc">
              <div className="t">Material Requisition</div>
              <div className="n">
                {req.requisitionNumber} · Rev {req.revisionNumber}
              </div>
            </div>
          </div>

          {/* meta */}
          <div className="pp-meta">
            <div>
              <div className="l">Date</div>
              <div className="v">{fullDate(req.createdAt)}</div>
            </div>
            <div>
              <div className="l">Project</div>
              <div className="v">
                {req.project ? `${req.project.code} — ${req.project.name}` : "—"}
              </div>
            </div>
            <div>
              <div className="l">Location / Barge</div>
              <div className="v">{req.location?.name ?? "—"}</div>
            </div>
            <div>
              <div className="l">Requester</div>
              <div className="v">{req.requester.name}</div>
            </div>
            <div>
              <div className="l">Badge No.</div>
              <div className="v">{req.requester.badgeNumber ?? "—"}</div>
            </div>
            <div>
              <div className="l">Department</div>
              <div className="v">{req.department.name}</div>
            </div>
          </div>

          <div className="pp-remarks">
            <b>Remarks:</b> {req.remarks || "—"}
          </div>

          {/* items */}
          <table className="pp-table">
            <thead>
              <tr>
                <th style={{ width: "6%" }}>#</th>
                <th style={{ width: "16%" }}>Item Code</th>
                <th>Description</th>
                <th style={{ width: "8%" }}>Unit</th>
                <th style={{ width: "9%" }}>Qty Req</th>
                <th style={{ width: "9%" }}>Qty Iss</th>
                <th style={{ width: "16%" }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.id}>
                  <td className="c">{i + 1}</td>
                  <td className="code">{l.item.itemCode}</td>
                  <td>{l.item.description}</td>
                  <td className="c">{l.unit}</td>
                  <td className="c">{l.quantityRequired}</td>
                  <td className="c">{l.quantityIssued || ""}</td>
                  <td>{l.remarks || ""}</td>
                </tr>
              ))}
              {Array.from({ length: filler }).map((_, i) => (
                <tr key={`f${i}`}>
                  <td className="c">{lines.length + i + 1}</td>
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                  <td />
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pp-appr">
            Status: <b>{STATUS_LABEL[req.status] ?? req.status}</b> ·
            Approvals: <b>{approvedCount}</b> recorded · Total lines:{" "}
            <b>{lines.length}</b>
          </div>

          {/* signatures */}
          <div className="pp-sigs">
            <div className="pp-sig">
              <div className="role">Requested By</div>
              <div className="space" />
              <div className="line">
                {req.requester.name} · {fullDate(req.createdAt)}
              </div>
            </div>
            <div className="pp-sig">
              <div className="role">Approved By</div>
              <div className="space" />
              <div className="line">Store Manager · Date</div>
            </div>
            <div className="pp-sig">
              <div className="role">Issued By</div>
              <div className="space" />
              <div className="line">Store Staff · Date</div>
            </div>
          </div>

          <div className="pp-foot">
            <span>SAFEEN Inventory Management</span>
            <span>
              Generated {fullDate(new Date().toISOString())} · system-generated
              document
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const PRINT_CSS = `
  .pp-wrap { min-height: 100dvh; background: oklch(0.93 0.004 80); padding: 1.5rem; }
  .pp-bar { max-width: 210mm; margin: 0 auto 1rem; display: flex; gap: 0.6rem; align-items: center; }
  .pp-grow { flex: 1; }
  .pp-btn { display: inline-flex; align-items: center; gap: 0.45rem; height: 2.55rem; padding: 0 1rem; border-radius: 0.7rem; border: 1px solid var(--color-line); background: var(--card); font-size: 0.875rem; font-weight: 500; cursor: pointer; color: var(--color-ink); transition: background 0.14s; }
  .pp-btn:hover { background: oklch(0.975 0.003 80); }
  .pp-btn.primary { background: linear-gradient(to bottom, oklch(0.33 0.02 285), var(--primary) 58%); color: var(--primary-foreground); border: none; font-weight: 550; box-shadow: 0 1px 2px oklch(0.2 0.02 285 / 0.3), 0 10px 22px -12px oklch(0.2 0.02 285 / 0.6), inset 0 1px 0 oklch(1 0 0 / 0.6); }
  .pp-btn:disabled { opacity: 0.6; cursor: default; }
  .pp-loading { max-width: 210mm; min-height: 60vh; margin: 0 auto; display: grid; place-items: center; color: var(--color-subtle); }

  .pp-page { max-width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; color: #1b1a18; padding: 16mm 14mm; box-shadow: 0 20px 50px -24px rgba(40,30,20,0.35); }
  .pp-head { display: flex; align-items: flex-start; gap: 0.9rem; border-bottom: 2px solid #1b1a18; padding-bottom: 0.9rem; }
  .pp-logo { height: 2.4rem; width: auto; object-fit: contain; }
  .pp-org { display: flex; flex-direction: column; justify-content: center; }
  .pp-org b { font-size: 0.95rem; font-weight: 700; letter-spacing: -0.01em; display: none; }
  .pp-org span { font-size: 0.78rem; color: #6c6760; }
  .pp-doc { margin-left: auto; text-align: right; }
  .pp-doc .t { font-size: 0.95rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
  .pp-doc .n { font-family: var(--font-geist-mono), ui-monospace, monospace; font-size: 0.92rem; margin-top: 0.2rem; }

  .pp-meta { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #d9d5cf; border-radius: 0.4rem; overflow: hidden; margin: 1.1rem 0; }
  .pp-meta div { padding: 0.55rem 0.75rem; border-right: 1px solid #d9d5cf; border-bottom: 1px solid #d9d5cf; }
  .pp-meta div:nth-child(3n) { border-right: none; }
  .pp-meta div:nth-last-child(-n+3) { border-bottom: none; }
  .pp-meta .l { font-size: 0.62rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #6c6760; }
  .pp-meta .v { font-size: 0.85rem; font-weight: 600; margin-top: 0.15rem; }
  .pp-remarks { font-size: 0.82rem; margin-bottom: 0.9rem; }

  .pp-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
  .pp-table thead th { background: #f4f1ec; text-align: left; font-size: 0.64rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #6c6760; padding: 0.5rem 0.6rem; border: 1px solid #d9d5cf; }
  .pp-table tbody td { padding: 0.5rem 0.6rem; border: 1px solid #d9d5cf; vertical-align: top; height: 1.9rem; }
  .pp-table td.c { text-align: center; }
  .pp-table .code { font-family: var(--font-geist-mono), ui-monospace, monospace; font-weight: 600; }

  .pp-appr { font-size: 0.78rem; color: #6c6760; margin: 0.9rem 0 1.4rem; }
  .pp-appr b { color: #1b1a18; }
  .pp-sigs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 2.5rem; }
  .pp-sig { text-align: center; }
  .pp-sig .space { height: 2.2rem; }
  .pp-sig .line { border-top: 1px solid #1b1a18; padding-top: 0.4rem; font-size: 0.74rem; color: #6c6760; }
  .pp-sig .role { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
  .pp-foot { margin-top: 2rem; padding-top: 0.7rem; border-top: 1px solid #d9d5cf; font-size: 0.68rem; color: #6c6760; display: flex; justify-content: space-between; }

  @media print {
    .pp-wrap { background: #fff; padding: 0; }
    .pp-bar { display: none; }
    .pp-page { box-shadow: none; margin: 0; max-width: none; min-height: auto; padding: 12mm; }
    @page { size: A4; margin: 0; }
  }
`;
