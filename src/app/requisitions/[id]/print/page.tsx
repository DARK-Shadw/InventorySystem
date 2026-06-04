import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";

export default async function PrintRequisitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const requisition = await prisma.requisition.findUnique({
    where: { id },
    include: {
      requester: { select: { name: true, badgeNumber: true } },
      department: { select: { code: true, name: true } },
      project: { select: { code: true, name: true } },
      location: { select: { name: true, type: true, region: true } },
      items: {
        include: {
          item: { select: { itemCode: true, description: true } },
        },
      },
      approvals: {
        include: { approver: { select: { name: true, role: true } } },
        orderBy: { actedAt: "asc" },
      },
    },
  });

  if (!requisition) notFound();

  const today = new Date(requisition.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <html>
      <head>
        <title>{requisition.requisitionNumber} — Print</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @page { size: A4; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; background: #fff; }
          .page { max-width: 210mm; margin: 0 auto; padding: 10mm; }

          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 2px solid #000; padding-bottom: 8px; }
          .header-left { font-size: 10px; color: #333; }
          .header-center { text-align: center; flex: 1; }
          .header-center h1 { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
          .header-right { text-align: right; font-size: 10px; color: #333; }

          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #000; margin-bottom: 12px; }
          .meta-row { display: flex; border-bottom: 1px solid #000; }
          .meta-row:last-child { border-bottom: none; }
          .meta-label { font-weight: bold; padding: 4px 8px; width: 140px; background: #f5f5f5; border-right: 1px solid #000; font-size: 10px; }
          .meta-value { padding: 4px 8px; flex: 1; font-size: 10px; }
          .meta-col { border-right: 1px solid #000; }
          .meta-col:last-child { border-right: none; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th, td { border: 1px solid #000; padding: 5px 8px; text-align: left; font-size: 10px; }
          th { background: #f5f5f5; font-weight: bold; text-align: center; }
          td.center { text-align: center; }
          td.desc { max-width: 300px; }

          .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; }
          .sig-block { text-align: center; }
          .sig-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 4px; font-size: 10px; }
          .sig-role { font-size: 9px; color: #666; margin-top: 2px; }

          .footer { margin-top: 20px; text-align: center; font-size: 8px; color: #999; border-top: 1px solid #ddd; padding-top: 8px; }

          .remark { font-size: 10px; margin-bottom: 12px; padding: 6px 8px; border: 1px solid #ccc; background: #fafafa; }

          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }

          .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 24px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; z-index: 100; }
          .print-btn:hover { background: #1d4ed8; }
        `,
          }}
        />
      </head>
      <body>
        <PrintButton />

        <div className="page">
          {/* Header */}
          <div className="header">
            <div className="header-left">
              <strong style={{ fontSize: "14px" }}>SAFEEN</strong>
              <br />
              SURVEY AND SUBSEA
              <br />
              <span style={{ fontSize: "8px" }}>
                {requisition.requisitionNumber}
              </span>
            </div>
            <div className="header-center">
              <h1>Main Store Internal Requisition</h1>
            </div>
            <div className="header-right">
              PART OF
              <br />
              <strong>AD PORTS GROUP</strong>
            </div>
          </div>

          {/* Meta Info */}
          <div className="meta-grid">
            <div className="meta-col">
              <div className="meta-row">
                <div className="meta-label">Requisition Number</div>
                <div className="meta-value">
                  {requisition.requisitionNumber}
                </div>
              </div>
              <div className="meta-row">
                <div className="meta-label">Project Name</div>
                <div className="meta-value">
                  {requisition.project
                    ? `${requisition.project.code} — ${requisition.project.name}`
                    : "—"}
                </div>
              </div>
              <div className="meta-row">
                <div className="meta-label">Request for</div>
                <div className="meta-value">{requisition.requester.name}</div>
              </div>
            </div>
            <div className="meta-col">
              <div className="meta-row">
                <div className="meta-label">Requisition Date</div>
                <div className="meta-value">{today}</div>
              </div>
              <div className="meta-row">
                <div className="meta-label">Location/Barge</div>
                <div className="meta-value">
                  {requisition.location
                    ? `${requisition.location.region || ""}/${requisition.location.name}`
                    : "—"}
                </div>
              </div>
              <div className="meta-row">
                <div className="meta-label">Badge No</div>
                <div className="meta-value">
                  {requisition.requester.badgeNumber || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {requisition.remarks && (
            <div className="remark">
              <strong>Remarks:</strong> {requisition.remarks}
            </div>
          )}

          {/* Items Table */}
          <table>
            <thead>
              <tr>
                <th style={{ width: "40px" }}>Item No</th>
                <th>Items Description</th>
                <th style={{ width: "60px" }}>Unit</th>
                <th style={{ width: "70px" }}>Quantity Required</th>
                <th style={{ width: "70px" }}>Quantity Issued</th>
                <th style={{ width: "100px" }}>Remark</th>
              </tr>
            </thead>
            <tbody>
              {requisition.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="center">{index + 1}</td>
                  <td className="desc">{item.item.description}</td>
                  <td className="center">{item.unit}</td>
                  <td className="center">{item.quantityRequired}</td>
                  <td className="center">
                    {item.quantityIssued > 0 ? item.quantityIssued : ""}
                  </td>
                  <td>{item.remarks || ""}</td>
                </tr>
              ))}
              {/* Empty rows to fill the table like the original form */}
              {Array.from({
                length: Math.max(0, 15 - requisition.items.length),
              }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td className="center">&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Approval Info */}
          {requisition.approvals.length > 0 && (
            <div className="remark">
              <strong>Approvals:</strong>{" "}
              {requisition.approvals.map((a) => (
                <span key={a.id}>
                  {a.approver.name} ({a.action}){a.comments ? ` — "${a.comments}"` : ""} |{" "}
                </span>
              ))}
            </div>
          )}

          {/* Signatures */}
          <div className="signatures">
            <div className="sig-block">
              <div className="sig-line">Requested By</div>
              <div className="sig-role">
                {requisition.requester.name}
                <br />
                {requisition.department.name}
              </div>
            </div>
            <div className="sig-block">
              <div className="sig-line">Approved By</div>
              <div className="sig-role">Department Head</div>
            </div>
            <div className="sig-block">
              <div className="sig-line">Issued By</div>
              <div className="sig-role">Store Department</div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            Safeen Survey & Subsea Services L.L.C. — Part of AD Ports Group —
            Abu Dhabi, U.A.E
            <br />
            Generated by Safeen Inventory Management System •{" "}
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </body>
    </html>
  );
}
