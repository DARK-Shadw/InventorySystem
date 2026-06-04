import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [
    totalItems,
    allInventory,
    recentRequisitions,
  ] = await Promise.all([
    prisma.item.count({ where: { status: "ACTIVE" } }),

    prisma.inventory.findMany({
      include: {
        item: {
          select: {
            id: true,
            itemCode: true,
            description: true,
            classDescription: true,
            reorderPoint: true,
            criticality: true,
            status: true,
          },
        },
      },
      where: { item: { status: "ACTIVE" } },
    }),

    prisma.requisition.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        department: { select: { name: true } },
        requester: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  const lowStockItems = allInventory.filter(
    (inv) =>
      inv.item.reorderPoint > 0 &&
      inv.currentBalance > 0 &&
      inv.currentBalance <= inv.item.reorderPoint
  );

  const outOfStockItems = allInventory.filter(
    (inv) => inv.currentBalance === 0
  );

  const lowStockAlerts = lowStockItems
    .sort((a, b) => {
      const ratioA = a.currentBalance / (a.item.reorderPoint || 1);
      const ratioB = b.currentBalance / (b.item.reorderPoint || 1);
      return ratioA - ratioB;
    })
    .slice(0, 8)
    .map((inv) => ({
      itemCode: inv.item.itemCode,
      description: inv.item.description,
      classDescription: inv.item.classDescription,
      currentBalance: inv.currentBalance,
      reorderPoint: inv.item.reorderPoint,
      criticality: inv.item.criticality,
    }));

  return NextResponse.json({
    stats: {
      totalItems,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      pendingRequisitions: recentRequisitions.filter(
        (r) => r.status === "SUBMITTED" || r.status === "DEPT_APPROVED"
      ).length,
    },
    lowStockAlerts,
    recentRequisitions: recentRequisitions.map((r) => ({
      id: r.id,
      requisitionNumber: r.requisitionNumber,
      department: r.department.name,
      requester: r.requester.name,
      itemCount: r._count.items,
      status: r.status,
      createdAt: r.createdAt,
    })),
  });
}
