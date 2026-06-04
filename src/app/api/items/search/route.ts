import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const items = await prisma.item.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { itemCode: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { classDescription: { contains: q, mode: "insensitive" } },
        { partNumber: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      itemCode: true,
      description: true,
      classDescription: true,
      issueUnit: true,
      inventoryRecords: {
        select: { currentBalance: true },
      },
    },
    take: 10,
  });

  return NextResponse.json(
    items.map((item) => ({
      ...item,
      availableStock: item.inventoryRecords.reduce(
        (sum, r) => sum + r.currentBalance,
        0
      ),
    }))
  );
}
