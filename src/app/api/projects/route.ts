import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const includeInactive = request.nextUrl.searchParams.get("all") === "true";
  const projects = await prisma.project.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { code: "asc" },
    include: { _count: { select: { requisitions: true } } },
  });
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "STORE_MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { code, name, description } = body;

  if (!code || !name) {
    return NextResponse.json(
      { error: "Code and name are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.project.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json(
      { error: "A project with this code already exists" },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: { code, name, description: description || null },
  });

  return NextResponse.json(project, { status: 201 });
}
