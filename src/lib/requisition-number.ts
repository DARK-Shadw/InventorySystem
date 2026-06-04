import { prisma } from "./prisma";

export async function generateRequisitionNumber(deptCode: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${deptCode}-${year}`;

  const latest = await prisma.requisition.findFirst({
    where: { requisitionNumber: { startsWith: prefix } },
    orderBy: { requisitionNumber: "desc" },
    select: { requisitionNumber: true },
  });

  let seq = 1;
  if (latest) {
    const parts = latest.requisitionNumber.split("-");
    const lastSeq = parseInt(parts[2] || "0");
    seq = lastSeq + 1;
  }

  return `${prefix}-${seq.toString().padStart(4, "0")}`;
}
