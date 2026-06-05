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
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  if (body.code && body.code.toUpperCase() !== existing.code) {
    const dup = await prisma.department.findUnique({
      where: { code: body.code.toUpperCase() },
    });
    if (dup) {
      return NextResponse.json(
        { error: "Code already in use" },
        { status: 400 }
      );
    }
  }

  const data: Record<string, unknown> = {};
  if (body.code) data.code = body.code.toUpperCase();
  if (body.name) data.name = body.name;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.isStore !== undefined) data.isStore = Boolean(body.isStore);

  const department = await prisma.department.update({ where: { id }, data });
  return NextResponse.json(department);
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

  const existing = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { users: true, requisitions: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  if (existing._count.users > 0 || existing._count.requisitions > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot delete a department that still has users or requisitions assigned",
      },
      { status: 400 }
    );
  }

  await prisma.department.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
