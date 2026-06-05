import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      commodityGroup: true,
      inventoryRecords: { include: { storeroom: true } },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (body.itemCode && body.itemCode !== existing.itemCode) {
    const duplicate = await prisma.item.findUnique({
      where: { itemCode: body.itemCode },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: `Item code ${body.itemCode} is already in use` },
        { status: 400 }
      );
    }
  }

  const item = await prisma.item.update({
    where: { id },
    data: {
      ...(body.itemCode && { itemCode: body.itemCode }),
      ...(body.description && { description: body.description }),
      ...(body.classDescription !== undefined && {
        classDescription: body.classDescription || null,
      }),
      ...(body.manufacturer !== undefined && {
        manufacturer: body.manufacturer || null,
      }),
      ...(body.partNumber !== undefined && {
        partNumber: body.partNumber || null,
      }),
      ...(body.orderUnit && { orderUnit: body.orderUnit }),
      ...(body.issueUnit && { issueUnit: body.issueUnit }),
      ...(body.reorderPoint !== undefined && {
        reorderPoint: body.reorderPoint,
      }),
      ...(body.economicOrderQty !== undefined && {
        economicOrderQty: body.economicOrderQty,
      }),
      ...(body.leadTimeDays !== undefined && {
        leadTimeDays: body.leadTimeDays,
      }),
      ...(body.averageCost !== undefined && { averageCost: body.averageCost }),
      ...(body.criticality !== undefined && { criticality: body.criticality }),
      ...(body.isConsumable !== undefined && {
        isConsumable: body.isConsumable,
      }),
      ...(body.isConsignment !== undefined && {
        isConsignment: body.isConsignment,
      }),
      ...(body.inspectOnReceipt !== undefined && {
        inspectOnReceipt: body.inspectOnReceipt,
      }),
      ...(body.isSparePart !== undefined && { isSparePart: body.isSparePart }),
      ...(body.lotType !== undefined && { lotType: body.lotType }),
      ...(body.itemSet !== undefined && { itemSet: body.itemSet || null }),
      ...(body.binLocation !== undefined && {
        binLocation: body.binLocation || null,
      }),
      ...(body.status && { status: body.status }),
      ...(body.commodityGroupId !== undefined && {
        commodityGroupId: body.commodityGroupId || null,
      }),
    },
    include: {
      commodityGroup: true,
      inventoryRecords: { include: { storeroom: true } },
    },
  });

  // Optional manual stock-balance set/adjust.
  if (body.stockBalance !== undefined && body.stockBalance !== null) {
    const bal = Math.max(0, Math.trunc(Number(body.stockBalance) || 0));
    const rec = await prisma.inventory.findFirst({ where: { itemId: id } });
    if (rec) {
      await prisma.inventory.update({
        where: { id: rec.id },
        data: { currentBalance: bal, availableBalance: bal },
      });
    } else if (bal > 0) {
      let storeroom =
        (await prisma.storeroom.findUnique({ where: { code: "SSMAIN" } })) ??
        (await prisma.storeroom.findFirst());
      if (!storeroom) {
        storeroom = await prisma.storeroom.create({
          data: {
            code: "SSMAIN",
            name: "Main Store - Safeen Survey & Subsea",
            site: "SS",
          },
        });
      }
      await prisma.inventory.create({
        data: {
          itemId: id,
          storeroomId: storeroom.id,
          currentBalance: bal,
          availableBalance: bal,
        },
      });
    }

    const fresh = await prisma.item.findUnique({
      where: { id },
      include: {
        commodityGroup: true,
        inventoryRecords: { include: { storeroom: true } },
      },
    });
    return NextResponse.json(fresh ?? item);
  }

  return NextResponse.json(item);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const hasTransactions = await prisma.inventoryTransaction.findFirst({
    where: { itemId: id },
  });

  if (hasTransactions) {
    await prisma.item.update({
      where: { id },
      data: { status: "INACTIVE" },
    });
    return NextResponse.json({ message: "Item deactivated (has transaction history)" });
  }

  await prisma.inventory.deleteMany({ where: { itemId: id } });
  await prisma.item.delete({ where: { id } });

  return NextResponse.json({ message: "Item deleted" });
}
