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

  const { action, comments } = await request.json();

  if (!["APPROVED", "REJECTED"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const requisition = await prisma.requisition.findUnique({
    where: { id },
    include: { department: true },
  });

  if (!requisition) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowedStatuses = ["SUBMITTED", "DEPT_APPROVED", "STORE_REVIEWING"];
  if (!allowedStatuses.includes(requisition.status)) {
    return NextResponse.json(
      { error: "Requisition is not pending approval" },
      { status: 400 }
    );
  }

  // Determine approval level based on current status and user role
  let level = 1;
  let nextStatus = "";

  if (requisition.status === "SUBMITTED" && ["DEPT_HEAD", "SUPER_ADMIN"].includes(session.role)) {
    level = 1;
    nextStatus = action === "APPROVED" ? "DEPT_APPROVED" : "REJECTED";
  } else if (
    (requisition.status === "DEPT_APPROVED" || requisition.status === "SUBMITTED") &&
    ["STORE_MANAGER", "STORE_STAFF", "SUPER_ADMIN"].includes(session.role)
  ) {
    level = 2;
    nextStatus = action === "APPROVED" ? "APPROVED" : "REJECTED";
  } else {
    return NextResponse.json(
      { error: "You don't have permission to approve this requisition" },
      { status: 403 }
    );
  }

  await prisma.requisitionApproval.create({
    data: {
      requisitionId: id,
      approverId: session.userId,
      level,
      action,
      comments: comments || null,
    },
  });

  const updated = await prisma.requisition.update({
    where: { id },
    data: { status: nextStatus as typeof requisition.status },
    include: {
      requester: { select: { name: true } },
      department: { select: { code: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}
