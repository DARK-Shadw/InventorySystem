import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeRules = await prisma.alertRule.findMany({
    where: { isActive: true },
    include: { item: true },
  });

  const adminUsers = await prisma.user.findMany({
    where: {
      role: { in: ["SUPER_ADMIN", "STORE_MANAGER", "STORE_STAFF"] },
      status: "ACTIVE",
    },
    select: { id: true },
  });

  let alertsGenerated = 0;

  for (const rule of activeRules) {
    if (rule.itemId) {
      // Item-specific rule
      const inventory = await prisma.inventory.findFirst({
        where: { itemId: rule.itemId },
      });

      const balance = inventory?.currentBalance ?? 0;
      const threshold = rule.threshold ?? rule.item?.reorderPoint ?? 0;
      let shouldAlert = false;
      let title = "";
      let message = "";

      if (rule.alertType === "OUT_OF_STOCK" && balance === 0) {
        shouldAlert = true;
        title = `Out of Stock: ${rule.item!.itemCode}`;
        message = `${rule.item!.description} has zero stock.`;
      } else if (rule.alertType === "LOW_STOCK" && balance > 0 && balance <= threshold) {
        shouldAlert = true;
        title = `Low Stock: ${rule.item!.itemCode}`;
        message = `${rule.item!.description} has ${balance} units remaining (threshold: ${threshold}).`;
      } else if (rule.alertType === "REORDER_POINT" && balance <= threshold) {
        shouldAlert = true;
        title = `Reorder Point: ${rule.item!.itemCode}`;
        message = `${rule.item!.description} has ${balance} units, at or below reorder point of ${threshold}.`;
      }

      if (shouldAlert) {
        for (const user of adminUsers) {
          const existing = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              alertRuleId: rule.id,
              isRead: false,
            },
          });
          if (!existing) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                alertRuleId: rule.id,
                title,
                message,
              },
            });
            alertsGenerated++;
          }
        }
      }
    } else {
      // Global rule — check all items
      const allInventory = await prisma.inventory.findMany({
        include: { item: { select: { id: true, itemCode: true, description: true, reorderPoint: true, status: true } } },
        where: { item: { status: "ACTIVE" } },
      });

      for (const inv of allInventory) {
        const threshold = rule.threshold ?? inv.item.reorderPoint;
        let shouldAlert = false;
        let title = "";
        let message = "";

        if (rule.alertType === "OUT_OF_STOCK" && inv.currentBalance === 0) {
          shouldAlert = true;
          title = `Out of Stock: ${inv.item.itemCode}`;
          message = `${inv.item.description} has zero stock.`;
        } else if (rule.alertType === "LOW_STOCK" && inv.currentBalance > 0 && inv.currentBalance <= threshold) {
          shouldAlert = true;
          title = `Low Stock: ${inv.item.itemCode}`;
          message = `${inv.item.description} has ${inv.currentBalance} units (threshold: ${threshold}).`;
        } else if (rule.alertType === "REORDER_POINT" && inv.currentBalance <= threshold) {
          shouldAlert = true;
          title = `Reorder Point: ${inv.item.itemCode}`;
          message = `${inv.item.description} has ${inv.currentBalance} units, at or below ROP of ${threshold}.`;
        }

        if (shouldAlert) {
          for (const user of adminUsers) {
            const existing = await prisma.notification.findFirst({
              where: {
                userId: user.id,
                alertRuleId: rule.id,
                title,
                isRead: false,
              },
            });
            if (!existing) {
              await prisma.notification.create({
                data: {
                  userId: user.id,
                  alertRuleId: rule.id,
                  title,
                  message,
                },
              });
              alertsGenerated++;
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ alertsGenerated });
}
