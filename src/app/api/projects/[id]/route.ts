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
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (body.code && body.code !== existing.code) {
    const dup = await prisma.project.findUnique({ where: { code: body.code } });
    if (dup) {
      return NextResponse.json({ error: "Code already in use" }, { status: 400 });
    }
  }

  const data: Record<string, unknown> = {};
  if (body.code) data.code = body.code;
  if (body.name) data.name = body.name;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  const project = await prisma.project.update({ where: { id }, data });
  return NextResponse.json(project);
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

  const existing = await prisma.project.findUnique({
    where: { id },
    include: { _count: { select: { requisitions: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (existing._count.requisitions > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot delete a project with requisitions. Deactivate it instead.",
      },
      { status: 400 }
    );
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
