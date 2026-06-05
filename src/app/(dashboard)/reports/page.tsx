"use client";

import { useState } from "react";
import {
  BarChart3,
  Download,
  Loader2,
  Boxes,
  TriangleAlert,
  FileText,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { PageHead, Pill } from "@/components/safeen/ui";

type Tone = "green" | "amber" | "red" | "blue" | "violet" | "grey";

const REPORTS: {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tint: string;
  hasDateFilter: boolean;
}[] = [
  {
    id: "inventory-summary",
    title: "Inventory Summary",
    description: "Stock levels & value by item",
    icon: Boxes,
    tint: "tint-accent",
    hasDateFilter: false,
  },
  {
    id: "low-stock",
    title: "Low Stock / Reorder",
    description: "Items at or below reorder point",
    icon: TriangleAlert,
    tint: "tint-amber",
    hasDateFilter: false,
  },
  {
    id: "consumption-by-department",
    title: "Consumption by Dept",
    description: "Issued value per department",
    icon: BarChart2,
    tint: "tint-blue",
    hasDateFilter: true,
  },
  {
    id: "requisition-history",
    title: "Requisition History",
    description: "All requisitions in range",
    icon: FileText,
    tint: "tint-violet",
    hasDateFilter: true,
  },
];

interface ReportData {
  type: string;
  summary?: Record<string, unknown>;
  data: Record<string, unknown>[];
}

const STATUS_TONE: Record<string, Tone> = {
  OUT_OF_STOCK: "red",
  REJECTED: "red",
  LOW_STOCK: "amber",
  PARTIALLY_ISSUED: "amber",
  IN_STOCK: "green",
  ISSUED: "green",
  APPROVED: "green",
};

function titleCase(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function isNumericCol(key: string) {
  const k = key.toLowerCase();
  return (
    k.includes("value") ||
    k.includes("cost") ||
    k.includes("balance") ||
    k.includes("qty") ||
    k.includes("quantity") ||
    k.includes("rop") ||
    k.includes("count") ||
    k.includes("items") ||
    k.includes("share")
  );
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState("inventory-summary");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [page, setPage] = useState(1);
  const PER = 50;

  const selectedConfig = REPORTS.find((r) => r.id === selectedReport);

  async function generateReport() {
    if (!selectedReport) return;
    setLoading(true);
    setReport(null);
    setPage(1);

    const params = new URLSearchParams({ type: selectedReport });
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);

    try {
      const res = await fetch(`/api/reports?${params}`);
      const data = await res.json();
      setReport(data);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!report || !report.data.length) return;
    const headers = Object.keys(report.data[0]);
    const rows = report.data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = String(val ?? "");
          return str.includes(",") ? `"${str}"` : str;
        })
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedReport}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function truncate(str: string, len: number) {
    return str.length <= len ? str : str.substring(0, len) + "…";
  }

  function fmtMoney(v: number) {
    return `AED ${v.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  const cols = report?.data.length ? Object.keys(report.data[0]) : [];

  return (
    <div>
      <PageHead
        eyebrow="Analytics"
        title="Reports"
        sub="Generate inventory and requisition reports and export to CSV."
      />

      {/* report type cards */}
      <div className="rtypes">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            className={`rtype${selectedReport === r.id ? " on" : ""}`}
            onClick={() => {
              setSelectedReport(r.id);
              setReport(null);
            }}
          >
            <span className={`ic ${r.tint}`}>
              <r.icon strokeWidth={1.9} />
            </span>
            <b>{r.title}</b>
            <span>{r.description}</span>
          </button>
        ))}
      </div>

      {/* controls */}
      <div className="controls">
        {selectedConfig?.hasDateFilter && (
          <>
            <div className="field">
              <label>From</label>
              <input
                className="inp"
                type="date"
                style={{ width: "12rem" }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label>To</label>
              <input
                className="inp"
                type="date"
                style={{ width: "12rem" }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </>
        )}
        <button className="btn primary" onClick={generateReport} disabled={loading}>
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <BarChart3 />
          )}
          Generate
        </button>
        <span className="grow" style={{ flex: 1 }} />
        {report && report.data.length > 0 && (
          <button className="btn" onClick={exportCSV}>
            <Download />
            Export CSV
          </button>
        )}
      </div>

      {/* summary stat cards */}
      {report?.summary && (
        <div className="statcards">
          {Object.entries(report.summary)
            .filter(([, value]) => typeof value !== "object")
            .map(([key, value]) => (
              <div key={key} className="mini">
                <div className="ml">{titleCase(key)}</div>
                <div className="mv" style={{ fontSize: "1.5rem" }}>
                  {typeof value === "number" &&
                  key.toLowerCase().includes("value")
                    ? fmtMoney(value)
                    : String(value)}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* results table */}
      <div className="tablewrap">
        <table className="tbl">
          {report && cols.length > 0 && (
            <thead>
              <tr>
                {cols.map((key) => (
                  <th key={key} className={isNumericCol(key) ? "num" : ""}>
                    {titleCase(key)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={Math.max(cols.length, 1)}>
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="size-6 animate-spin text-faint" />
                  </div>
                </td>
              </tr>
            ) : !report ? (
              <tr>
                <td>
                  <div className="empty">
                    <b>Pick a report</b>
                    <span>
                      Choose a report type above, then press Generate.
                    </span>
                  </div>
                </td>
              </tr>
            ) : report.data.length === 0 ? (
              <tr>
                <td colSpan={Math.max(cols.length, 1)}>
                  <div className="empty">
                    <b>No data</b>
                    <span>No records for the selected criteria.</span>
                  </div>
                </td>
              </tr>
            ) : (
              report.data
                .slice((page - 1) * PER, page * PER)
                .map((row, i) => (
                <tr key={i} style={{ cursor: "default" }}>
                  {Object.entries(row).map(([key, value], j) => {
                    const numeric = isNumericCol(key) && typeof value === "number";
                    return (
                      <td key={j} className={numeric ? "num tnum" : ""}>
                        {key === "status" ? (
                          <Pill tone={STATUS_TONE[String(value)] ?? "grey"}>
                            {String(value).replace(/_/g, " ")}
                          </Pill>
                        ) : key === "criticality" ? (
                          <Pill
                            tone={
                              value === 1
                                ? "red"
                                : value === 2
                                  ? "amber"
                                  : "grey"
                            }
                          >
                            {value === 1
                              ? "Critical"
                              : value === 2
                                ? "Important"
                                : "Standard"}
                          </Pill>
                        ) : typeof value === "number" ? (
                          key.toLowerCase().includes("value") ||
                          key.toLowerCase().includes("cost") ? (
                            fmtMoney(value)
                          ) : (
                            value.toLocaleString()
                          )
                        ) : key === "code" || key === "number" ? (
                          <span className="cellcode">{String(value)}</span>
                        ) : typeof value === "string" && key === "date" ? (
                          new Date(value).toLocaleDateString()
                        ) : typeof value === "string" && key === "description" ? (
                          <span title={value}>{truncate(value, 50)}</span>
                        ) : (
                          String(value ?? "—")
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {report && report.data.length > PER && (
        <div className="pagination">
          <span className="info">
            Showing {(page - 1) * PER + 1}–
            {Math.min(page * PER, report.data.length)} of {report.data.length}{" "}
            records
          </span>
          <div className="pgbtns">
            <button
              className="btn sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft />
              Prev
            </button>
            <button
              className="btn sm"
              disabled={page >= Math.ceil(report.data.length / PER)}
              onClick={() =>
                setPage((p) =>
                  Math.min(Math.ceil(report.data.length / PER), p + 1)
                )
              }
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
