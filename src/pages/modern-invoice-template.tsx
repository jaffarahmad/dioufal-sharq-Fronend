import React from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/image-logo.png";
import {
  generateSimplePDF,
  testPDFGeneration,
} from "@/utils/simple-pdf-generator";
import QRCode from "qrcode";
import { generateZatcaQRPayload } from "@/utils/zatca-qr";

declare global {
  interface Window {
    html2pdf: any;
  }
}

// Library loading helper function
function loadLibrary(name: string, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any)[name]) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${name}`));
    document.head.appendChild(script);
  });
}

// Number to words conversion function
function numberToWords(num: number): string {
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
  const thousands = ["", "Thousand", "Million", "Billion"];

  if (num === 0) return "Zero";

  function convertHundreds(n: number): string {
    let result = "";

    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }

    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + " ";
      return result;
    }

    if (n > 0) {
      result += ones[n] + " ";
    }

    return result;
  }

  let result = "";
  let thousandIndex = 0;

  while (num > 0) {
    if (num % 1000 !== 0) {
      result =
        convertHundreds(num % 1000) + thousands[thousandIndex] + " " + result;
    }
    num = Math.floor(num / 1000);
    thousandIndex++;
  }

  return result.trim();
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  subtotal: string;
  taxRate?: number | string;
  taxAmount: string;
  vatAmount?: number | string;
  totalAmount: string;
  dueDate: string;
  status: string;
  createdAt: string;
  notes?: string;
  description?: string;
}

interface InvoiceItem {
  id: number;
  description: string;
  quantity: string;
  rate: string;
  amount: string;
}

export default function ModernInvoiceTemplate() {
  const { id: invoiceId } = useParams() as { id: string };
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const [pdfError, setPdfError] = React.useState<string | null>(null);

  const {
    data: invoice,
    isLoading,
    error: invoiceError,
  } = useQuery<Invoice>({
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
        sellerName: "DIOUF AL-SHARQ GENERAL CONTRACTING COMPANY",
        vatRegistrationNumber: "310205801200003",
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
          sellerName: "DIOUF AL-SHARQ GENERAL CONTRACTING COMPANY",
          vatRegistrationNumber: "310205801200003",
          invoiceDateTime: invoiceTimestamp,
          invoiceTotal: actualTotal.toFixed(2),
          vatAmount: actualTaxAmount.toFixed(2)
        }
      };
    },
    enabled: !!invoiceId && !!invoice,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleSimplePDF = async () => {
    try {
      await generateSimplePDF({
        elementId: "modern-invoice-content",
        filename: `${invoice?.invoiceNumber || "invoice"}-modern-simple.pdf`,
        quality: 0.92,
        scale: 2.2,
      });
      console.log("Simple PDF generated successfully");
    } catch (error) {
      console.error("Error generating simple PDF:", error);
      setPdfError("Error generating PDF: " + (error as Error).message);
    }
  };

  const handleTestPDF = async () => {
    try {
      await testPDFGeneration("modern-invoice-content");
    } catch (error) {
      console.error("PDF test failed:", error);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    setPdfError(null);

    try {
      const { generateEnhancedPDF } = await import(
        "@/utils/enhanced-pdf-generator"
      );

      await generateEnhancedPDF(
        {
          elementId: "modern-invoice-content",
          filename: `${invoice?.invoiceNumber || "invoice"}-modern.pdf`,
          pageFormat: "a4",
          orientation: "portrait",
          quality: 0.95,
          scale: 2.5,
          margins: {
            top: 8,
            right: 8,
            bottom: 8,
            left: 8,
          },
        },
        {
          show: false, // We're using our own loading state
          message: "",
        }
      );

      console.log(
        "Modern invoice PDF generated successfully with enhanced quality"
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      setPdfError(
        `Error generating PDF: ${(error as Error).message || "Unknown error"}. Please try again.`
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading invoice...</div>
      </div>
    );
  }

  if (invoiceError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">
          Error loading invoice: {(invoiceError as Error).message}
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Invoice not found</div>
      </div>
    );
  }

  // Calculate totals from actual data only
  const subtotal =
    invoiceItems.length > 0
      ? invoiceItems.reduce((sum, item) => sum + parseFloat(item.amount), 0)
      : parseFloat(invoice.subtotal || "0");
  const taxRatePercent =
    invoice.taxRate !== undefined && invoice.taxRate !== null
      ? parseFloat(String(invoice.taxRate))
      : 15; // fallback to 15% VAT for old invoices
  const taxRate = taxRatePercent / 100;
  const taxAmount =
    invoiceItems.length > 0
      ? subtotal * taxRate
      : parseFloat(invoice.taxAmount || "0");
  const total =
    invoiceItems.length > 0
      ? subtotal + taxAmount
      : parseFloat(invoice.totalAmount || "0");

  return (
    <div className="min-h-screen bg-gray-50 py-2 sm:py-3 lg:py-4">
      {/* Header Controls */}
      <div className="max-w-4xl mx-auto px-1 sm:px-2 mb-2 sm:mb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href="/invoices">
            <Button
              variant="outline"
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Invoices</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>

          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex items-center gap-2 flex-1 sm:flex-none"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button
              variant="primary"
              onClick={handleSimplePDF}
              className="text-xs sm:text-sm"
            >
              Simple PDF
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {pdfError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-700 text-sm">{pdfError}</div>
          </div>
        )}
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto px-1">
        <Card
          className="shadow-none border-0 bg-white"
          style={{ width: "210mm", minHeight: "297mm" }}
        >
          <CardContent
            id="modern-invoice-content"
            className="p-1 bg-white"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "5mm",
              boxSizing: "border-box",
              margin: "0 auto",
            }}
          >
            <div className="bg-white">
              {/* Header */}
              <div className="mb-4">
                {/* Company Information Row */}
                <div className="flex items-start justify-between mb-4">
                  {/* Left - English Company Info */}
                  <div className="text-left flex-1">
                    <h1 className="text-xl font-extrabold text-orange-600">
                      DIOUF AL-SHARQ GENERAL CONTRACTING CO
                    </h1>
                    <p className="text-sm font-semibold text-gray-600">
                      ONE PERSON LIMITED LIABILITY COMPANY
                    </p>
                    <div className="text-sm font-medium text-gray-600 mt-2 space-y-1">
                      <div>C.R: 4030313386/7005094516</div>
                      <div>VAT: 310205801200003</div>
                    </div>
                  </div>

                  {/* Center - Logo and Invoice Title */}
                  <div className="text-center flex-shrink-0 mx-4">
                    <img
                      src={logoImage}
                      alt="Company Logo"
                      className="h-16 w-auto object-contain mx-auto mb-2"
                    />
                    <div>
                      <h2 className="text-xl font-bold text-black">
                        TAX INVOICE
                      </h2>
                      <h3
                        className="text-xl font-bold text-gray-900 mt-1"
                        dir="rtl"
                      >
                        فاتورة ضريبية
                      </h3>
                    </div>
                  </div>

                  {/* Right - Arabic Company Info */}
                  <div className="text-right flex-1">
                    <h2
                      className="text-xl font-extrabold text-orange-600"
                      dir="rtl"
                    >
                      شركة ضيوف الشرق للمقاولات العامة
                    </h2>
                    <p
                      className="text-sm font-semibold text-gray-600"
                      dir="rtl"
                    >
                      شركة ذات مسؤولية محدودة شخص واحد
                    </p>
                    <div
                      className="text-sm font-medium text-gray-600 mt-2 space-y-1"
                      dir="rtl"
                    >
                      <div>س.ت: ٤٠٣٠٣١٣٣٨٦/٧٠٠٥٠٩٤٥١٦</div>
                      <div>الرقم الضريبي: ٣١٠٢٠٥٨٠١٢٠٠٠٠٣</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Area with Minimal Padding */}
              <div style={{ padding: "0 8px" }}>
                {/* Invoice To and Invoice Info */}
                <div className="flex justify-between mb-2">
                  <div style={{ width: "48%" }} className="text-left">
                    <h3 className="font-bold text-lg mb-2">
                      <span className="text-black">INVOICE TO</span>
                      <br />
                      <span
                        className="text-sm font-medium text-gray-600"
                        dir="rtl"
                      >
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
                    <h3 className="font-bold text-lg mb-2">
                      <span className="text-black">INVOICE</span>
                      <br />
                      <span
                        className="text-sm font-medium text-gray-600"
                        dir="rtl"
                      >
                        فاتورة
                      </span>
                    </h3>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="font-bold">
                          Invoice # / رقم الفاتورة:
                        </span>
                        <span className="font-medium">
                          {invoice.invoiceNumber}
                        </span>
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
                          <span className="font-bold">
                            PO # / رقم أمر الشراء:
                          </span>
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
                      {/* Always show the complete invoice data */}
                      {invoiceItems.length > 0 ? (
                        invoiceItems.map((item, index) => {
                          const itemTotal = parseFloat(item.amount);
                          const itemTax = itemTotal * taxRate; // VAT from saved rate
                          const itemNet = itemTotal + itemTax;

                          return (
                            <tr
                              key={item.id}
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
                                {itemTotal.toFixed(2)}
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
                                  (VAT {taxRatePercent}%)
                                </div>
                              </td>
                              <td
                                className="text-center font-bold"
                                style={{ fontSize: "13px", padding: "6px 4px" }}
                              >
                                {itemNet.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="border-b border-gray-300">
                          <td
                            colSpan={6}
                            className="text-center py-4 text-gray-500"
                            style={{ fontSize: "12px" }}
                          >
                            No items found for this invoice
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section - Right Below Table */}
                <div className="flex justify-end mt-2 mb-3">
                  <div className="space-y-1 min-w-64">
                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium">Subtotal</span>
                      <span className="ml-4 text-sm">
                        SAR {subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium">VAT ({taxRatePercent}%)</span>
                      <span className="ml-4 text-sm">
                        SAR {taxAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t-2 border-gray-900 pt-1">
                      <div className="py-1">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">Net Amount:</span>
                          <span className="text-base font-bold">
                            SAR {total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Section with QR Code in Center */}
                <div
                  className="flex flex-col page-break-avoid"
                  style={{ pageBreakInside: "avoid", marginTop: "4px" }}
                >
                  {/* Amount in Words, Bank Details and Description Section */}
                  <div className="grid grid-cols-2 gap-4 mb-1">
                    {/* Amount in Words and Bank Details - Left Side */}
                    <div>
                      <div className="mb-2">
                        <h4 className="font-bold text-gray-900 mb-1 text-xs">
                          Amount in Words
                        </h4>
                        <p className="text-[11px] text-gray-700 break-words italic">
                          {numberToWords(Math.floor(total))} Saudi Riyals Only
                        </p>
                        <div className="border-b border-gray-400 mt-1"></div>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 mb-1 text-xs">
                          Bank Details
                        </h4>
                        <div className="text-[11px] text-gray-700 space-y-0.5">
                          <p>
                            <span className="font-medium">Bank:</span> Riyad
                            bank
                          </p>
                          <p>
                            <span className="font-medium">Account:</span>{" "}
                            176331013994
                          </p>
                          <p className="break-all">
                            <span className="font-medium">IBAN:</span>{" "}
                            SA5720000001763310139940
                          </p>
                        </div>
                        <div className="border-b border-gray-400 mt-1"></div>
                      </div>
                    </div>

                    {/* Description - Right Side */}
                    <div>
                      {invoice.description && (
                        <div className="h-full border-l border-gray-200 pl-4">
                          <h4 className="font-bold text-gray-900 mb-1 text-xs">
                            Description
                          </h4>
                          <p className="text-[11px] text-gray-700 whitespace-pre-wrap leading-tight">
                            {invoice.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Second Row: QR Code Center */}
                  <div className="flex justify-center mb-1">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-white flex items-center justify-center">
                        {qrData?.qrCode ? (
                          <img
                            src={qrData.qrCode}
                            alt="ZATCA E-Invoice QR Code"
                            className="w-full h-full"
                            title={`ZATCA compliant QR code - Company: ${qrData.invoiceData?.sellerName}, VAT: ${qrData.invoiceData?.vatRegistrationNumber}, Total: ${qrData.invoiceData?.invoiceTotal} SAR`}
                          />
                        ) : (
                          <div className="text-xs text-gray-500 text-center">
                            ZATCA
                            <br />
                            QR Code
                            <br />
                            Loading...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Contact Details Footer */}
                <div
                  className="text-center mt-1"
                  style={{ pageBreakInside: "avoid" }}
                >
                  <div className="border-t border-gray-400 pt-1 space-y-1">
                    <p className="text-sm text-gray-700">
                      Gharnath Street, opposite Saudi Aramco complex, Mushrifa,
                      Jeddah KSA
                    </p>
                    <p className="text-sm text-gray-700">
                      شارع غرناطة، مقابل مجمع أرامكو السعودية، المشرفة، جدة
                      المملكة العربية السعودية
                    </p>
                    <p className="text-sm text-gray-700">
                      E-mail :Info@dioufalsharq.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
