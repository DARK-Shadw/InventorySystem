import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RequisitionStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export async function GET() {
  const [totalItems, allInventory, recentRequisitions] = await Promise.all([
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
            averageCost: true,
            status: true,
          },
        },
      },
      where: { item: { status: "ACTIVE" } },
    }),

    prisma.requisition.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      include: {
        department: { select: { name: true } },
        requester: { select: { name: true } },
        project: { select: { name: true, code: true } },
        location: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  // Total stock value on hand = sum(balance * average cost)
  const stockValue = allInventory.reduce(
    (sum, inv) => sum + inv.currentBalance * Number(inv.item.averageCost),
    0
  );

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

  const pendingRequisitions = await prisma.requisition.count({
    where: {
      status: {
        in: [
          RequisitionStatus.SUBMITTED,
          RequisitionStatus.DEPT_APPROVED,
          RequisitionStatus.STORE_REVIEWING,
        ],
      },
    },
  });

  return NextResponse.json({
    stats: {
      totalItems,
      stockValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      pendingRequisitions,
    },
    lowStockAlerts,
    recentRequisitions: recentRequisitions.map((r) => ({
      id: r.id,
      requisitionNumber: r.requisitionNumber,
      department: r.department.name,
      requester: r.requester.name,
      project: r.project?.name ?? null,
      location: r.location?.name ?? null,
      itemCount: r._count.items,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
  });
}
