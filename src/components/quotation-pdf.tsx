import { jsPDF } from "jspdf";
import type { Quotation } from "@/lib/schema";

interface QuotationPDFData extends Omit<Quotation, "id" | "createdAt" | "subtotal" | "tax" | "total"> {
  subtotal?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  clientAddress?: string;
  clientEmail?: string;
  clientPhone?: string;
  projectTitle?: string;
  description?: string;
  totalAmount?: number;
  notes?: string;
  tax?: number;
  total?: number;
}

export const generateQuotationPDF = (quotation: QuotationPDFData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Company Header Layout
  // Left side - English Company Name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("DIOUF AL-SHARQ", 20, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("GENERAL CONTRACTING COMPANY", 20, 30);

  // Right side - Arabic Company Name
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ضيوف الشرق", pageWidth - 20, 20, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("شركة المقاولات العامة", pageWidth - 20, 30, { align: "right" });

  // Center - Logo placeholder (since we can't easily embed images in jsPDF)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("LOGO", pageWidth / 2, 25, { align: "center" });

  // Company Registration Details (centered below)
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("C.R 4030313386 / 7005094516", pageWidth / 2, 45, {
    align: "center",
  });

  // Quotation Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", pageWidth / 2, 65, { align: "center" });

  // Quotation Details
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Quotation No: ${quotation.quotationNumber}`, 20, 85);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 95);
  if (quotation.validUntil) {
    doc.text(
      `Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}`,
      20,
      105
    );
  }

  // Client Information
  doc.setFont("helvetica", "bold");
  doc.text("Client Information:", 20, 125);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${quotation.clientName}`, 20, 135);
  if (quotation.clientEmail) {
    doc.text(`Email: ${quotation.clientEmail}`, 20, 145);
  }
  if (quotation.clientPhone) {
    doc.text(`Phone: ${quotation.clientPhone}`, 20, 155);
  }

  let yPosition = 175;

  // Project Information
  if (quotation.projectTitle || quotation.description) {
    doc.setFont("helvetica", "bold");
    doc.text("Project Information:", 20, yPosition);
    yPosition += 10;
    doc.setFont("helvetica", "normal");

    if (quotation.projectTitle) {
      doc.text(`Title: ${quotation.projectTitle}`, 20, yPosition);
      yPosition += 10;
    }

    if (quotation.description) {
      const descLines = doc.splitTextToSize(
        `Description: ${quotation.description}`,
        pageWidth - 40
      );
      doc.text(descLines, 20, yPosition);
      yPosition += descLines.length * 5 + 10;
    }
  }

  // Items Table
  if (quotation.items && quotation.items.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Items:", 20, yPosition);
    yPosition += 15;

    // Table Headers
    doc.text("Description", 20, yPosition);
    doc.text("Qty", 120, yPosition);
    doc.text("Unit Price", 140, yPosition);
    doc.text("Total", 170, yPosition);

    // Draw header line
    doc.line(20, yPosition + 2, pageWidth - 20, yPosition + 2);
    yPosition += 10;

    doc.setFont("helvetica", "normal");

    quotation.items.forEach(item => {
      if (yPosition > 250) {
        // Check if we need a new page
        doc.addPage();
        yPosition = 20;
      }

      const descLines = doc.splitTextToSize(item.description, 90);
      doc.text(descLines, 20, yPosition);
      doc.text(item.quantity.toString(), 120, yPosition);
      doc.text(
        `SAR ${item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        140,
        yPosition
      );
      doc.text(
        `SAR ${item.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        170,
        yPosition
      );

      yPosition += Math.max(descLines.length * 5, 10);
    });

    yPosition += 10;
  }

  // Financial Summary
  if (quotation.subtotal !== undefined) {
    doc.line(120, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", 120, yPosition);
    doc.text(
      `SAR ${quotation.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      170,
      yPosition
    );
    yPosition += 10;

    if (quotation.discountAmount && quotation.discountAmount > 0) {
      doc.text("Discount:", 120, yPosition);
      doc.text(
        `-SAR ${quotation.discountAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        170,
        yPosition
      );
      yPosition += 10;
    }

    if (quotation.taxAmount !== undefined) {
      doc.text(`VAT (${quotation.taxRate || 15}%):`, 120, yPosition);
      doc.text(
        `SAR ${quotation.taxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        170,
        yPosition
      );
      yPosition += 10;
    }

    doc.line(120, yPosition, pageWidth - 20, yPosition);
    yPosition += 5;

    doc.setFont("helvetica", "bold");
    doc.text("Total Amount:", 120, yPosition);
    doc.text(
      `SAR ${parseFloat(quotation.totalAmount?.toString() || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      170,
      yPosition
    );
  }

  // Notes
  if (quotation.notes) {
    yPosition += 20;
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions:", 20, yPosition);
    yPosition += 10;

    doc.setFont("helvetica", "normal");
    const notesLines = doc.splitTextToSize(quotation.notes, pageWidth - 40);
    doc.text(notesLines, 20, yPosition);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  return doc;
};

export const downloadQuotationPDF = (quotation: QuotationPDFData) => {
  const doc = generateQuotationPDF(quotation);
  doc.save(`Quotation-${quotation.quotationNumber}.pdf`);
};

export const printQuotation = (quotation: QuotationPDFData) => {
  const doc = generateQuotationPDF(quotation);
  const pdfDataUri = doc.output("datauristring");

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Quotation ${quotation.quotationNumber}</title>
        </head>
        <body style="margin: 0;">
          <iframe src="${pdfDataUri}" width="100%" height="100%" style="border: none;"></iframe>
        </body>
      </html>
    `);
    printWindow.document.close();

    // Wait for the PDF to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  }
};
