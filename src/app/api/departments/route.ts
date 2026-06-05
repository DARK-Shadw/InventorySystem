import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const departments = await prisma.department.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { users: true, requisitions: true } } },
  });
  return NextResponse.json(departments);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "STORE_MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { code, name, description, isStore } = body;

  if (!code || !name) {
    return NextResponse.json(
      { error: "Code and name are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.department.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A department with this code already exists" },
      { status: 400 }
    );
  }

  const department = await prisma.department.create({
    data: {
      code: code.toUpperCase(),
      name,
      description: description || null,
      isStore: Boolean(isStore),
    },
  });

  return NextResponse.json(department, { status: 201 });
}
