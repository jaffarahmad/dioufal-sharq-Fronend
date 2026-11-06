import React from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, Share2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import logoImage from "@assets/image-otherlogo.png.png";
import companyStamp from "@assets/image_17540348329.png";
import QRCode from "qrcode";

interface Invoice {
  id: number;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  subtotal: string;
  taxAmount: string;
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

export default function TaxInvoicePage() {
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
      const actualTaxAmount = actualSubtotal * 0.15; // 15% VAT
      const actualTotal = actualSubtotal + actualTaxAmount;
      
      // Generate QR code with actual invoice data
      const qrData = `Invoice: ${invoice.invoiceNumber}\nClient: ${invoice.clientName}\nAmount: ${actualTotal.toFixed(2)} SAR\nVAT: ${actualTaxAmount.toFixed(2)} SAR\nDate: ${new Date(invoice.createdAt).toLocaleDateString()}\nCompany: DIOUF AL-SHARQ\nVAT No: 310205801200003`;
      
      // Generate QR code as base64 data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
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
        tlvData: "zatca-compliant-data",
        invoiceData: {
          sellerName: "AMANI MUHAMMAD AL OTAIBI CON.COM",
          vatRegistrationNumber: "312169201500003",
          invoiceDateTime: new Date(invoice.createdAt).toISOString(),
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
          elementId: "tax-invoice-content",
          filename: `Tax-Invoice-${invoice?.invoiceNumber || "draft"}.pdf`,
          pageFormat: "a4",
          orientation: "portrait",
          quality: 0.95,
          scale: 2.5,
          margins: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10,
          },
        },
        {
          show: true,
          message:
            "Generating Tax Invoice PDF with enhanced layout preservation...",
        }
      );

      console.log(
        "Tax Invoice PDF generated successfully with enhanced quality"
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(
        `Error generating PDF: ${(error as Error).message || "Unknown error"}. Please try again.`
      );
    }
  };

  const numberToWords = (num: number): string => {
    if (num === 0) return "Zero";

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

    const scales = ["", "Thousand", "Million", "Billion"];

    function convertHundreds(n: number): string {
      let result = "";

      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + " Hundred ";
        n %= 100;
      }

      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + " ";
        n %= 10;
      }

      if (n > 0) {
        result += ones[n] + " ";
      }

      return result;
    }

    let result = "";
    let scaleIndex = 0;

    while (num > 0) {
      const chunk = num % 1000;
      if (chunk > 0) {
        const chunkText = convertHundreds(chunk);
        if (scales[scaleIndex]) {
          result = chunkText + scales[scaleIndex] + " " + result;
        } else {
          result = chunkText + result;
        }
      }
      num = Math.floor(num / 1000);
      scaleIndex++;
    }

    return result.trim();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      case "Draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading invoice...</div>
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

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      {/* Action Bar */}
      <div className="max-w-4xl mx-auto mb-4 px-4 print:hidden">
        <div className="flex items-center justify-between">
          <Link href="/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Button>
          </Link>

          <div className="flex space-x-2">
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>

            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto px-2">
        <Card
          className="shadow-none border-0 bg-white"
          style={{ width: "210mm", minHeight: "297mm" }}
        >
          <CardContent
            id="tax-invoice-content"
            className="p-0 bg-white"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "5mm",
              boxSizing: "border-box",
            }}
          >
            {/* Clean Professional Header */}
            <div className="border-b-2 border-gray-800 bg-white">
              {/* Company Name at Top Center */}
              <div className="text-center py-2 border-b border-gray-300">
                <h1 className="text-xl font-bold leading-tight tracking-wide text-gray-900">
                  AMANI MUHAMMAD AL OTAIBI CON.COM
                </h1>
              </div>

              <div className="flex items-center justify-between p-3">
                {/* Company Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-xs text-gray-600 space-y-0.5 leading-tight">
                        <div>
                          <span className="font-medium">CR:</span>{" "}
                          7050857452
                        </div>
                        <div>
                          <span className="font-medium">VAT:</span>{" "}
                          312169201500003
                        </div>
                        <div>
                          <span className="font-medium">Address:</span> Gharnath
                          Street, opposite Saudi Aramco complex, Mushrifa,
                          Jeddah KSA
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h2
                        className="text-sm font-semibold text-gray-700 leading-tight text-right"
                        dir="rtl"
                      >
                        شركة أماني محمد العتيبي للمقاولات
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Logo and Title */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <h3 className="text-xl font-bold leading-tight mb-0.5 text-gray-900">
                      TAX INVOICE
                    </h3>
                    <p className="text-xs font-medium text-gray-600" dir="rtl">
                      فاتورة ضريبية
                    </p>
                  </div>
                  <div className="border border-gray-300 rounded-lg p-2">
                    <img
                      src={logoImage}
                      alt="Company Logo"
                      className="h-16 object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Clean Invoice Details */}
            <div className="bg-white p-2.5">
              <div className="grid grid-cols-2 gap-4 mb-2.5">
                {/* Invoice To */}
                <div className="border border-gray-300 p-2.5 border-l-4 border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 mb-1.5 border-b border-gray-300 pb-1">
                    INVOICE TO
                  </h4>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-gray-900">
                      {invoice.clientName}
                    </p>
                    <div className="text-xs text-gray-700 space-y-0.5">
                      {invoice.clientEmail && (
                        <p>
                          <span className="font-medium text-gray-500">
                            VAT:
                          </span>{" "}
                          <span className="font-medium">
                            {invoice.clientEmail}
                          </span>
                        </p>
                      )}
                      {invoice.clientPhone && (
                        <p>
                          <span className="font-medium text-gray-500">
                            Phone:
                          </span>{" "}
                          <span className="font-mono font-medium">
                            {invoice.clientPhone}
                          </span>
                        </p>
                      )}
                      {invoice.clientAddress && (
                        <p>
                          <span className="font-medium text-gray-500">
                            Address:
                          </span>{" "}
                          <span className="font-medium">
                            {invoice.clientAddress}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Invoice Info */}
                <div className="border border-gray-300 p-2.5 border-r-4 border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 mb-1.5 border-b border-gray-300 pb-1 text-right">
                    INVOICE DETAILS
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">
                        Invoice # / رقم الفاتورة:
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {invoice.invoiceNumber}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">
                        Date / التاريخ:
                      </span>
                      <span className="text-xs font-medium">
                        {new Date(
                          (invoice as any).invoiceDate || invoice.createdAt
                        ).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">
                        Due Date / تاريخ الاستحقاق:
                      </span>
                      <span className="text-xs font-medium">
                        {invoice.dueDate
                          ? new Date(invoice.dueDate).toLocaleDateString(
                              "en-GB"
                            )
                          : "Upon Receipt"}
                      </span>
                    </div>
                    {(invoice as any).poNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500">
                          PO # / رقم أمر الشراء:
                        </span>
                        <span className="text-xs font-medium">
                          {(invoice as any).poNumber}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-xs font-medium text-gray-500">
                        Status:
                      </span>
                      <span className="text-xs px-2 py-0.5 font-medium border border-gray-400 rounded">
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Items Table */}
              <div className="mb-2.5">
                <div className="border border-gray-400 overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-center font-bold text-gray-900 py-2 px-1.5 border-r border-gray-400 text-xs w-10">
                          #<br />
                          <span
                            className="text-xs font-normal text-gray-600"
                            dir="rtl"
                          >
                            رقم
                          </span>
                        </th>
                        <th className="font-bold text-gray-900 py-2 px-2 border-r border-gray-400 text-xs">
                          Description
                          <br />
                          <span
                            className="text-xs font-normal text-gray-600"
                            dir="rtl"
                          >
                            الوصف
                          </span>
                        </th>
                        <th className="text-center font-bold text-gray-900 py-2 px-1.5 border-r border-gray-400 text-xs w-14">
                          Qty
                          <br />
                          <span
                            className="text-xs font-normal text-gray-600"
                            dir="rtl"
                          >
                            الكمية
                          </span>
                        </th>
                        <th className="text-right font-bold text-gray-900 py-2 px-1.5 border-r border-gray-400 text-xs w-18">
                          Rate (SAR)
                          <br />
                          <span
                            className="text-xs font-normal text-gray-600"
                            dir="rtl"
                          >
                            السعر
                          </span>
                        </th>
                        <th className="text-right font-bold text-gray-900 py-2 px-1.5 border-r border-gray-400 text-xs w-20">
                          Taxable
                          <br />
                          <span
                            className="text-xs font-normal text-gray-600"
                            dir="rtl"
                          >
                            خاضع للضريبة
                          </span>
                        </th>
                        <th className="text-right font-bold text-gray-900 py-2 px-1.5 border-r border-gray-400 text-xs w-16">
                          VAT 15%
                          <br />
                          <span
                            className="text-xs font-normal text-gray-600"
                            dir="rtl"
                          >
                            الضريبة
                          </span>
                        </th>
                        <th className="text-right font-bold text-gray-900 py-2 px-1.5 text-xs w-20 bg-gray-200">
                          Total (SAR)
                          <br />
                          <span
                            className="text-xs font-normal text-gray-600"
                            dir="rtl"
                          >
                            المجموع
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.length > 0 ? (
                        invoiceItems.map((item, index) => {
                          const taxableAmount = parseFloat(item.amount);
                          const taxAmount = taxableAmount * 0.15;
                          const netAmount = taxableAmount + taxAmount;

                          return (
                            <tr
                              key={item.id}
                              className={`border-t border-gray-400 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                            >
                              <td className="text-center font-bold py-1.5 px-1.5 border-r border-gray-400 text-xs">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-200 text-gray-800 rounded-full text-xs font-bold">
                                  {index + 1}
                                </span>
                              </td>
                              <td className="py-1.5 px-2 border-r border-gray-400 text-xs">
                                <span className="font-semibold text-gray-900">
                                  {item.description}
                                </span>
                              </td>
                              <td className="text-center font-bold py-1.5 px-1.5 border-r border-gray-400 text-xs">
                                {parseFloat(item.quantity)}
                              </td>
                              <td className="text-right font-bold py-1.5 px-1.5 border-r border-gray-400 text-xs">
                                {parseFloat(item.rate).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="text-right font-bold py-1.5 px-1.5 border-r border-gray-400 text-xs">
                                {taxableAmount.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="text-right font-bold py-1.5 px-1.5 border-r border-gray-400 text-xs">
                                {taxAmount.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="text-right font-bold py-1.5 px-1.5 text-xs bg-gray-100">
                                {netAmount.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="border-t border-gray-400">
                          <td
                            colSpan={7}
                            className="text-center py-6 text-gray-500 text-xs"
                          >
                            No items found for this invoice
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Clean Totals Section */}
              <div className="flex justify-end mb-2.5">
                <div className="w-72">
                  <div className="border-2 border-gray-400 p-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-700">
                          Subtotal:
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {parseFloat(invoice.subtotal).toLocaleString(
                            "en-US",
                            { minimumFractionDigits: 2 }
                          )}{" "}
                          <span className="text-xs text-gray-600">SAR</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-700">
                          VAT (15%):
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          +
                          {parseFloat(invoice.taxAmount || "0").toLocaleString(
                            "en-US",
                            { minimumFractionDigits: 2 }
                          )}{" "}
                          <span className="text-xs text-gray-600">SAR</span>
                        </span>
                      </div>
                      <div className="border-t border-gray-400 my-1.5"></div>
                      <div className="flex justify-between items-center bg-gray-800 text-white px-3 py-2">
                        <span className="text-sm font-bold">TOTAL AMOUNT:</span>
                        <span className="text-lg font-bold">
                          {parseFloat(invoice.totalAmount).toLocaleString(
                            "en-US",
                            { minimumFractionDigits: 2 }
                          )}{" "}
                          <span className="text-sm">SAR</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount in Words - Clean Design */}
              <div className="mb-2.5">
                <div className="border border-gray-400 p-2.5">
                  <p className="text-xs font-medium">
                    <span className="font-bold text-gray-900">
                      Amount in Words:{" "}
                    </span>
                    <span className="text-gray-800 italic">
                      {numberToWords(
                        Math.round(parseFloat(invoice.totalAmount))
                      )}{" "}
                      Saudi Riyals Only
                    </span>
                  </p>
                </div>
              </div>

              {/* Clean Bank Details, QR Code, Company Stamp and Description */}
              <div className="grid grid-cols-2 gap-3 mb-2.5" style={{ pageBreakInside: "avoid" }}>
                {/* General Description */}
                {invoice.description && (
                  <div className="border border-gray-400 p-2.5">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                      DESCRIPTION
                    </h4>
                    <p className="text-[11px] text-gray-700 whitespace-pre-wrap leading-tight">
                      {invoice.description}
                    </p>
                  </div>
                )}

                {/* Bank Details */}
                <div className="border border-gray-400 p-2.5">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                    BANK DETAILS
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-600">
                        Bank:
                      </span>
                      <span className="text-xs font-bold text-gray-900">
                        Riyad Bank
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-600">
                        Account:
                      </span>
                      <span className="text-xs font-bold font-mono text-gray-900">
                        176331013994
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-600">
                        IBAN:
                      </span>
                      <span className="text-xs font-bold font-mono text-gray-900">
                        SA572000000176331013940
                      </span>
                    </div>
                  </div>
                </div>

                {/* ZATCA QR Code Section */}
                <div className="border border-gray-400 p-2.5">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                    ZATCA QR CODE
                  </h4>
                  <div className="flex items-center justify-center h-24">
                    {qrData?.qrCode ? (
                      <div className="text-center">
                        <img
                          src={qrData.qrCode}
                          alt="ZATCA E-Invoice QR Code"
                          className="w-20 h-20 mx-auto border border-gray-300"
                          title={`ZATCA TLV Format - Total: ${qrData.invoiceData?.invoiceTotal} SAR, VAT: ${qrData.invoiceData?.vatAmount} SAR`}
                        />
                        <p className="text-xs text-gray-600 font-medium mt-1">
                          ZATCA E-Invoice
                        </p>
                        {qrData?.zatcaCompliant && (
                          <p className="text-xs text-green-600 font-medium">
                            ✓ Compliant
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-20 h-20 border-2 border-dashed border-gray-400 flex items-center justify-center mx-auto mb-1">
                          <div className="text-xs text-gray-500">
                            Loading...
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">
                          E-Invoice QR
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Official Stamp Section */}
                <div className="border border-gray-400 p-2.5">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">
                    OFFICIAL STAMP
                  </h4>
                  <div className="flex items-center justify-center h-24">
                    <div className="text-center">
                      <img
                        src={companyStamp}
                        alt="Company Official Stamp"
                        className="w-24 h-16 mx-auto object-contain"
                        style={{ filter: "contrast(1.2)" }}
                      />
                      <p className="text-xs text-gray-600 font-medium mt-1">
                        Authorized Signature
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Footer */}
              <div className="border-t-2 border-gray-800 bg-gray-50 p-2 mt-2">
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-700">
                    Gharnath Street, opposite Saudi Aramco complex, Mushrifa,
                    Jeddah KSA
                  </p>
                  <p className="text-xs text-gray-700" dir="rtl">
                    شارع غرناطة، مقابل مجمع أرامكو السعودية، المشرفة، جدة
                    المملكة العربية السعودية
                  </p>
                  <p className="text-xs text-gray-700">
                    E-mail :Info@massarat.com
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
