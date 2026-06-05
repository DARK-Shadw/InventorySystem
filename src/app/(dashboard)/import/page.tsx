"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Check,
  TriangleAlert,
  Loader2,
  Plus,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { PageHead, Pill, SelectControl } from "@/components/safeen/ui";

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

const STEPS = ["Upload", "Select sheet", "Map columns", "Run"];

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
        setMapping(autoMapColumns(data.sheets[0].headers));
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
    setMapping(autoMapColumns(sheets[index].headers));
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
  const mappedCount = Object.values(mapping).filter(Boolean).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHead
        eyebrow="Bulk operations"
        title="Import items"
        sub="Import inventory from an Excel workbook in four steps."
      />

      {/* stepper */}
      <div className="stepper shrink-0">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = step > n ? "done" : step === n ? "on" : "";
          return (
            <div key={label} className="contents">
              <div className={`step ${state}`}>
                <span className="n">
                  {step > n ? <Check strokeWidth={3} /> : n}
                </span>
                <span className="lbl">{label}</span>
              </div>
              {i < STEPS.length - 1 && <span className="step-line" />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 flex shrink-0 items-center gap-2 rounded-[0.65rem] bg-bad-bg px-3 py-2.5 text-[0.82rem] text-bad">
          <TriangleAlert className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* stage — header + stepper stay fixed above; each panel scrolls inside */}
      <div className="flex min-h-0 flex-1 flex-col">

      {/* Step 1 — upload */}
      {step === 1 && (
        <div className="panel">
          <div className="panel-body">
            <div
              className="drop"
              onClick={() => !loading && fileInputRef.current?.click()}
            >
              <div className="di">
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Upload strokeWidth={1.7} />
                )}
              </div>
              <b>
                {loading ? "Reading workbook…" : "Drop your .xlsx file here"}
              </b>
              <span>or click to browse — .xlsx, .xls up to 10MB</span>
            </div>
            <div className="navbtns">
              <span className="flex-1" />
              <button
                className="btn primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileSpreadsheet />
                )}
                Choose file
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — select sheet */}
      {step === 2 && (
        <div className="panel flex min-h-0 flex-1 flex-col">
          <div className="panel-body flex min-h-0 flex-1 flex-col">
            <div className="sheetlist shrink-0">
              {sheets.map((sheet, i) => (
                <button
                  key={sheet.name}
                  className={`sheetopt ${selectedSheet === i ? "on" : ""}`}
                  onClick={() => handleSheetSelect(i)}
                >
                  <span className="si">
                    <FileSpreadsheet strokeWidth={1.8} />
                  </span>
                  <div>
                    <b className="text-[0.9rem] font-semibold">{sheet.name}</b>
                    <div className="sub text-[0.78rem] text-subtle">
                      {sheet.totalRows} rows · {sheet.headers.length} columns
                    </div>
                  </div>
                  <Pill tone="grey" className="ml-auto">
                    {sheet.headers.length} cols
                  </Pill>
                </button>
              ))}
            </div>

            {currentSheet && (
              <>
                <div className="mt-5 shrink-0 text-[0.8rem] font-semibold uppercase tracking-[0.03em] text-faint">
                  Data preview — first {currentSheet.sampleRows.length} rows
                </div>
                <div className="tablewrap safeen-scroll mt-2 min-h-0 flex-1 overflow-auto">
                  <table className="tbl">
                    <thead>
                      <tr>
                        {currentSheet.headers.map((h, i) => (
                          <th key={i}>{String(h)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentSheet.sampleRows.map((row, i) => (
                        <tr key={i} style={{ cursor: "default" }}>
                          {currentSheet.headers.map((_, j) => (
                            <td key={j} className="max-w-[200px] truncate">
                              {String((row as unknown[])[j] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="navbtns shrink-0">
              <button className="btn" onClick={reset}>
                <ChevronLeft />
                Back
              </button>
              <span className="flex-1" />
              <button className="btn primary" onClick={() => setStep(3)}>
                Map columns
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — map columns */}
      {step === 3 && currentSheet && (
        <div className="panel flex min-h-0 flex-1 flex-col">
          <div className="panel-body flex min-h-0 flex-1 flex-col">
            <div className="mb-3 shrink-0 text-[0.85rem] text-subtle">
              Map spreadsheet columns to SAFEEN fields. Auto-detected mappings
              are pre-filled.
            </div>

            <div className="safeen-scroll grid min-h-0 flex-1 content-start gap-x-8 overflow-y-auto pr-1 sm:grid-cols-2">
              {FIELD_MAPPINGS.map((field) => (
                <div key={field.key} className="maprow">
                  <div className="text-[0.86rem] font-medium">
                    {field.label}
                    {field.required && <span className="text-brand"> *</span>}
                  </div>
                  <div className="arr">
                    <ArrowRight />
                  </div>
                  <SelectControl
                    variant="inp"
                    value={mapping[field.key] || ""}
                    onChange={(e) =>
                      setMapping((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  >
                    <option value="">— Not mapped —</option>
                    {currentSheet.headers.map((h) => (
                      <option key={String(h)} value={String(h)}>
                        {String(h)}
                      </option>
                    ))}
                  </SelectControl>
                </div>
              ))}
            </div>

            <div className="mt-4 shrink-0 rounded-[0.6rem] border border-line-soft bg-field p-3">
              <p className="text-[0.85rem] font-medium text-ink">
                Mapping summary
              </p>
              <p className="text-[0.78rem] text-subtle">
                {mappedCount} of {currentSheet.headers.length} columns mapped ·{" "}
                {currentSheet.totalRows} rows will be processed
              </p>
            </div>

            <div className="navbtns shrink-0">
              <button className="btn" onClick={() => setStep(2)}>
                <ChevronLeft />
                Back
              </button>
              <span className="flex-1" />
              <button
                className="btn primary"
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload />
                )}
                Run import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4 — results */}
      {step === 4 && result && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="result-cards shrink-0">
            <div className="mini">
              <div className="ml">
                <span className="ic tint-green">
                  <Plus strokeWidth={2} />
                </span>
                New items
              </div>
              <div className="mv">{result.imported}</div>
            </div>
            <div className="mini">
              <div className="ml">
                <span className="ic tint-blue">
                  <RefreshCw strokeWidth={2} />
                </span>
                Updated
              </div>
              <div className="mv">{result.updated}</div>
            </div>
            <div className="mini">
              <div className="ml">
                <span className="ic tint-amber">
                  <TriangleAlert strokeWidth={2} />
                </span>
                Skipped
              </div>
              <div className="mv">{result.skipped}</div>
            </div>
          </div>

          <div className="panel flex min-h-0 flex-1 flex-col">
            <div className="panel-head shrink-0">
              <h2>Row errors</h2>
              <Pill tone={result.errors.length ? "red" : "green"} className="ml-2">
                {result.errors.length}
              </Pill>
            </div>
            {result.errors.length === 0 ? (
              <div className="panel-body">
                <p className="text-[0.85rem] text-subtle">
                  No row errors — processed {result.total} rows from{" "}
                  {sheets[selectedSheet]?.name}.
                </p>
              </div>
            ) : (
              <div className="safeen-scroll min-h-0 flex-1 overflow-y-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: "4rem" }}>Row</th>
                      <th>Code</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((err, i) => (
                      <tr key={i} style={{ cursor: "default" }}>
                        <td className="tnum">{err.row}</td>
                        <td className="cellcode">{err.code || "—"}</td>
                        <td>{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="navbtns shrink-0">
            <button className="btn" onClick={reset}>
              <Upload />
              Import another file
            </button>
            <span className="flex-1" />
            <a className="btn primary" href="/inventory">
              View inventory
              <ChevronRight />
            </a>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
