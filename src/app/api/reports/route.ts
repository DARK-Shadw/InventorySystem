import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") || "inventory-summary";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  const dateFilter: Record<string, unknown> = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to + "T23:59:59");

  if (type === "inventory-summary") {
    const items = await prisma.item.findMany({
      where: { status: "ACTIVE" },
      include: {
        inventoryRecords: { select: { currentBalance: true, availableBalance: true } },
        commodityGroup: { select: { code: true, name: true } },
      },
      orderBy: { itemCode: "asc" },
    });

    const data = items.map((item) => {
      const balance = item.inventoryRecords.reduce((s, r) => s + r.currentBalance, 0);
      return {
        itemCode: item.itemCode,
        description: item.description,
        classDescription: item.classDescription,
        manufacturer: item.manufacturer,
        unit: item.issueUnit,
        currentBalance: balance,
        reorderPoint: item.reorderPoint,
        averageCost: Number(item.averageCost),
        totalValue: balance * Number(item.averageCost),
        status: balance === 0 ? "OUT_OF_STOCK" : balance <= item.reorderPoint ? "LOW_STOCK" : "IN_STOCK",
        criticality: item.criticality,
      };
    });

    const totalItems = data.length;
    const totalValue = data.reduce((s, d) => s + d.totalValue, 0);
    const outOfStock = data.filter((d) => d.status === "OUT_OF_STOCK").length;
    const lowStock = data.filter((d) => d.status === "LOW_STOCK").length;

    return NextResponse.json({
      type,
      summary: { totalItems, totalValue, outOfStock, lowStock },
      data,
    });
  }

  if (type === "consumption-by-department") {
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        type: "ISSUED",
        ...(from || to ? { createdAt: dateFilter } : {}),
      },
      include: {
        item: { select: { itemCode: true, description: true, averageCost: true } },
      },
    });

    // Get requisitions to map transactions to departments
    const requisitionIds = [
      ...new Set(transactions.filter((t) => t.referenceType === "REQUISITION").map((t) => t.referenceId!)),
    ];

    const requisitions = await prisma.requisition.findMany({
      where: { id: { in: requisitionIds } },
      include: { department: { select: { code: true, name: true } } },
    });

    const reqMap = new Map(requisitions.map((r) => [r.id, r]));

    const deptConsumption: Record<string, { department: string; code: string; itemsIssued: number; totalQty: number; totalValue: number }> = {};

    for (const tx of transactions) {
      const req = tx.referenceId ? reqMap.get(tx.referenceId) : null;
      const deptName = req?.department?.name || "Unknown";
      const deptCode = req?.department?.code || "UNK";
      const key = deptCode;

      if (!deptConsumption[key]) {
        deptConsumption[key] = { department: deptName, code: deptCode, itemsIssued: 0, totalQty: 0, totalValue: 0 };
      }

      deptConsumption[key].itemsIssued++;
      deptConsumption[key].totalQty += Math.abs(tx.quantity);
      deptConsumption[key].totalValue += Math.abs(tx.quantity) * Number(tx.item.averageCost);
    }

    return NextResponse.json({
      type,
      data: Object.values(deptConsumption).sort((a, b) => b.totalValue - a.totalValue),
    });
  }

  if (type === "low-stock") {
    // Start from items (not inventory rows) so items with no stock record
    // still count as 0 balance. Include anything out of stock OR at/below ROP.
    const items = await prisma.item.findMany({
      where: { status: "ACTIVE" },
      include: {
        inventoryRecords: { select: { currentBalance: true } },
      },
      orderBy: { itemCode: "asc" },
    });

    const rows = items
      .map((item) => ({
        item,
        balance: item.inventoryRecords.reduce((s, r) => s + r.currentBalance, 0),
      }))
      .filter(({ item, balance }) => balance <= 0 || balance <= item.reorderPoint)
      .map(({ item, balance }) => {
        const suggestedOrder = item.economicOrderQty || item.reorderPoint || 0;
        return {
          itemCode: item.itemCode,
          description: item.description,
          classDescription: item.classDescription,
          currentBalance: balance,
          reorderPoint: item.reorderPoint,
          suggestedQty: suggestedOrder,
          leadTimeDays: item.leadTimeDays,
          estimatedCost: suggestedOrder * Number(item.averageCost),
          criticality: item.criticality,
          status: balance <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
        };
      })
      .sort(
        (a, b) =>
          a.criticality - b.criticality || a.currentBalance - b.currentBalance
      );

    const critical = rows.filter((r) => r.criticality === 1).length;
    const suggestedOrderValue = rows.reduce((s, r) => s + r.estimatedCost, 0);
    const avgLeadTimeDays = rows.length
      ? Math.round(rows.reduce((s, r) => s + r.leadTimeDays, 0) / rows.length)
      : 0;

    return NextResponse.json({
      type,
      summary: {
        itemsBelowRop: rows.length,
        critical,
        suggestedOrderValue,
        avgLeadTimeDays,
      },
      data: rows,
    });
  }

  if (type === "requisition-history") {
    const requisitions = await prisma.requisition.findMany({
      where: {
        ...(from || to ? { createdAt: dateFilter } : {}),
      },
      include: {
        requester: { select: { name: true } },
        department: { select: { code: true, name: true } },
        project: { select: { code: true } },
        location: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const statusCounts: Record<string, number> = {};
    for (const r of requisitions) {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }

    return NextResponse.json({
      type,
      summary: { total: requisitions.length, byStatus: statusCounts },
      data: requisitions.map((r) => ({
        requisitionNumber: r.requisitionNumber,
        status: r.status,
        department: r.department.name,
        requester: r.requester.name,
        project: r.project?.code || "",
        location: r.location?.name || "",
        itemCount: r._count.items,
        date: r.createdAt,
      })),
    });
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}
