import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hash } from "bcryptjs";

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
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (body.email && body.email !== existing.email) {
    const dup = await prisma.user.findUnique({ where: { email: body.email } });
    if (dup) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
  }

  if (body.badgeNumber && body.badgeNumber !== existing.badgeNumber) {
    const dup = await prisma.user.findUnique({ where: { badgeNumber: body.badgeNumber } });
    if (dup) {
      return NextResponse.json({ error: "Badge number already in use" }, { status: 400 });
    }
  }

  const data: Record<string, unknown> = {};
  if (body.name) data.name = body.name;
  if (body.email) data.email = body.email;
  if (body.badgeNumber !== undefined) data.badgeNumber = body.badgeNumber || null;
  if (body.role) data.role = body.role;
  if (body.departmentId) data.departmentId = body.departmentId;
  if (body.status) data.status = body.status;
  if (body.password) data.passwordHash = await hash(body.password, 12);

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { department: { select: { code: true, name: true } } },
  });

  const { passwordHash: _, ...userWithoutPassword } = user;
  return NextResponse.json(userWithoutPassword);
}
