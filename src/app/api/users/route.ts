import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hash } from "bcryptjs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const departmentId = searchParams.get("departmentId") || "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { badgeNumber: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role) where.role = role;
  if (departmentId) where.departmentId = departmentId;

  const users = await prisma.user.findMany({
    where,
    include: { department: { select: { code: true, name: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    users.map(({ passwordHash, ...u }) => u)
  );
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "STORE_MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, name, badgeNumber, role, departmentId } = body;

  if (!email || !password || !name || !role || !departmentId) {
    return NextResponse.json(
      { error: "Email, password, name, role, and department are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 400 }
    );
  }

  if (badgeNumber) {
    const badgeExists = await prisma.user.findUnique({ where: { badgeNumber } });
    if (badgeExists) {
      return NextResponse.json(
        { error: "This badge number is already in use" },
        { status: 400 }
      );
    }
  }

  const passwordHash = await hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      badgeNumber: badgeNumber || null,
      role,
      departmentId,
    },
    include: { department: { select: { code: true, name: true } } },
  });

  const { passwordHash: _, ...userWithoutPassword } = user;
  return NextResponse.json(userWithoutPassword, { status: 201 });
}
