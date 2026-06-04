import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["STORE_MANAGER", "STORE_STAFF", "SUPER_ADMIN"].includes(session.role)) {
    return NextResponse.json(
      { error: "Only store staff can issue items" },
      { status: 403 }
    );
  }

  const { items } = await request.json();
  // items: [{ requisitionItemId, quantityIssued }]

  if (!items || items.length === 0) {
    return NextResponse.json(
      { error: "No items to issue" },
      { status: 400 }
    );
  }

  const requisition = await prisma.requisition.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!requisition) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!["APPROVED", "PARTIALLY_ISSUED"].includes(requisition.status)) {
    return NextResponse.json(
      { error: "Requisition must be approved before issuing" },
      { status: 400 }
    );
  }

  const storeroom = await prisma.storeroom.findUnique({
    where: { code: "SSMAIN" },
  });

  if (!storeroom) {
    return NextResponse.json(
      { error: "Storeroom not found" },
      { status: 500 }
    );
  }

  const errors: string[] = [];

  for (const issuance of items as { requisitionItemId: string; quantityIssued: number }[]) {
    const reqItem = requisition.items.find((i) => i.id === issuance.requisitionItemId);
    if (!reqItem) {
      errors.push(`Item ${issuance.requisitionItemId} not found in requisition`);
      continue;
    }

    if (issuance.quantityIssued <= 0) continue;

    const maxIssuable = reqItem.quantityRequired - reqItem.quantityIssued;
    const qtyToIssue = Math.min(issuance.quantityIssued, maxIssuable);

    if (qtyToIssue <= 0) continue;

    // Check and update inventory
    const inventory = await prisma.inventory.findFirst({
      where: { itemId: reqItem.itemId, storeroomId: storeroom.id },
    });

    if (!inventory || inventory.currentBalance < qtyToIssue) {
      errors.push(
        `Insufficient stock for item ${reqItem.itemId}: need ${qtyToIssue}, have ${inventory?.currentBalance || 0}`
      );
      continue;
    }

    // Deduct from inventory
    await prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        currentBalance: { decrement: qtyToIssue },
        availableBalance: { decrement: qtyToIssue },
      },
    });

    // Update requisition item
    const newIssuedTotal = reqItem.quantityIssued + qtyToIssue;
    await prisma.requisitionItem.update({
      where: { id: reqItem.id },
      data: {
        quantityIssued: newIssuedTotal,
        status:
          newIssuedTotal >= reqItem.quantityRequired
            ? "ISSUED"
            : "PARTIALLY_ISSUED",
      },
    });

    // Record transaction
    const updatedInventory = await prisma.inventory.findFirst({
      where: { itemId: reqItem.itemId, storeroomId: storeroom.id },
    });

    await prisma.inventoryTransaction.create({
      data: {
        itemId: reqItem.itemId,
        storeroomId: storeroom.id,
        type: "ISSUED",
        quantity: -qtyToIssue,
        balanceAfter: updatedInventory?.currentBalance || 0,
        referenceType: "REQUISITION",
        referenceId: requisition.id,
        performedById: session.userId,
        notes: `Issued for requisition ${requisition.requisitionNumber}`,
      },
    });
  }

  // Determine overall requisition status
  const updatedItems = await prisma.requisitionItem.findMany({
    where: { requisitionId: id },
  });

  const allIssued = updatedItems.every((i) => i.quantityIssued >= i.quantityRequired);
  const anyIssued = updatedItems.some((i) => i.quantityIssued > 0);

  let newStatus = requisition.status;
  if (allIssued) newStatus = "ISSUED";
  else if (anyIssued) newStatus = "PARTIALLY_ISSUED";

  const updated = await prisma.requisition.update({
    where: { id },
    data: { status: newStatus as typeof requisition.status },
    include: {
      requester: { select: { name: true } },
      department: { select: { code: true, name: true } },
      items: {
        include: {
          item: { select: { itemCode: true, description: true } },
        },
      },
    },
  });

  return NextResponse.json({
    requisition: updated,
    errors: errors.length > 0 ? errors : undefined,
  });
}
