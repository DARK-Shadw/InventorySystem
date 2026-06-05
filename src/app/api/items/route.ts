import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const commodityGroupId = searchParams.get("commodityGroupId") || "";
  const sortBy = searchParams.get("sortBy") || "itemCode";
  const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { itemCode: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { classDescription: { contains: search, mode: "insensitive" } },
      { manufacturer: { contains: search, mode: "insensitive" } },
      { partNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (commodityGroupId) {
    where.commodityGroupId = commodityGroupId;
  }

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      include: {
        commodityGroup: true,
        inventoryRecords: {
          include: { storeroom: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.item.count({ where }),
  ]);

  return NextResponse.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    itemCode,
    description,
    classDescription,
    manufacturer,
    partNumber,
    orderUnit,
    issueUnit,
    reorderPoint,
    economicOrderQty,
    leadTimeDays,
    averageCost,
    criticality,
    isConsumable,
    isConsignment,
    inspectOnReceipt,
    isSparePart,
    lotType,
    itemSet,
    binLocation,
    status,
    commodityGroupId,
    initialBalance,
    storeroomCode,
  } = body;

  const existing = await prisma.item.findUnique({ where: { itemCode } });
  if (existing) {
    return NextResponse.json(
      { error: `Item with code ${itemCode} already exists` },
      { status: 400 }
    );
  }

  const item = await prisma.item.create({
    data: {
      itemCode,
      description,
      classDescription: classDescription || null,
      manufacturer: manufacturer || null,
      partNumber: partNumber || null,
      orderUnit: orderUnit || "Each",
      issueUnit: issueUnit || "Each",
      reorderPoint: reorderPoint || 0,
      economicOrderQty: economicOrderQty || 0,
      leadTimeDays: leadTimeDays || 0,
      averageCost: averageCost || 0,
      criticality: criticality || 3,
      isConsumable: isConsumable ?? true,
      isConsignment: isConsignment ?? false,
      inspectOnReceipt: inspectOnReceipt ?? true,
      isSparePart: isSparePart ?? false,
      lotType: lotType || "NOLOT",
      itemSet: itemSet || null,
      binLocation: binLocation || null,
      status: status || "ACTIVE",
      commodityGroupId: commodityGroupId || null,
    },
    include: {
      commodityGroup: true,
      inventoryRecords: { include: { storeroom: true } },
    },
  });

  const startBalance = Math.trunc(Number(initialBalance) || 0);
  if (startBalance > 0) {
    // Resolve a storeroom: requested code → SSMAIN → any existing → create one.
    let storeroom =
      (await prisma.storeroom.findUnique({
        where: { code: storeroomCode || "SSMAIN" },
      })) ?? (await prisma.storeroom.findFirst());

    if (!storeroom) {
      storeroom = await prisma.storeroom.create({
        data: {
          code: "SSMAIN",
          name: "Main Store - Safeen Survey & Subsea",
          site: "SS",
        },
      });
    }

    await prisma.inventory.create({
      data: {
        itemId: item.id,
        storeroomId: storeroom.id,
        currentBalance: startBalance,
        availableBalance: startBalance,
      },
    });

    // Return the item WITH the freshly created stock record.
    const withStock = await prisma.item.findUnique({
      where: { id: item.id },
      include: {
        commodityGroup: true,
        inventoryRecords: { include: { storeroom: true } },
      },
    });
    return NextResponse.json(withStock ?? item, { status: 201 });
  }

  return NextResponse.json(item, { status: 201 });
}
