"use client";

import { useState } from "react";
import {
  BarChart3,
  Download,
  Loader2,
  Package,
  TrendingDown,
  FileText,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const REPORTS = [
  {
    id: "inventory-summary",
    title: "Inventory Summary",
    description: "Complete stock overview with values and status",
    icon: Package,
    color: "text-blue-600 bg-blue-50",
    hasDateFilter: false,
  },
  {
    id: "low-stock",
    title: "Low Stock / Reorder Report",
    description: "Items at or below reorder point with suggested order quantities",
    icon: TrendingDown,
    color: "text-amber-600 bg-amber-50",
    hasDateFilter: false,
  },
  {
    id: "consumption-by-department",
    title: "Consumption by Department",
    description: "Items issued per department with total quantities and values",
    icon: Building2,
    color: "text-purple-600 bg-purple-50",
    hasDateFilter: true,
  },
  {
    id: "requisition-history",
    title: "Requisition History",
    description: "All requisitions with status breakdown",
    icon: FileText,
    color: "text-green-600 bg-green-50",
    hasDateFilter: true,
  },
];

interface ReportData {
  type: string;
  summary?: Record<string, unknown>;
  data: Record<string, unknown>[];
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const selectedConfig = REPORTS.find((r) => r.id === selectedReport);

  async function generateReport() {
    if (!selectedReport) return;
    setLoading(true);
    setReport(null);

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
      headers.map((h) => {
        const val = row[h];
        const str = String(val ?? "");
        return str.includes(",") ? `"${str}"` : str;
      }).join(",")
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
    return str.length <= len ? str : str.substring(0, len) + "...";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate inventory and requisition reports
        </p>
      </div>

      {/* Report Selection */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            onClick={() => { setSelectedReport(r.id); setReport(null); }}
            className={`rounded-lg border p-4 text-left transition-colors ${
              selectedReport === r.id
                ? "border-primary bg-primary/5"
                : "hover:border-muted-foreground/30"
            }`}
          >
            <div className={`mb-2 inline-flex rounded-lg p-2 ${r.color}`}>
              <r.icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium">{r.title}</p>
            <p className="text-xs text-muted-foreground">{r.description}</p>
          </button>
        ))}
      </div>

      {/* Filters + Generate */}
      {selectedReport && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-end gap-4">
              {selectedConfig?.hasDateFilter && (
                <>
                  <div className="space-y-2">
                    <Label>From</Label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To</Label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </>
              )}
              <Button onClick={generateReport} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="mr-2 h-4 w-4" />
                )}
                Generate
              </Button>
              {report && report.data.length > 0 && (
                <Button variant="outline" onClick={exportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Results */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedConfig?.title} — {report.data.length} records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Summary Cards */}
            {report.summary && (
              <div className="grid gap-3 border-b p-4 sm:grid-cols-4">
                {Object.entries(report.summary).map(([key, value]) => {
                  if (typeof value === "object") return null;
                  return (
                    <div key={key} className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-2xl font-bold">
                        {typeof value === "number" && key.toLowerCase().includes("value")
                          ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : String(value)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {report.data.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No data for the selected criteria
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(report.data[0]).map((key) => (
                        <TableHead key={key} className="whitespace-nowrap text-xs">
                          {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.data.slice(0, 100).map((row, i) => (
                      <TableRow key={i}>
                        {Object.entries(row).map(([key, value], j) => (
                          <TableCell key={j} className="whitespace-nowrap text-xs">
                            {key === "status" ? (
                              <Badge
                                variant="secondary"
                                className={
                                  value === "OUT_OF_STOCK" || value === "REJECTED"
                                    ? "bg-red-100 text-red-700"
                                    : value === "LOW_STOCK" || value === "PARTIALLY_ISSUED"
                                      ? "bg-amber-100 text-amber-700"
                                      : value === "IN_STOCK" || value === "ISSUED" || value === "APPROVED"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-700"
                                }
                              >
                                {String(value).replace(/_/g, " ")}
                              </Badge>
                            ) : key === "criticality" ? (
                              <Badge
                                variant="secondary"
                                className={
                                  value === 1
                                    ? "bg-red-100 text-red-700"
                                    : value === 2
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-gray-100 text-gray-700"
                                }
                              >
                                {value === 1 ? "Critical" : value === 2 ? "Important" : "Standard"}
                              </Badge>
                            ) : typeof value === "number" ? (
                              key.toLowerCase().includes("value") || key.toLowerCase().includes("cost")
                                ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : value.toLocaleString()
                            ) : typeof value === "string" && key === "date" ? (
                              new Date(value).toLocaleDateString()
                            ) : typeof value === "string" && key === "description" ? (
                              <span title={value}>{truncate(value, 50)}</span>
                            ) : (
                              String(value ?? "—")
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {report.data.length > 100 && (
                  <p className="border-t px-4 py-2 text-xs text-muted-foreground">
                    Showing first 100 of {report.data.length} records. Export CSV for the full dataset.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
