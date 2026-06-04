import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const rules = await prisma.alertRule.findMany({
    include: {
      item: { select: { itemCode: true, description: true, reorderPoint: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rules);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "STORE_MANAGER", "STORE_STAFF"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { itemId, alertType, threshold } = await request.json();

  if (!alertType) {
    return NextResponse.json({ error: "Alert type is required" }, { status: 400 });
  }

  const rule = await prisma.alertRule.create({
    data: {
      itemId: itemId || null,
      alertType,
      threshold: threshold ?? null,
      createdById: session.userId,
    },
    include: {
      item: { select: { itemCode: true, description: true, reorderPoint: true } },
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(rule, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "STORE_MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await request.json();
  await prisma.alertRule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
