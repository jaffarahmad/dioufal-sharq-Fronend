import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Link } from "wouter";
import logoPath from "@assets/logo.view-invoice.png";
import QRCode from "qrcode";
import { generateZatcaQRPayload } from "@/utils/zatca-qr";

import {
  generateSimplePDF,
  testPDFGeneration,
} from "@/utils/simple-pdf-generator";

declare global {
  interface Window {
    html2pdf: any;
  }
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  description?: string;
  subtotal: string;
  taxRate?: number | string;
  taxAmount: string;
  vatAmount?: number | string;
  totalAmount: string;
  status: string;
  dueDate?: string;
  paidDate?: string;
  createdAt: string;
  notes?: string;
}

// Resolve the VAT % that was actually saved for this invoice, falling back
// to deriving it from the stored vatAmount, and finally to 15%.
function getTaxRatePercent(invoice?: Invoice): number {
  if (!invoice) return 15;
  if (invoice.taxRate) {
    const parsed = parseFloat(invoice.taxRate);
    if (!isNaN(parsed)) return parsed;
  }
  const subtotal = parseFloat(invoice.subtotal || "0");
  if (invoice.vatAmount !== undefined && invoice.vatAmount !== null && subtotal > 0) {
    const vat = parseFloat(String(invoice.vatAmount));
    if (!isNaN(vat)) return (vat / subtotal) * 100;
  }
  return 15;
}

interface InvoiceItem {
  id: number;
  description: string;
  quantity: string;
  rate: string;
  amount: string;
}

export default function ViewInvoicePage() {
  const { id: invoiceId } = useParams() as { id: string };

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ["invoices-records", invoiceId],
    queryFn: () => {
      const stored = localStorage.getItem("invoices-records");
      const invoices = stored ? JSON.parse(stored) : [];
      return invoices.find((inv: any) => inv.id === parseInt(invoiceId));
    },
    enabled: !!invoiceId,
  });

  const { data: invoiceItems = [] } = useQuery<InvoiceItem[]>({
    queryKey: ["invoices-records", invoiceId, "items"],
    queryFn: () => {
      const stored = localStorage.getItem("invoices-records");
      const invoices = stored ? JSON.parse(stored) : [];
      const foundInvoice = invoices.find((inv: any) => inv.id === parseInt(invoiceId));
      return foundInvoice?.items || [];
    },
    enabled: !!invoiceId,
  });

  const { data: qrData } = useQuery<{
    qrCode: string;
    invoiceUrl: string;
    zatcaCompliant: boolean;
    tlvData: string;
    invoiceData: {
      sellerName: string;
      vatRegistrationNumber: string;
      invoiceDateTime: string;
      invoiceTotal: string;
      vatAmount: string;
    };
  } | null>({
    queryKey: ["invoices-records", invoiceId, "qr", invoice?.invoiceNumber, invoice?.totalAmount],
    queryFn: async () => {
      if (!invoice) return null;
      
      // Calculate actual totals
      const actualSubtotal = invoiceItems.length > 0
        ? invoiceItems.reduce((sum, item) => sum + parseFloat(item.amount), 0)
        : parseFloat(invoice.subtotal || "0");
      const savedTaxRate =
        invoice.taxRate !== undefined && invoice.taxRate !== null
          ? parseFloat(String(invoice.taxRate))
          : 15;
      const actualTaxAmount = actualSubtotal * (savedTaxRate / 100); // VAT from saved rate
      const actualTotal = actualSubtotal + actualTaxAmount;
      
      // Generate ZATCA-compliant TLV Base64 QR payload
      const invoiceTimestamp = new Date(invoice.createdAt).toISOString();
      const tlvPayload = generateZatcaQRPayload({
        sellerName: "AMANI MUHAMMAD AL OTAIBI CONTRACTING COMPANY",
        vatRegistrationNumber: "312169201500003",
        invoiceTimestamp,
        invoiceTotal: actualTotal.toFixed(2),
        vatAmount: actualTaxAmount.toFixed(2),
      });

      // Generate QR code as base64 data URL
      const qrCodeDataUrl = await QRCode.toDataURL(tlvPayload, {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return {
        qrCode: qrCodeDataUrl,
        invoiceUrl: window.location.href,
        zatcaCompliant: true,
        tlvData: tlvPayload,
        invoiceData: {
          sellerName: "AMANI MUHAMMAD AL OTAIBI CONTRACTING COMPANY",
          vatRegistrationNumber: "312169201500003",
          invoiceDateTime: invoiceTimestamp,
          invoiceTotal: actualTotal.toFixed(2),
          vatAmount: actualTaxAmount.toFixed(2)
        }
      };
    },
    enabled: !!invoiceId,
  });

  // Add debug button for PDF troubleshooting

  const handlePrint = () => {
    window.print();
  };

  const handleSimplePDF = async () => {
    try {
      await generateSimplePDF({
        elementId: "view-invoice-content",
        filename: `invoice-${invoice?.invoiceNumber || invoiceId}-simple.pdf`,
        quality: 0.95,
        scale: 2,
      });
      console.log("Simple PDF generated successfully");
    } catch (error) {
      console.error("Error generating simple PDF:", error);
      alert("Error generating PDF: " + (error as Error).message);
    }
  };

  const handleTestPDF = async () => {
    try {
      await testPDFGeneration("view-invoice-content");
    } catch (error) {
      console.error("PDF test failed:", error);
    }
  };

  const waitForFonts = async () => {
    // Wait for Google Fonts to load
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    // Additional wait to ensure all fonts are rendered
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleDownloadPDF = async () => {
    try {
      const { generateEnhancedPDF } = await import(
        "@/utils/enhanced-pdf-generator"
      );

      await generateEnhancedPDF(
        {
          elementId: "view-invoice-content",
          filename: `invoice-${invoice?.invoiceNumber || invoiceId}.pdf`,
          pageFormat: "a4",
          orientation: "portrait",
          quality: 0.98,
          scale: 2.5,
          margins: {
            top: 5,
            right: 5,
            bottom: 5,
            left: 5,
          },
        },
        {
          show: true,
          message:
            "Generating perfect A4 PDF with enhanced layout preservation...",
        }
      );

      console.log(
        "Perfect A4 PDF generated successfully with enhanced quality"
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // Convert number to words function
  const numberToWords = (num: number): string => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    if (num === 0) return "Zero";

    let result = "";

    if (num >= 1000000) {
      const millions = Math.floor(num / 1000000);
      result += numberToWords(millions) + " Million ";
      num %= 1000000;
    }

    if (num >= 1000) {
      const thousands = Math.floor(num / 1000);
      result += numberToWords(thousands) + " Thousand ";
      num %= 1000;
    }

    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }

    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    } else if (num >= 10) {
      result += teens[num - 10] + " ";
      num = 0;
    }

    if (num > 0) {
      result += ones[num] + " ";
    }

    return result.trim();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex justify-center items-center h-96">
        Invoice not found
      </div>
    );
  }

  // Calculate line item totals
  const lineItemSubtotal = invoiceItems.reduce(
    (sum, item) => sum + parseFloat(item.amount),
    0
  );
  const displaySubtotal =
    lineItemSubtotal > 0 ? lineItemSubtotal : parseFloat(invoice.subtotal);
  const taxRate =
    invoice.taxRate !== undefined && invoice.taxRate !== null
      ? parseFloat(String(invoice.taxRate))
      : 15; // fallback to 15% VAT for old invoices
  const taxAmount = displaySubtotal * (taxRate / 100);
  const netAmount = displaySubtotal + taxAmount;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
      {/* Header Controls */}
      <div className="max-w-4xl mx-auto px-2 sm:px-4 mb-4 sm:mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <Link href="/invoices">
            <Button variant="outline" className="text-xs sm:text-sm">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Back to Invoices
            </Button>
          </Link>
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="text-xs sm:text-sm"
            >
              <Printer className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleSimplePDF}
              className="text-xs sm:text-sm bg-green-100 hover:bg-green-200 text-green-700"
            >
              Simple PDF
            </Button>

          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto px-1">
        <Card
          className="shadow-none border-0 bg-white"
          style={{ width: "210mm", minHeight: "297mm" }}
        >
          <CardContent
            id="view-invoice-content"
            className="p-1 bg-white"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "5mm",
              boxSizing: "border-box",
              margin: "0 auto",
            }}
          >
            {/* Header Section - Three Column Layout */}
            <div className="mb-4">
              <div className="flex items-start justify-between gap-6">
                {/* Company Information - Top Left */}
                <div className="text-left flex-1">
                  <h1
                    className="text-xl font-extrabold"
                    style={{ color: "#0ea5e9" }}
                  >
                    AMANI MUHAMMAD AL OTAIBI
                  </h1>
                  <p className="text-sm font-semibold text-gray-600">
                    CONTRACTING COMPANY
                  </p>
                  <div className="text-sm font-medium text-gray-600 mt-2 space-y-1">
                    <div>C.R. 7050857452</div>
                    <div>VAT No. 312169201500003</div>
                  </div>
                </div>

                {/* Logo - Center */}
                <div className="text-center flex-shrink-0">
                  <img
                    src={logoPath}
                    alt="Company Logo"
                    className="w-28 h-28 object-contain drop-shadow-lg mx-auto"
                  />
                  <div className="mt-2">
                    <h3 className="text-xl font-extrabold text-gray-900">
                      Tax Invoice
                    </h3>
                    <p
                      className="text-2xl font-extrabold text-gray-900"
                      dir="rtl"
                      style={{
                        fontFamily:
                          "Cairo, Amiri, Noto Naskh Arabic, Arial, sans-serif",
                        fontWeight: "700",
                      }}
                    >
                      فاتورة ضريبية
                    </p>
                  </div>
                </div>

                {/* Arabic Company Name - Right */}
                <div className="text-right flex-1">
                  <h2
                    className="text-xl font-extrabold"
                    style={{ color: "#0ea5e9" }}
                    dir="rtl"
                  >
                    شركة أماني محمد العتيبي للمقاولات
                  </h2>
                  <p className="text-sm font-semibold text-gray-600" dir="rtl">
                    للمقاولات
                  </p>
                  <div
                    className="text-sm font-medium text-gray-600 mt-2 space-y-1"
                    dir="rtl"
                  >
                    <div>س.ت: ٧٠٥٠٨٥٧٤٥٢</div>
                    <div>الرقم الضريبي: ٣١٢١٦٩٢٠١٥٠٠٠٠٣</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice To and Invoice Info */}
            <div className="flex justify-between mb-2">
              <div style={{ width: "48%" }} className="text-left">
                <h3 className="font-bold text-lg mb-2">
                  <span className="text-black">INVOICE TO</span>
                  <br />
                  <span className="text-sm font-medium text-gray-600" dir="rtl">
                    إرسال الفاتورة إلى
                  </span>
                </h3>
                <div className="text-sm text-left">
                  <div className="font-bold text-left">
                    {invoice.clientName}
                  </div>
                  {invoice.clientEmail && (
                    <div className="font-medium text-left">
                      Client VAT: {invoice.clientEmail}
                    </div>
                  )}
                  {invoice.clientPhone && (
                    <div className="font-medium text-left">
                      Phone: {invoice.clientPhone}
                    </div>
                  )}
                  {invoice.clientAddress && (
                    <div className="font-medium text-left">
                      {invoice.clientAddress}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right" style={{ width: "48%" }}>
                <div className="font-bold text-lg mb-2">
                  <div className="flex justify-between">
                    <span className="font-bold">Invoice # / رقم الفاتورة:</span>
                    <span className="font-medium">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Date / التاريخ:</span>
                    <span className="font-medium">
                      {new Date(
                        (invoice as any).invoiceDate || invoice.createdAt
                      ).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  {(invoice as any).poNumber && (
                    <div className="flex justify-between">
                      <span className="font-bold">PO # / رقم أمر الشراء:</span>
                      <span className="font-medium">
                        {(invoice as any).poNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-3">
              <table
                className="w-full border-collapse border border-gray-300 text-xs"
                style={{ tableLayout: "fixed", width: "100%" }}
              >
                <thead>
                  <tr className="bg-gray-100 border-2 border-gray-300">
                    <th
                      className="text-center py-2 px-2 font-extrabold text-gray-900 border-r border-gray-300"
                      style={{
                        fontSize: "13px",
                        padding: "8px 4px",
                        width: "25%",
                      }}
                    >
                      <div className="font-extrabold leading-tight">
                        Description / الوصف
                      </div>
                    </th>
                    <th
                      className="text-center py-2 px-2 font-extrabold text-gray-900 border-r border-gray-300"
                      style={{
                        fontSize: "13px",
                        padding: "8px 4px",
                        width: "12%",
                      }}
                    >
                      <div className="font-extrabold leading-tight">
                        Qty / الكمية
                      </div>
                    </th>
                    <th
                      className="text-center py-2 px-2 font-extrabold text-gray-900 border-r border-gray-300"
                      style={{
                        fontSize: "13px",
                        padding: "8px 4px",
                        width: "12%",
                      }}
                    >
                      <div className="font-extrabold leading-tight">
                        Rate / السعر
                      </div>
                    </th>
                    <th
                      className="text-center py-2 px-2 font-extrabold text-gray-900 border-r border-gray-300"
                      style={{
                        fontSize: "13px",
                        padding: "8px 4px",
                        width: "18%",
                      }}
                    >
                      <div className="font-extrabold leading-tight">
                        Taxable / المبلغ
                      </div>
                    </th>
                    <th
                      className="text-center py-2 px-2 font-extrabold text-gray-900 border-r border-gray-300"
                      style={{
                        fontSize: "13px",
                        padding: "8px 4px",
                        width: "16%",
                      }}
                    >
                      <div className="font-extrabold leading-tight">
                        Tax (SAR) / الضريبة
                      </div>
                    </th>
                    <th
                      className="text-center py-2 px-2 font-extrabold text-gray-900"
                      style={{
                        fontSize: "13px",
                        padding: "8px 4px",
                        width: "17%",
                      }}
                    >
                      <div className="font-extrabold leading-tight">
                        Net Amount / صافي المبلغ
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems && invoiceItems.length > 0 ? (
                    invoiceItems.map((item, index) => {
                      const itemTaxableAmount = parseFloat(item.amount);
                      const itemTax = itemTaxableAmount * (taxRate / 100);
                      const itemNetAmount = itemTaxableAmount + itemTax;

                      return (
                        <tr
                          key={item.id || index}
                          className="border-b border-gray-300"
                        >
                          <td
                            className="border-r border-gray-300 break-words font-semibold"
                            style={{ fontSize: "13px", padding: "6px 4px" }}
                          >
                            {item.description}
                          </td>
                          <td
                            className="text-center border-r border-gray-300 font-medium"
                            style={{ fontSize: "13px", padding: "6px 4px" }}
                          >
                            {item.quantity}
                          </td>
                          <td
                            className="text-center border-r border-gray-300 font-medium"
                            style={{ fontSize: "13px", padding: "6px 4px" }}
                          >
                            {parseFloat(item.rate).toFixed(2)}
                          </td>
                          <td
                            className="text-center border-r border-gray-300 font-medium"
                            style={{ fontSize: "13px", padding: "6px 4px" }}
                          >
                            {itemTaxableAmount.toFixed(2)}
                          </td>
                          <td
                            className="text-center border-r border-gray-300 font-medium"
                            style={{ fontSize: "13px", padding: "6px 4px" }}
                          >
                            <div>{itemTax.toFixed(2)}</div>
                            <div
                              className="text-xs text-gray-500 font-medium"
                              style={{ fontSize: "11px" }}
                            >
                              (VAT {taxRate}%)
                            </div>
                          </td>
                          <td
                            className="text-center font-bold"
                            style={{ fontSize: "13px", padding: "6px 4px" }}
                          >
                            {itemNetAmount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="border-b border-gray-300">
                      <td
                        className="border-r border-gray-300 break-words font-semibold"
                        style={{ fontSize: "13px", padding: "6px 4px" }}
                      >
                        {invoice.description || "General Services"}
                      </td>
                      <td
                        className="text-center border-r border-gray-300 font-medium"
                        style={{ fontSize: "13px", padding: "6px 4px" }}
                      >
                        1
                      </td>
                      <td
                        className="text-center border-r border-gray-300 font-medium"
                        style={{ fontSize: "13px", padding: "6px 4px" }}
                      >
                        {parseFloat(invoice.subtotal).toFixed(2)}
                      </td>
                      <td
                        className="text-center border-r border-gray-300 font-medium"
                        style={{ fontSize: "13px", padding: "6px 4px" }}
                      >
                        {parseFloat(invoice.subtotal).toFixed(2)}
                      </td>
                      <td
                        className="text-center border-r border-gray-300 font-medium"
                        style={{ fontSize: "13px", padding: "6px 4px" }}
                      >
                        <div>{taxAmount.toFixed(2)}</div>
                        <div
                          className="text-xs text-gray-500 font-medium"
                          style={{ fontSize: "11px" }}
                        >
                          (VAT {taxRate}%)
                        </div>
                      </td>
                      <td
                        className="text-center font-bold"
                        style={{ fontSize: "13px", padding: "6px 4px" }}
                      >
                        {netAmount.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-2">
              <div className="w-1/3">
                <div className="space-y-0 text-sm">
                  <div className="flex justify-between py-0">
                    <span className="font-semibold">Subtotal:</span>
                    <span className="text-sm font-medium">
                      {displaySubtotal.toFixed(2)} SAR
                    </span>
                  </div>
                  <div className="flex justify-between py-0">
                    <span className="font-semibold">VAT ({taxRate}%):</span>
                    <span className="text-sm font-medium">
                      {taxAmount.toFixed(2)} SAR
                    </span>
                  </div>
                  <div className="border-t pt-0">
                    <div className="py-0">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-extrabold">
                          Net Amount:
                        </span>
                        <span className="text-base font-extrabold">
                          SAR {netAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-base font-bold text-gray-700 mt-0 text-left">
                        صافي المبلغ
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3">
              {/* Amount in Words */}
              <div className="mb-3">
                <h4 className="font-bold mb-1 border-b border-gray-300 pb-0 text-base">
                  Amount in Words
                </h4>
                <p className="text-sm font-medium">
                  {numberToWords(Math.round(netAmount))}
                </p>
              </div>

              {/* Bank Details */}
              <div>
                <h4 className="font-bold mb-1 border-b border-gray-300 pb-0 text-base">
                  Bank Details
                </h4>
                <div className="text-sm space-y-0">
                  <div>
                    <strong>Bank:</strong> Al Rajhi Bank
                  </div>
                  <div>
                    <strong>Account Number:</strong> 993608010099371
                  </div>
                  <div>
                    <strong>IBAN:</strong> SA93 8000 0993 6080 1009 9371
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex justify-center mt-2 pt-1 border-t border-gray-300">
              {qrData?.qrCode && (
                <img
                  src={qrData.qrCode}
                  alt="ZATCA QR Code"
                  className="w-16 h-16"
                />
              )}
            </div>

            {/* Company Contact Information */}
            <div className="text-center mt-1">
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>جدة العزيزية لشارع سبعين</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span>joodinternationalinfo@gmail.com</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
