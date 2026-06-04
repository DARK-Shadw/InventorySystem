import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateRequisitionNumber } from "@/lib/requisition-number";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") || "";
  const departmentId = searchParams.get("departmentId") || "";
  const search = searchParams.get("search") || "";

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;
  if (search) {
    where.OR = [
      { requisitionNumber: { contains: search, mode: "insensitive" } },
      { requester: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [requisitions, total] = await Promise.all([
    prisma.requisition.findMany({
      where,
      include: {
        requester: { select: { name: true, badgeNumber: true } },
        department: { select: { code: true, name: true } },
        project: { select: { code: true, name: true } },
        location: { select: { name: true, type: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.requisition.count({ where }),
  ]);

  return NextResponse.json({
    requisitions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { projectId, locationId, remarks, items } = body;

  if (!items || items.length === 0) {
    return NextResponse.json(
      { error: "At least one item is required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { department: true },
  });

  if (!user || !user.department) {
    return NextResponse.json(
      { error: "User department not found" },
      { status: 400 }
    );
  }

  const requisitionNumber = await generateRequisitionNumber(
    user.department.code
  );

  const requisition = await prisma.requisition.create({
    data: {
      requisitionNumber,
      status: "DRAFT",
      requesterId: user.id,
      departmentId: user.departmentId!,
      projectId: projectId || null,
      locationId: locationId || null,
      remarks: remarks || null,
      items: {
        create: items.map(
          (item: { itemId: string; quantityRequired: number; unit: string; remarks?: string }) => ({
            itemId: item.itemId,
            quantityRequired: item.quantityRequired,
            unit: item.unit || "Each",
            remarks: item.remarks || null,
          })
        ),
      },
    },
    include: {
      requester: { select: { name: true } },
      department: { select: { code: true, name: true } },
      items: { include: { item: { select: { itemCode: true, description: true } } } },
    },
  });

  return NextResponse.json(requisition, { status: 201 });
}
