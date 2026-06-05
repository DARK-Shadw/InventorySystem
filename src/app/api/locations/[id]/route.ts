import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "STORE_MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.name) data.name = body.name;
  if (body.type) data.type = body.type;
  if (body.region !== undefined) data.region = body.region || null;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  const location = await prisma.location.update({ where: { id }, data });
  return NextResponse.json(location);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const existing = await prisma.location.findUnique({
    where: { id },
    include: { _count: { select: { requisitions: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  if (existing._count.requisitions > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot delete a location with requisitions. Deactivate it instead.",
      },
      { status: 400 }
    );
  }

  await prisma.location.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
