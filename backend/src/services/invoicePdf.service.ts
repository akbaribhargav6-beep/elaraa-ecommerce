import fs from 'node:fs/promises';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import type { Invoice, InvoiceItem, Prisma } from '@prisma/client';
import { env } from '../config/env';
import type { InvoiceCompanySnapshotDTO } from '@elaraa/shared';

type InvoiceForPdf = Invoice & { items: InvoiceItem[]; order?: { orderNumber: string } | null };

const INK = '#2B2620';
const MUTED = '#8A8072';
const GOLD = '#A8823D';
const PAGE_MARGIN = 50;

function money(n: number | string | Prisma.Decimal): string {
  const num = Number(n);
  return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Local storage returns a relative /uploads/... path; Cloudinary (and any
// other remote provider) returns a full URL — this is the one place that
// needs to know the difference in order to get raw image bytes for pdfkit.
async function loadLogoBuffer(logoUrl: string | null): Promise<Buffer | null> {
  if (!logoUrl) return null;
  try {
    if (/^https?:\/\//i.test(logoUrl)) {
      const res = await fetch(logoUrl);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
    const relative = logoUrl.replace(/^\/?uploads\//, '');
    const fullPath = path.join(process.cwd(), env.UPLOAD_DIR, relative);
    return await fs.readFile(fullPath);
  } catch {
    // A broken/unreachable logo must never fail invoice generation — the
    // PDF just renders without one.
    return null;
  }
}

const COLS = [
  { key: 'idx', label: '#', width: 22, align: 'left' as const },
  { key: 'name', label: 'Product', width: 158, align: 'left' as const },
  { key: 'sku', label: 'SKU', width: 70, align: 'left' as const },
  { key: 'qty', label: 'Qty', width: 35, align: 'right' as const },
  { key: 'price', label: 'Unit Price', width: 68, align: 'right' as const },
  { key: 'discount', label: 'Discount', width: 65, align: 'right' as const },
  { key: 'total', label: 'Line Total', width: 77, align: 'right' as const },
];
const TABLE_WIDTH = COLS.reduce((s, c) => s + c.width, 0);

function colX(index: number): number {
  let x = PAGE_MARGIN;
  for (let i = 0; i < index; i++) x += COLS[i].width;
  return x;
}

// The single reusable invoice PDF template — every invoice in the system
// (order-based or manually created) is rendered by this one function, so
// there is exactly one visual design to keep "professional and print
// ready" rather than two templates that can drift apart.
export async function renderInvoicePdf(invoice: InvoiceForPdf): Promise<Buffer> {
  const company = invoice.companySnapshot as unknown as InvoiceCompanySnapshotDTO;
  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  const pageBottom = doc.page.height - PAGE_MARGIN;
  const rightEdge = PAGE_MARGIN + TABLE_WIDTH;

  // ── Header: logo + company block (left), invoice meta (right) ──────────
  const logoBuffer = await loadLogoBuffer(company.companyLogoUrl);
  let headerTop = PAGE_MARGIN;
  let companyBlockLeft = PAGE_MARGIN;

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, PAGE_MARGIN, headerTop, { fit: [90, 60] });
      companyBlockLeft = PAGE_MARGIN; // text goes below the logo
      headerTop += 68;
    } catch {
      // Corrupt/unsupported image data — skip the logo, keep going.
    }
  }

  doc
    .fillColor(INK)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(company.companyName || 'Company Name Not Set', companyBlockLeft, headerTop, { width: 260 });
  doc.font('Helvetica').fontSize(9).fillColor(MUTED);
  const addressLines = [
    company.addressLine1,
    company.addressLine2,
    [company.city, company.state, company.postalCode].filter(Boolean).join(', '),
    company.country,
  ].filter(Boolean);
  doc.text(addressLines.join('\n'), companyBlockLeft, doc.y + 2, { width: 260 });
  const contactLines = [
    company.phone ? `Phone: ${company.phone}` : null,
    company.email ? `Email: ${company.email}` : null,
    company.gstNumber ? `GSTIN: ${company.gstNumber}` : null,
    company.website ? `Web: ${company.website}` : null,
  ].filter(Boolean) as string[];
  if (contactLines.length) doc.text(contactLines.join('\n'), companyBlockLeft, doc.y + 2, { width: 260 });

  // Invoice meta block, right-aligned against the table's right edge.
  const metaX = rightEdge - 220;
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(GOLD)
    .text('INVOICE', metaX, PAGE_MARGIN, { width: 220, align: 'right' });
  doc.font('Helvetica').fontSize(9).fillColor(INK);
  const metaRows: [string, string][] = [
    ['Invoice #', invoice.invoiceNumber],
    ['Invoice Date', invoice.invoiceDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
  ];
  if (invoice.order?.orderNumber) metaRows.push(['Order #', invoice.order.orderNumber]);
  metaRows.push(['Status', invoice.status]);
  if (invoice.paymentMethod) metaRows.push(['Payment Method', invoice.paymentMethod]);
  if (invoice.paymentStatus) metaRows.push(['Payment Status', invoice.paymentStatus]);
  if (invoice.orderStatus) metaRows.push(['Order Status', invoice.orderStatus]);
  let metaY = doc.y + 6;
  for (const [label, value] of metaRows) {
    doc.fillColor(MUTED).text(label, metaX, metaY, { width: 100, align: 'right' });
    doc.fillColor(INK).text(value, metaX + 100, metaY, { width: 120, align: 'right' });
    metaY = Math.max(doc.y, metaY) + 2;
  }

  let y = Math.max(headerTop + (contactLines.length ? 60 : 44), metaY) + 16;

  // ── Bill To / Ship To ────────────────────────────────────────────────
  doc.moveTo(PAGE_MARGIN, y).lineTo(rightEdge, y).strokeColor(GOLD).lineWidth(1).stroke();
  y += 14;

  const halfWidth = TABLE_WIDTH / 2 - 10;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(MUTED).text('BILL TO', PAGE_MARGIN, y);
  const sameAddress = invoice.shippingAddress && invoice.shippingAddress === invoice.billingAddress;
  if (!sameAddress && invoice.shippingAddress) {
    doc.text('SHIP TO', PAGE_MARGIN + halfWidth + 20, y);
  }
  y += 13;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(invoice.customerName, PAGE_MARGIN, y, { width: halfWidth });
  if (invoice.companyNameOnInvoice) {
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(invoice.companyNameOnInvoice, PAGE_MARGIN, doc.y + 1, { width: halfWidth });
  }
  doc.font('Helvetica').fontSize(9).fillColor(INK).text(invoice.billingAddress, PAGE_MARGIN, doc.y + 2, { width: halfWidth });
  const contactBits = [invoice.customerPhone, invoice.customerEmail].filter(Boolean).join('  ·  ');
  if (contactBits) doc.fillColor(MUTED).text(contactBits, PAGE_MARGIN, doc.y + 2, { width: halfWidth });
  const billBottom = doc.y;

  if (!sameAddress && invoice.shippingAddress) {
    const shipX = PAGE_MARGIN + halfWidth + 20;
    doc.font('Helvetica').fontSize(9).fillColor(INK).text(invoice.shippingAddress, shipX, y + 13, { width: halfWidth });
  }

  y = Math.max(billBottom, y + 13) + 20;

  // ── Line items table ─────────────────────────────────────────────────
  function drawTableHeader() {
    doc.rect(PAGE_MARGIN, y, TABLE_WIDTH, 22).fill('#F3EEE4');
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(INK);
    COLS.forEach((col, i) => {
      doc.text(col.label, colX(i) + 4, y + 7, { width: col.width - 8, align: col.align });
    });
    y += 22;
  }

  function ensureSpace(rowHeight: number) {
    if (y + rowHeight > pageBottom - 90) {
      doc.addPage();
      y = PAGE_MARGIN;
      drawTableHeader();
    }
  }

  drawTableHeader();
  doc.font('Helvetica').fontSize(9).fillColor(INK);
  invoice.items.forEach((item, idx) => {
    const nameHeight = doc.heightOfString(item.productName, { width: COLS[1].width - 8 });
    const rowHeight = Math.max(20, nameHeight + 8);
    ensureSpace(rowHeight);

    if (idx % 2 === 1) {
      doc.rect(PAGE_MARGIN, y, TABLE_WIDTH, rowHeight).fill('#FAF8F4');
      doc.fillColor(INK);
    }

    const cells = [
      String(idx + 1),
      item.productName,
      item.sku ?? '—',
      String(item.quantity),
      money(item.unitPrice),
      Number(item.discountAmount) > 0 ? `-${money(item.discountAmount)}` : '—',
      money(item.lineTotal),
    ];
    cells.forEach((text, i) => {
      doc.text(text, colX(i) + 4, y + 5, { width: COLS[i].width - 8, align: COLS[i].align });
    });
    y += rowHeight;
    doc.moveTo(PAGE_MARGIN, y).lineTo(rightEdge, y).strokeColor('#E5DFD2').lineWidth(0.5).stroke();
  });

  y += 12;

  // ── Totals ───────────────────────────────────────────────────────────
  ensureSpace(110);
  const totalsLabelX = rightEdge - 220;
  const totalsValueX = rightEdge - 100;
  function totalsRow(label: string, value: string, bold = false) {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9.5).fillColor(bold ? INK : MUTED);
    doc.text(label, totalsLabelX, y, { width: 120, align: 'right' });
    doc.fillColor(INK).text(value, totalsValueX, y, { width: 100, align: 'right' });
    y += bold ? 20 : 16;
  }
  totalsRow('Subtotal', money(invoice.subtotal));
  if (Number(invoice.discountAmount) > 0) totalsRow('Discount', `-${money(invoice.discountAmount)}`);
  if (Number(invoice.taxAmount) > 0) totalsRow('Tax', money(invoice.taxAmount));
  totalsRow('Shipping', Number(invoice.shippingFee) > 0 ? money(invoice.shippingFee) : 'Free');
  doc.moveTo(totalsLabelX, y).lineTo(rightEdge, y).strokeColor(GOLD).lineWidth(1).stroke();
  y += 8;
  totalsRow('Grand Total', money(invoice.totalAmount), true);

  y += 20;

  // ── Notes / Terms / Footer ──────────────────────────────────────────
  if (invoice.notes) {
    ensureSpace(50);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text('Notes', PAGE_MARGIN, y);
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text(invoice.notes, PAGE_MARGIN, doc.y + 2, { width: TABLE_WIDTH });
    y = doc.y + 14;
  }
  if (invoice.termsAndConditions) {
    ensureSpace(60);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(INK).text('Terms & Conditions', PAGE_MARGIN, y);
    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(invoice.termsAndConditions, PAGE_MARGIN, doc.y + 2, { width: TABLE_WIDTH });
    y = doc.y + 14;
  }

  // Footer message pinned to the bottom of every page. Writing into the
  // margin area would normally make pdfkit think the text overflows the
  // page and silently `addPage()` — drop the bottom margin to 0 first so
  // it treats the full page height as writable.
  const footerText = company.footerMessage;
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const originalBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        footerText || 'Thank you for your business.',
        PAGE_MARGIN,
        doc.page.height - PAGE_MARGIN + 10,
        { width: TABLE_WIDTH, align: 'center' }
      );
    doc.text(`Page ${i - range.start + 1} of ${range.count}`, PAGE_MARGIN, doc.page.height - PAGE_MARGIN + 24, {
      width: TABLE_WIDTH,
      align: 'center',
    });
    doc.page.margins.bottom = originalBottomMargin;
  }

  doc.end();
  return done;
}
