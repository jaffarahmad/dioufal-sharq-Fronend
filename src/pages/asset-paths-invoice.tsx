import React from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Globe, Mail, MapPin, Phone, Printer } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/Asset3.logo.png";
import {
  generateSimplePDF,
} from "@/utils/simple-pdf-generator";
import QRCode from "qrcode";
import { generateZatcaQRPayload } from "@/utils/zatca-qr";

declare global {
  interface Window {
    html2pdf: any;
  }
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

function generateBarcodeBars(value: string): number[] {
  const normalized = value.trim() || "ASSET";
  const bars: number[] = [2, 1, 2, 1];

  for (const char of normalized) {
    const code = char.charCodeAt(0);
    for (let bit = 0; bit < 7; bit++) {
      bars.push(((code >> bit) & 1) === 1 ? 2 : 1);
    }
    bars.push(1);
  }

  bars.push(3, 1, 2, 1);
  return bars;
}

function getZatcaInvoiceTimestamp(invoiceDate?: string, createdAt?: string): string {
  if (invoiceDate && /^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)) {
    // Use a fixed midday Saudi time so scanners always show the saved invoice date.
    return `${invoiceDate}T12:00:00+03:00`;
  }

  return createdAt || new Date().toISOString();
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
  invoiceDate?: string;
  poNumber?: string;
}

interface InvoiceItem {
  id: number;
  description: string;
  quantity: string;
  rate: string;
  amount: string;
}

export default function AssetPathsInvoiceTemplate() {
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
    queryKey: [
      "invoices-records",
      invoiceId,
      "qr-asset-paths",
      invoice?.invoiceNumber,
      invoice?.invoiceDate,
      invoice?.createdAt,
      invoice?.totalAmount,
      invoice?.taxRate,
    ],
    queryFn: async () => {
      if (!invoice) return null;
      
      const actualSubtotal = invoiceItems.length > 0
        ? invoiceItems.reduce((sum, item) => sum + parseFloat(item.amount), 0)
        : parseFloat(invoice.subtotal || "0");
      const savedTaxRate =
        invoice.taxRate !== undefined && invoice.taxRate !== null
          ? parseFloat(String(invoice.taxRate))
          : 15;
      const actualTaxAmount = actualSubtotal * (savedTaxRate / 100);
      const actualTotal = actualSubtotal + actualTaxAmount;
      
      const invoiceTimestamp = getZatcaInvoiceTimestamp(
        invoice.invoiceDate,
        invoice.createdAt
      );
      const tlvPayload = generateZatcaQRPayload({
        sellerName: "ASSET PATHS GENERAL CO.",
        vatRegistrationNumber: "314915729100003",
        invoiceTimestamp,
        invoiceTotal: actualTotal.toFixed(2),
        vatAmount: actualTaxAmount.toFixed(2),
      });

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
          sellerName: "ASSET PATHS GENERAL CO.",
          vatRegistrationNumber: "314915729100003",
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
        elementId: "asset-paths-invoice-content",
        filename: `${invoice?.invoiceNumber || "invoice"}-asset-paths.pdf`,
        quality: 0.92,
        scale: 2.2,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      setPdfError("Error generating PDF: " + (error as Error).message);
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

  const subtotal =
    invoiceItems.length > 0
      ? invoiceItems.reduce((sum, item) => sum + parseFloat(item.amount), 0)
      : parseFloat(invoice.subtotal || "0");
  const taxRatePercent =
    invoice.taxRate !== undefined && invoice.taxRate !== null
      ? parseFloat(String(invoice.taxRate))
      : 15;
  const taxRate = taxRatePercent / 100;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  const barcodeBars = generateBarcodeBars(invoice.invoiceNumber || "ASSET");
  const barcodeWidth = barcodeBars.reduce((sum, width) => sum + width, 0);

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
              <span>Back to Invoices</span>
            </Button>
          </Link>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex items-center gap-2 flex-1 sm:flex-none"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </Button>
            <Button
              variant="primary"
              onClick={handleSimplePDF}
              className="flex-1 sm:flex-none"
            >
              Download PDF
            </Button>
          </div>
        </div>

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
            id="asset-paths-invoice-content"
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
              <div className="mb-4 border-b-2 border-blue-800 pb-2">
                <div className="flex items-start justify-center gap-x-4 px-1">
                  {/* Left - English Company Info */}
                  <div className="text-left flex-1 min-w-0 max-w-[350px]">
                    <h1 className="text-lg font-extrabold text-blue-800 leading-tight whitespace-nowrap">
                      ASSET PATHS GENERAL CO.
                    </h1>
                    <p className="text-[11px] font-semibold text-gray-600 mt-1 whitespace-nowrap">
                      GENERAL CONTRACTING & SERVICES
                    </p>
                    <div className="text-[11px] font-medium text-gray-600 mt-1 space-y-0.5">
                      <div>Unified No: 7054838060</div>
                      <div>VAT: 314915729100003</div>
                    </div>
                  </div>

                  {/* Center - Logo and Invoice Title */}
                  <div className="text-center flex-shrink-0 mx-1">
                    <img
                      src={logoImage}
                      alt="Company Logo"
                      className="h-24 w-auto object-contain mx-auto"
                    />
                    <div className="mt-6">
                      <h2 className="text-xl font-bold text-black leading-none">
                        TAX INVOICE
                      </h2>
                      <h3
                        className="text-lg font-bold text-gray-900 mt-1 leading-none"
                        dir="center"
                      >
                        فاتورة ضريبية
                      </h3>
                    </div>
                  </div>

                  {/* Right - Arabic Company Info */}
                  <div className="text-center flex-1 min-w-0 max-w-[350px]">
                    <h2
                      className="text-[13px] font-extrabold tracking-tight text-blue-800 leading-none whitespace-nowrap"
                      dir="rtl"
                    >
                      شركة أسيت باثز للمقاولات العامة

                    </h2>
                    <p
                      className="text-[11px] font-semibold text-gray-600 mt-1 whitespace-nowrap"
                      dir="rtl"
                    >
                      مقاولات عامة وخدمات
                    </p>
                    <div
                      className="text-[11px] font-medium text-gray-600 mt-1 space-y-0.5"
                      dir="rtl"
                    >
                      <div>الرقم الموحد: ٧٠٥٤٨٣٨٠٦٠</div>
                      <div>الرقم الضريبي: ٣١٤٩١٥٧٢٩١٠٠٠٠٣</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div style={{ padding: "0 8px" }}>
                <div className="flex justify-between mb-2">
                  <div style={{ width: "48%" }} className="text-left">
                    <h3 className="font-bold text-lg mb-2 border-b-2 border-blue-800 pb-1">
                      <span className="text-blue-800">INVOICE TO</span>
                    </h3>
                    <div className="text-sm">
                      <div className="font-bold text-base">{invoice.clientName}</div>
                      {invoice.clientEmail && <div>Client VAT: {invoice.clientEmail}</div>}
                      {invoice.clientPhone && <div>Phone: {invoice.clientPhone}</div>}
                      {invoice.clientAddress && <div>{invoice.clientAddress}</div>}
                    </div>
                  </div>
                  <div className="text-right" style={{ width: "48%" }}>
                    <h3 className="font-bold text-lg mb-2 border-b-2 border-blue-800 pb-1 text-right">
                      <span className="text-blue-800">INVOICE DETAILS</span>
                    </h3>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="font-bold">Invoice # / رقم الفاتورة:</span>
                        <span>{invoice.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Date / التاريخ:</span>
                        <span>{new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString("en-GB")}</span>
                      </div>
                      {invoice.poNumber && (
                        <div className="flex justify-between">
                          <span className="font-bold">PO # / رقم أمر الشراء:</span>
                          <span>{invoice.poNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-4">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-blue-800 text-white">
                        <th className="py-2 px-2 text-left border border-gray-300" style={{ width: "40%" }}>Description / الوصف</th>
                        <th className="py-2 px-2 text-center border border-gray-300" style={{ width: "10%" }}>Qty / الكمية</th>
                        <th className="py-2 px-2 text-center border border-gray-300" style={{ width: "15%" }}>Rate / السعر</th>
                        <th className="py-2 px-2 text-center border border-gray-300" style={{ width: "15%" }}>Taxable / المبلغ</th>
                        <th className="py-2 px-2 text-center border border-gray-300" style={{ width: "20%" }}>Total (SAR) / المجموع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((item) => {
                        const itemTotal = parseFloat(item.amount);
                        return (
                          <tr key={item.id} className="border-b border-gray-300">
                            <td className="py-2 px-2 border border-gray-300">{item.description}</td>
                            <td className="py-2 px-2 text-center border border-gray-300">{item.quantity}</td>
                            <td className="py-2 px-2 text-center border border-gray-300">{parseFloat(item.rate).toFixed(2)}</td>
                            <td className="py-2 px-2 text-center border border-gray-300">{itemTotal.toFixed(2)}</td>
                            <td className="py-2 px-2 text-center border border-gray-300 font-bold">
                              {(itemTotal * (1 + taxRate)).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end items-start mb-6">
                  <div className="w-64 space-y-1 border-t-2 border-blue-800 pt-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>SAR {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>VAT ({taxRatePercent}%)</span>
                      <span>SAR {taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-blue-900 pt-1">
                      <span>Net Amount:</span>
                      <span>SAR {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="grid grid-cols-3 gap-4 items-start mt-8 border-t border-gray-100 pt-4" style={{ pageBreakInside: "avoid" }}>
                  <div className="col-span-1">
                    <div className="mb-4">
                      <h4 className="font-bold text-blue-800 text-sm mb-1 uppercase">Amount in Words</h4>
                      <p className="text-[11px] italic leading-tight">{numberToWords(Math.floor(total))} Saudi Riyals Only</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-800 text-sm mb-1 uppercase">Bank Details</h4>
                      <div className="text-[11px] space-y-0.5">
                        <p><span className="font-semibold">Bank:</span> Al Jazeera Bank</p>
                        <p><span className="font-semibold">IBAN:</span> SA1160100012882448735001</p>
                        <p><span className="font-semibold">A/C:</span> 0128-82448735001</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-1 px-2">
                    {invoice.description && (
                      <div className="h-full">
                        <h4 className="font-bold text-blue-800 text-sm mb-1 uppercase">Description</h4>
                        <p className="text-[11px] text-gray-700 whitespace-pre-wrap leading-tight">{invoice.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="col-span-1 flex flex-col items-center">
                    {qrData?.qrCode && (
                      <img src={qrData.qrCode} alt="QR Code" className="w-24 h-24 mb-2" />
                    )}
                    <div className="mt-2 w-full max-w-[150px]">
                      <svg
                        viewBox={`0 0 ${barcodeWidth} 36`}
                        className="h-9 w-full bg-white"
                        role="img"
                        aria-label={`Barcode for ${invoice.invoiceNumber}`}
                        preserveAspectRatio="none"
                      >
                        {(() => {
                          let x = 0;
                          return barcodeBars.map((barWidth, index) => {
                            const isDark = index % 2 === 0;
                            const rect = (
                              <rect
                                key={`${index}-${x}`}
                                x={x}
                                y={0}
                                width={barWidth}
                                height={30}
                                fill={isDark ? "#111827" : "#ffffff"}
                              />
                            );
                            x += barWidth;
                            return rect;
                          });
                        })()}
                      </svg>
                      <p className="mt-1 text-[9px] font-medium tracking-[0.18em] text-center text-gray-700">
                        {invoice.invoiceNumber}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 text-center border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                    <MapPin className="h-3.5 w-3.5 text-blue-800" />
                    <p>
                      Jeddah -Al Bawadi Distt. Qurashi sT. -Quraish Center -Al Madina Road Junction
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-blue-800" />
                      <span>info@assetpaths.com</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-blue-800" />
                      <span>www.assetpaths.co</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-blue-800" />
                      <span>0554690329</span>
                    </span>
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
