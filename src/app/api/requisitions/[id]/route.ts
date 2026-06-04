import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const requisition = await prisma.requisition.findUnique({
    where: { id },
    include: {
      requester: { select: { name: true, email: true, badgeNumber: true } },
      department: { select: { code: true, name: true } },
      project: { select: { code: true, name: true } },
      location: { select: { name: true, type: true, region: true } },
      items: {
        include: {
          item: {
            select: {
              itemCode: true,
              description: true,
              classDescription: true,
              issueUnit: true,
              inventoryRecords: {
                select: { currentBalance: true },
              },
            },
          },
        },
      },
      approvals: {
        include: {
          approver: { select: { name: true, role: true } },
        },
        orderBy: { actedAt: "asc" },
      },
    },
  });

  if (!requisition) {
    return NextResponse.json({ error: "Requisition not found" }, { status: 404 });
  }

  return NextResponse.json(requisition);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "submit") {
    const req = await prisma.requisition.findUnique({ where: { id } });
    if (!req || req.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Can only submit draft requisitions" },
        { status: 400 }
      );
    }

    const updated = await prisma.requisition.update({
      where: { id },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "cancel") {
    const req = await prisma.requisition.findUnique({ where: { id } });
    if (!req || !["DRAFT", "SUBMITTED"].includes(req.status)) {
      return NextResponse.json(
        { error: "Cannot cancel this requisition" },
        { status: 400 }
      );
    }

    const updated = await prisma.requisition.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
