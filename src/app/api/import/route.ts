import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

function cleanText(val: unknown): string {
  if (val == null) return "";
  let text = String(val);
  // Fix common encoding artifacts from Excel/CMMS systems
  text = text.replace(/Â /g, " "); // Â + non-breaking space
  text = text.replace(/Â/g, "");         // stray Â
  text = text.replace(/ /g, " ");        // non-breaking space
  text = text.replace(/‘|’/g, "'"); // smart single quotes
  text = text.replace(/“|”/g, '"'); // smart double quotes
  text = text.replace(/\r?\n/g, " ");
  text = text.replace(/\s{2,}/g, " ");
  return text.trim();
}

function cleanNumber(val: unknown): number {
  if (val == null) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

interface ColumnMapping {
  itemCode: string;
  description: string;
  classDescription?: string;
  manufacturer?: string;
  partNumber?: string;
  orderUnit?: string;
  issueUnit?: string;
  reorderPoint?: string;
  economicOrderQty?: string;
  leadTimeDays?: string;
  averageCost?: string;
  criticality?: string;
  isConsumable?: string;
  isConsignment?: string;
  commodityGroupCode?: string;
  commodityCode?: string;
  currentBalance?: string;
  availableBalance?: string;
  binLocation?: string;
  status?: string;
  storeroom?: string;
  itemSet?: string;
  lotType?: string;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const mappingJson = formData.get("mapping") as string | null;
  const sheetName = formData.get("sheetName") as string | null;
  const action = formData.get("action") as string;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });

  if (action === "preview") {
    const sheets = workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
      const headers = (data[0] || []) as string[];
      const sampleRows = data.slice(1, 6);
      const totalRows = data.length - 1;
      return { name, headers, sampleRows, totalRows };
    });
    return NextResponse.json({ sheets });
  }

  if (!mappingJson) {
    return NextResponse.json(
      { error: "Column mapping is required for import" },
      { status: 400 }
    );
  }

  const mapping: ColumnMapping = JSON.parse(mappingJson);

  if (!mapping.itemCode || !mapping.description) {
    return NextResponse.json(
      { error: "Item Code and Description mappings are required" },
      { status: 400 }
    );
  }

  const targetSheet = sheetName || workbook.SheetNames[0];
  const sheet = workbook.Sheets[targetSheet];
  if (!sheet) {
    return NextResponse.json({ error: "Sheet not found" }, { status: 400 });
  }

  const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

  const storeroom = await prisma.storeroom.findUnique({
    where: { code: "SSMAIN" },
  });

  let imported = 0;
  let skipped = 0;
  let updated = 0;
  const errors: { row: number; code: string; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const itemCode = cleanText(row[mapping.itemCode]);
    const description = cleanText(row[mapping.description]);

    if (!itemCode || !description) {
      skipped++;
      continue;
    }

    try {
      const existing = await prisma.item.findUnique({ where: { itemCode } });

      const itemData = {
        description,
        classDescription: mapping.classDescription
          ? cleanText(row[mapping.classDescription])
          : null,
        manufacturer: mapping.manufacturer
          ? cleanText(row[mapping.manufacturer])
          : null,
        partNumber: mapping.partNumber
          ? cleanText(row[mapping.partNumber])
          : null,
        orderUnit: mapping.orderUnit
          ? cleanText(row[mapping.orderUnit]) || "Each"
          : "Each",
        issueUnit: mapping.issueUnit
          ? cleanText(row[mapping.issueUnit]) || "Each"
          : "Each",
        reorderPoint: mapping.reorderPoint
          ? cleanNumber(row[mapping.reorderPoint])
          : 0,
        economicOrderQty: mapping.economicOrderQty
          ? cleanNumber(row[mapping.economicOrderQty])
          : 0,
        leadTimeDays: mapping.leadTimeDays
          ? cleanNumber(row[mapping.leadTimeDays])
          : 0,
        averageCost: mapping.averageCost
          ? cleanNumber(row[mapping.averageCost])
          : 0,
        criticality: mapping.criticality
          ? cleanNumber(row[mapping.criticality]) || 3
          : 3,
        isConsumable: mapping.isConsumable
          ? cleanText(row[mapping.isConsumable]).toUpperCase() === "Y"
          : true,
        isConsignment: mapping.isConsignment
          ? cleanText(row[mapping.isConsignment]).toUpperCase() === "Y"
          : false,
        binLocation: mapping.binLocation
          ? cleanText(row[mapping.binLocation]) || null
          : null,
        status: mapping.status
          ? (cleanText(row[mapping.status]).toUpperCase() as
              | "ACTIVE"
              | "INACTIVE"
              | "DISCONTINUED")
          : ("ACTIVE" as const),
        itemSet: mapping.itemSet
          ? cleanText(row[mapping.itemSet]) || null
          : null,
        lotType: mapping.lotType
          ? cleanText(row[mapping.lotType]) || "NOLOT"
          : "NOLOT",
      };

      if (existing) {
        await prisma.item.update({
          where: { itemCode },
          data: itemData,
        });
        updated++;
      } else {
        const newItem = await prisma.item.create({
          data: { itemCode, ...itemData },
        });

        const currentBal = mapping.currentBalance
          ? cleanNumber(row[mapping.currentBalance])
          : 0;
        const availableBal = mapping.availableBalance
          ? cleanNumber(row[mapping.availableBalance])
          : currentBal;

        if (storeroom) {
          await prisma.inventory.create({
            data: {
              itemId: newItem.id,
              storeroomId: storeroom.id,
              currentBalance: currentBal,
              availableBalance: availableBal,
            },
          });
        }

        imported++;
      }

      if (mapping.commodityGroupCode && mapping.commodityCode) {
        const groupCode = cleanText(row[mapping.commodityGroupCode]);
        const commCode = cleanText(row[mapping.commodityCode]);

        if (groupCode && commCode) {
          let group = await prisma.commodityGroup.findUnique({
            where: { code: groupCode },
          });

          if (!group) {
            group = await prisma.commodityGroup.create({
              data: {
                code: groupCode,
                commodityCode: commCode,
                name: groupCode,
              },
            });
          }

          await prisma.item.update({
            where: { itemCode },
            data: { commodityGroupId: group.id },
          });
        }
      }
    } catch (err) {
      errors.push({
        row: i + 2,
        code: itemCode,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    imported,
    updated,
    skipped,
    errors,
    total: rows.length,
  });
}
