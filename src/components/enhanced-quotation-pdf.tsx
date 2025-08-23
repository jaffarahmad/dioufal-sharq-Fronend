import { jsPDF } from "jspdf";
import type { Quotation } from "@/lib/schema";

interface EnhancedQuotationPDFData extends Omit<Quotation, "id" | "createdAt" | "subtotal" | "tax" | "total"> {
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  clientEmail?: string;
  clientPhone?: string;
  projectTitle?: string;
  description?: string;
  discountAmount?: string;
  taxAmount?: string;
  totalAmount?: string;
  subtotal?: string;
  tax?: number;
  total?: number;
  taxRate?: string;
  termsAndConditions?: string;
}

export const generateEnhancedQuotationPDF = (
  quotation: EnhancedQuotationPDFData
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Company Header Layout
  // Left side - English Company Name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("DIOUF AL-SHARQ", 20, yPosition);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("GENERAL CONTRACTING COMPANY", 20, yPosition + 10);

  // Right side - Arabic Company Name
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ضيوف الشرق", pageWidth - 20, yPosition, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("شركة المقاولات العامة", pageWidth - 20, yPosition + 10, {
    align: "right",
  });

  // Center - Logo placeholder
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("LOGO", pageWidth / 2, yPosition + 5, { align: "center" });

  // Company Registration Details (centered below)
  yPosition += 25;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("C.R 4030313386 / 7005094516", pageWidth / 2, yPosition, {
    align: "center",
  });

  // Quotation Title
  yPosition += 20;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", pageWidth / 2, yPosition, { align: "center" });

  // Quotation Details
  yPosition += 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Quotation No: ${quotation.quotationNumber}`, 20, yPosition);
  doc.text(
    `Date: ${new Date().toLocaleDateString()}`,
    pageWidth - 20,
    yPosition,
    { align: "right" }
  );

  yPosition += 10;
  if (quotation.validUntil) {
    doc.text(
      `Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}`,
      20,
      yPosition
    );
  }

  // Client Information
  yPosition += 20;
  doc.setFont("helvetica", "bold");
  doc.text("CLIENT INFORMATION", 20, yPosition);

  yPosition += 10;
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${quotation.clientName}`, 20, yPosition);

  if (quotation.clientEmail) {
    yPosition += 8;
    doc.text(`Email: ${quotation.clientEmail}`, 20, yPosition);
  }

  if (quotation.clientPhone) {
    yPosition += 8;
    doc.text(`Phone: ${quotation.clientPhone}`, 20, yPosition);
  }

  if ("clientAddress" in quotation && quotation.clientAddress) {
    yPosition += 8;
    const address = quotation.clientAddress.substring(0, 60); // Limit address length
    doc.text(`Address: ${address}`, 20, yPosition);
  }

  // Project Information
  if (quotation.projectTitle || quotation.description) {
    yPosition += 20;
    doc.setFont("helvetica", "bold");
    doc.text("PROJECT INFORMATION", 20, yPosition);

    if (quotation.projectTitle) {
      yPosition += 10;
      doc.setFont("helvetica", "normal");
      doc.text(`Project: ${quotation.projectTitle}`, 20, yPosition);
    }

    if (quotation.description) {
      yPosition += 10;
      doc.text(
        `Description: ${quotation.description.substring(0, 80)}`,
        20,
        yPosition
      );
    }
  }

  // Items Table
  yPosition += 25;
  doc.setFont("helvetica", "bold");
  doc.text("ITEMS & SERVICES", 20, yPosition);

  // Table headers
  yPosition += 15;
  const tableStartY = yPosition;
  const colWidths = [80, 25, 35, 35]; // Description, Qty, Unit Price, Total
  const colPositions = [20, 100, 125, 160];

  // Draw table header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPosition - 5, pageWidth - 40, 15, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", colPositions[0], yPosition + 5);
  doc.text("QTY", colPositions[1], yPosition + 5);
  doc.text("UNIT PRICE", colPositions[2], yPosition + 5);
  doc.text("TOTAL", colPositions[3], yPosition + 5);

  yPosition += 15;

  // Table rows
  doc.setFont("helvetica", "normal");
  quotation.items.forEach((item, index) => {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    // Add row background for alternate rows
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, yPosition - 3, pageWidth - 40, 12, "F");
    }

    // Description (wrap text if too long)
    const description =
      item.description.length > 35
        ? item.description.substring(0, 35) + "..."
        : item.description;
    doc.text(description, colPositions[0], yPosition + 3);

    // Quantity
    doc.text(item.quantity.toString(), colPositions[1], yPosition + 3);

    // Unit Price
    doc.text(
      `${item.unitPrice.toFixed(2)} SAR`,
      colPositions[2],
      yPosition + 3
    );

    // Total
    doc.text(`${item.total.toFixed(2)} SAR`, colPositions[3], yPosition + 3);

    yPosition += 12;
  });

  // Financial Summary
  yPosition += 20;
  doc.setFont("helvetica", "bold");
  doc.text("FINANCIAL SUMMARY", pageWidth - 20, yPosition, { align: "right" });

  yPosition += 15;
  doc.setFont("helvetica", "normal");

  const subtotal = parseFloat(quotation.subtotal || "0");
  const discountAmount = parseFloat(quotation.discountAmount || "0");
  const taxAmount = parseFloat(quotation.taxAmount || "0");
  const totalAmount = parseFloat(quotation.totalAmount || "0");

  // Subtotal
  doc.text("Subtotal:", pageWidth - 80, yPosition);
  doc.text(`${subtotal.toFixed(2)} SAR`, pageWidth - 20, yPosition, {
    align: "right",
  });

  // Discount (if any)
  if (discountAmount > 0) {
    yPosition += 10;
    doc.text("Discount:", pageWidth - 80, yPosition);
    doc.text(`-${discountAmount.toFixed(2)} SAR`, pageWidth - 20, yPosition, {
      align: "right",
    });
  }

  // Tax
  yPosition += 10;
  const taxRate = parseFloat(quotation.taxRate || "15");
  doc.text(`Tax (${taxRate}%):`, pageWidth - 80, yPosition);
  doc.text(`${taxAmount.toFixed(2)} SAR`, pageWidth - 20, yPosition, {
    align: "right",
  });

  // Total
  yPosition += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL AMOUNT:", pageWidth - 90, yPosition);
  doc.text(`${totalAmount.toFixed(2)} SAR`, pageWidth - 20, yPosition, {
    align: "right",
  });

  // Notes
  if (quotation.notes) {
    yPosition += 25;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("NOTES:", 20, yPosition);

    yPosition += 10;
    doc.setFont("helvetica", "normal");
    const notes = doc.splitTextToSize(quotation.notes, pageWidth - 40);
    doc.text(notes, 20, yPosition);
    yPosition += notes.length * 5;
  }

  // Terms and Conditions
  if (quotation.termsAndConditions) {
    yPosition += 15;
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TERMS & CONDITIONS:", 20, yPosition);

    yPosition += 10;
    doc.setFont("helvetica", "normal");
    const terms = doc.splitTextToSize(
      quotation.termsAndConditions,
      pageWidth - 40
    );
    doc.text(terms, 20, yPosition);
  }

  // Footer
  const footerY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Thank you for considering our services. We look forward to working with you.",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  return doc;
};

export const downloadEnhancedQuotationPDF = (
  quotation: EnhancedQuotationPDFData
) => {
  const doc = generateEnhancedQuotationPDF(quotation);
  doc.save(`Quotation-${quotation.quotationNumber}.pdf`);
};

export const printEnhancedQuotation = (quotation: EnhancedQuotationPDFData) => {
  const doc = generateEnhancedQuotationPDF(quotation);
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);

  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
      URL.revokeObjectURL(url);
    };
  }
};
