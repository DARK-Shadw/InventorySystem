"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SheetInfo {
  name: string;
  headers: string[];
  sampleRows: unknown[][];
  totalRows: number;
}

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: { row: number; code: string; error: string }[];
  total: number;
}

const FIELD_MAPPINGS = [
  { key: "itemCode", label: "Item Code", required: true },
  { key: "description", label: "Description", required: true },
  { key: "classDescription", label: "Class / Category", required: false },
  { key: "manufacturer", label: "Manufacturer", required: false },
  { key: "partNumber", label: "Part Number", required: false },
  { key: "orderUnit", label: "Order Unit", required: false },
  { key: "issueUnit", label: "Issue Unit", required: false },
  { key: "reorderPoint", label: "Reorder Point (ROP)", required: false },
  { key: "economicOrderQty", label: "Order Qty (EOQ)", required: false },
  { key: "leadTimeDays", label: "Lead Time (days)", required: false },
  { key: "averageCost", label: "Average Cost", required: false },
  { key: "criticality", label: "Criticality", required: false },
  { key: "isConsumable", label: "Consumable (Y/N)", required: false },
  { key: "isConsignment", label: "Consignment (Y/N)", required: false },
  { key: "commodityGroupCode", label: "Commodity Group", required: false },
  { key: "commodityCode", label: "Commodity Code", required: false },
  { key: "currentBalance", label: "Current Balance", required: false },
  { key: "availableBalance", label: "Available Balance", required: false },
  { key: "binLocation", label: "Bin Location", required: false },
  { key: "status", label: "Status", required: false },
  { key: "itemSet", label: "Item Set", required: false },
  { key: "lotType", label: "Lot Type", required: false },
];

const AUTO_MAP: Record<string, string[]> = {
  itemCode: ["item code", "item.1", "itemcode", "material number", "item no"],
  description: ["description", "item description", "items description"],
  classDescription: ["class description", "category", "class"],
  manufacturer: ["manufacturer", "mfr", "vendor"],
  partNumber: ["part #", "part no", "part number", "part#"],
  orderUnit: ["order unit", "orderunit", "purchase unit"],
  issueUnit: ["issue unit", "issueunit"],
  reorderPoint: ["rop", "reorder point", "reorder"],
  economicOrderQty: ["eoq", "economic order qty", "order qty"],
  leadTimeDays: ["lead time", "leadtime", "lead time days"],
  averageCost: ["average cost", "avg cost", "unit cost", "cost"],
  criticality: ["criticality", "priority"],
  isConsumable: ["consumable"],
  isConsignment: ["consignment"],
  commodityGroupCode: ["commodity group"],
  commodityCode: ["commodity code"],
  currentBalance: ["current bal", "current balance", "qty", "quantity", "stock"],
  availableBalance: ["available bal", "available balance"],
  binLocation: ["bin", "bin location"],
  status: ["status"],
  itemSet: ["item set", "site"],
  lotType: ["lot type"],
};

export default function ImportPage() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function autoMapColumns(headers: string[]) {
    const mapped: Record<string, string> = {};
    for (const [fieldKey, aliases] of Object.entries(AUTO_MAP)) {
      for (const header of headers) {
        const normalized = header.toLowerCase().trim();
        if (aliases.includes(normalized)) {
          mapped[fieldKey] = header;
          break;
        }
      }
    }
    return mapped;
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", f);
      formData.append("action", "preview");

      const res = await fetch("/api/import", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to read file");

      const data = await res.json();
      setSheets(data.sheets);
      setSelectedSheet(0);

      if (data.sheets.length > 0) {
        const autoMapped = autoMapColumns(data.sheets[0].headers);
        setMapping(autoMapped);
      }

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    } finally {
      setLoading(false);
    }
  }

  function handleSheetSelect(index: number) {
    setSelectedSheet(index);
    const autoMapped = autoMapColumns(sheets[index].headers);
    setMapping(autoMapped);
  }

  async function handleImport() {
    if (!file) return;

    const required = FIELD_MAPPINGS.filter((f) => f.required);
    const missing = required.filter((f) => !mapping[f.key]);
    if (missing.length > 0) {
      setError(
        `Required mappings missing: ${missing.map((f) => f.label).join(", ")}`
      );
      return;
    }

    setImporting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "import");
      formData.append("mapping", JSON.stringify(mapping));
      formData.append("sheetName", sheets[selectedSheet].name);

      const res = await fetch("/api/import", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Import failed");

      const data = await res.json();
      setResult(data);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setFile(null);
    setSheets([]);
    setSelectedSheet(0);
    setMapping({});
    setResult(null);
    setError("");
    setStep(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const currentSheet = sheets[selectedSheet];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import Data</h1>
        <p className="text-sm text-muted-foreground">
          Import inventory data from Excel files
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {["Upload File", "Select Sheet", "Map Columns", "Results"].map(
          (label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step > i + 1
                    ? "bg-green-100 text-green-700"
                    : step === i + 1
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-sm ${step === i + 1 ? "font-medium" : "text-muted-foreground"}`}
              >
                {label}
              </span>
              {i < 3 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          )
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-6 rounded-full bg-muted p-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">Upload Excel File</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Supports .xlsx and .xls files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              {loading ? "Reading file..." : "Choose File"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Sheet selection */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Select Sheet — {file?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {sheets.map((sheet, i) => (
                <button
                  key={sheet.name}
                  onClick={() => handleSheetSelect(i)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selectedSheet === i
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{sheet.name}</span>
                    <Badge variant="secondary">{sheet.totalRows} rows</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sheet.headers.length} columns:{" "}
                    {sheet.headers.slice(0, 4).join(", ")}
                    {sheet.headers.length > 4 && "..."}
                  </p>
                </button>
              ))}
            </div>

            {/* Preview */}
            {currentSheet && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  Data Preview (first 5 rows)
                </h3>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {currentSheet.headers.map((h, i) => (
                          <th
                            key={i}
                            className="whitespace-nowrap px-3 py-2 text-left font-medium"
                          >
                            {String(h)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentSheet.sampleRows.map((row, i) => (
                        <tr key={i} className="border-b">
                          {currentSheet.headers.map((_, j) => (
                            <td
                              key={j}
                              className="max-w-[200px] truncate whitespace-nowrap px-3 py-1.5"
                            >
                              {String((row as unknown[])[j] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={reset}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Map Columns
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Column Mapping */}
      {step === 3 && currentSheet && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Map Columns — {currentSheet.name} ({currentSheet.totalRows} rows)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Map your Excel columns to system fields. Auto-detected mappings
              are pre-filled.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {FIELD_MAPPINGS.map((field) => (
                <div
                  key={field.key}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <label className="text-sm font-medium">
                    {field.label}
                    {field.required && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                  </label>
                  <select
                    className="w-48 rounded-md border bg-background px-2 py-1 text-sm"
                    value={mapping[field.key] || ""}
                    onChange={(e) =>
                      setMapping((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  >
                    <option value="">— Skip —</option>
                    {currentSheet.headers.map((h) => (
                      <option key={String(h)} value={String(h)}>
                        {String(h)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Mapping summary */}
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-sm font-medium">Mapping Summary</p>
              <p className="text-xs text-muted-foreground">
                {Object.values(mapping).filter(Boolean).length} of{" "}
                {currentSheet.headers.length} columns mapped •{" "}
                {currentSheet.totalRows} rows will be processed
              </p>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {importing ? "Importing..." : "Start Import"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {step === 4 && result && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-green-100 p-3">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold">Import Complete</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Processed {result.total} rows from{" "}
                {sheets[selectedSheet]?.name}
              </p>
            </div>

            <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-4">
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-2xl font-bold text-green-700">
                  {result.imported}
                </p>
                <p className="text-xs text-green-600">New Items</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {result.updated}
                </p>
                <p className="text-xs text-blue-600">Updated</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-2xl font-bold text-gray-700">
                  {result.skipped}
                </p>
                <p className="text-xs text-gray-600">Skipped</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mx-auto mt-6 max-w-lg">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {result.errors.length} Errors
                </h3>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border bg-red-50 p-3">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600">
                      Row {err.row} ({err.code}): {err.error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-center gap-3">
              <Button variant="outline" onClick={reset}>
                Import Another File
              </Button>
              <a href="/inventory">
                <Button>View Inventory</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
