import { NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/errors";
import { makeReceiptPdf } from "@/lib/pdf";
import { makeExcelBuffer } from "@/lib/excel";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const deny = requirePermission(auth.user!, "FEE", "READ");
  if (deny) return deny;

  const { id } = await ctx.params;
  const paymentId = Number(id);
  if (!Number.isFinite(paymentId)) return apiError("VALIDATION_ERROR", "Invalid payment id", 400);

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      feeType: true,
      obligation: {
        include: {
          period: true,
          household: true,
        },
      },
    },
  });

  if (!payment) return apiError("NOT_FOUND", "Payment not found", 404);

  const format = new URL(req.url).searchParams.get("format")?.toLowerCase() ?? "pdf";

  const household = payment.obligation.household;
  const period = payment.obligation.period;
  const generatedAt = new Date().toLocaleString("vi-VN");

  if (format === "xlsx") {
    const buffer = await makeExcelBuffer(
      `Biên lai ${payment.receiptNo}`,
      [
        { header: "Mục", key: "label", width: 20 },
        { header: "Giá trị", key: "value", width: 35 },
      ],
      [
        { label: "Số biên lai", value: payment.receiptNo },
        { label: "Ngày thu", value: new Date(payment.paidAt).toLocaleString("vi-VN") },
        { label: "Căn hộ", value: household.apartmentNo },
        { label: "Chủ hộ", value: household.ownerName || "-" },
        { label: "Khoản phí", value: payment.feeType.name },
        { label: "Kỳ", value: `${period.month}/${period.year}` },
        { label: "Số tiền", value: payment.paidAmount.toLocaleString("vi-VN") + " VND" },
        { label: "Phương thức", value: payment.method === "CASH" ? "Tiền mặt" : "Chuyển khoản" },
        { label: "Người thu", value: payment.collectorName },
        { label: "Người nộp", value: payment.payerName || "-" },
        { label: "SĐT người nộp", value: payment.payerPhone || "-" },
        { label: "Mã GD ngân hàng", value: payment.bankTxRef || "-" },
        { label: "Ghi chú", value: payment.note || "-" },
      ],
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=payment_receipt_${payment.receiptNo}.xlsx`,
      },
    });
  }

  const pdfBuffer = await makeReceiptPdf(
    `Biên lai ${payment.receiptNo}`,
    `Ngày in: ${generatedAt}`,
    [
      { label: "Số biên lai", value: payment.receiptNo },
      { label: "Ngày thu", value: new Date(payment.paidAt).toLocaleString("vi-VN") },
      { label: "Căn hộ", value: household.apartmentNo },
      { label: "Chủ hộ", value: household.ownerName || "-" },
      { label: "Khoản phí", value: payment.feeType.name },
      { label: "Kỳ", value: `${period.month}/${period.year}` },
      { label: "Số tiền", value: payment.paidAmount.toLocaleString("vi-VN") + " VND" },
      { label: "Phương thức", value: payment.method === "CASH" ? "Tiền mặt" : "Chuyển khoản" },
      { label: "Người thu", value: payment.collectorName },
      { label: "Người nộp", value: payment.payerName || "-" },
      { label: "SĐT người nộp", value: payment.payerPhone || "-" },
      { label: "Mã GD ngân hàng", value: payment.bankTxRef || "-" },
      { label: "Ghi chú", value: payment.note || "-" },
    ],
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=payment_receipt_${payment.receiptNo}.pdf`,
    },
  });
}
