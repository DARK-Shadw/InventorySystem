import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const includeInactive = request.nextUrl.searchParams.get("all") === "true";
  const locations = await prisma.location.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { requisitions: true } } },
  });
  return NextResponse.json(locations);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "STORE_MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { name, type, region, description } = body;

  if (!name || !type) {
    return NextResponse.json(
      { error: "Name and type are required" },
      { status: 400 }
    );
  }

  const location = await prisma.location.create({
    data: {
      name,
      type,
      region: region || null,
      description: description || null,
    },
  });

  return NextResponse.json(location, { status: 201 });
}
