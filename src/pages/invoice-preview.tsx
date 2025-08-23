import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, Printer, Share } from "lucide-react";
import { type Invoice } from "@/lib/schema";
import logoPath from "@assets/image_17540348329.png";
import { generateEnhancedPDF } from "@/utils/enhanced-pdf-generator";

interface InvoicePreviewPageProps {
  params: { id: string };
}

export default function InvoicePreviewPage({
  params,
}: InvoicePreviewPageProps) {
  const [, setLocation] = useLocation();
  const invoiceId = parseInt(params.id);

  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery<Invoice>({
    queryKey: ["/api/invoices", invoiceId],
    queryFn: async () => {
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch invoice");
      }
      return response.json();
    },
  });

  const { data: invoiceItems = [] } = useQuery<any[]>({
    queryKey: ["/api/invoices", invoiceId, "items"],
    queryFn: async () => {
      const response = await fetch(`/api/invoices/${invoiceId}/items`);
      if (!response.ok) {
        throw new Error("Failed to fetch invoice items");
      }
      return response.json();
    },
    enabled: !!invoiceId,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      await generateEnhancedPDF(
        {
          elementId: "invoice-content",
          filename: `Invoice-${invoice?.invoiceNumber || invoiceId}.pdf`,
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
            "Creating high-quality PDF with perfect layout preservation...",
        }
      );

      console.log("PDF generated successfully with enhanced quality");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(
        `Error generating PDF: ${(error as Error).message || "Unknown error"}. Please try again.`
      );
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Invoice ${invoice?.invoiceNumber}`,
        text: `Invoice for ${invoice?.clientName}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Invoice link copied to clipboard");
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

      return result.trim();
    }

    if (num < 0) return "Negative " + numberToWords(Math.abs(num));

    let result = "";
    let scaleIndex = 0;

    while (num > 0) {
      const chunk = num % 1000;
      if (chunk !== 0) {
        const chunkWords = convertHundreds(chunk);
        const scale = scales[scaleIndex];
        result =
          chunkWords +
          (scale ? " " + scale : "") +
          (result ? " " + result : "");
      }
      num = Math.floor(num / 1000);
      scaleIndex++;
    }

    return result || "Zero";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading invoice...</div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Invoice Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The requested invoice could not be found.
            </p>
            <Button onClick={() => setLocation("/invoices")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-white">
      {/* Header Actions */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 print:hidden">
        <div className="container mx-auto px-4 lg:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/invoices")}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Invoice {invoice.invoiceNumber}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  For {invoice.clientName}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={handleShare}
                className="w-full sm:w-auto"
              >
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                className="w-full sm:w-auto"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleDownloadPDF} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="container mx-auto p-4 lg:p-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent id="invoice-content" className="p-4 lg:p-8">
            {/* Company Header */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-200 dark:border-gray-700">
              {/* Company Name - Top Left */}
              <div className="flex-1">
                <div className="mb-6">
                  <h1 className="invoice-company text-xl lg:text-2xl font-bold text-blue-900 dark:text-blue-900 mb-3 tracking-tight">
                    Diouf Al Sharq General Contracting Company
                  </h1>
                  <h2
                    className="invoice-company text-lg lg:text-xl font-semibold text-blue-800 dark:text-blue-800 leading-tight mb-4 text-left"
                    dir="rtl"
                  >
                    شركة ضيوف الشرق للمقاولات العامة شركة شخص واحد
                  </h2>
                </div>
                <div className="invoice-body text-sm text-gray-700 dark:text-gray-500 space-y-2 leading-relaxed">
                  <p className="font-medium">
                    VAT: <span className="font-mono">310205801200003</span>
                  </p>
                  <p className="font-medium">
                    Email:{" "}
                    <span className="font-normal">
                      jaffarahmad895@gmail.com
                    </span>
                  </p>
                  <p className="font-medium">
                    Phone: <span className="font-mono">03469416004</span>
                  </p>
                  <p className="font-medium">
                    Address: <span className="font-normal">Shangla</span>
                  </p>
                </div>
              </div>

              {/* Logo and Tax Invoice - Top Right */}
              <div className="flex flex-col items-center space-y-3">
                <img
                  src={logoPath}
                  alt="Diouf Al-Sharq Logo"
                  className="object-contain"
                  style={{ height: "108px" }}
                />
                <div className="text-center">
                  <h3 className="invoice-title text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-900 mb-2">
                    TAX INVOICE
                  </h3>
                  <p
                    className="invoice-body text-base lg:text-lg text-gray-700 dark:text-gray-700 font-medium"
                    dir="rtl"
                  >
                    فاتورة ضريبية
                  </p>
                </div>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* QR Code positioned at top center */}
            <div className="flex justify-center mb-8">
              <div className="text-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`Invoice: ${invoice.invoiceNumber}\nClient: ${invoice.clientName}\nAmount: ${(invoice.totalAmount || 0).toLocaleString()} SAR\nDate: ${new Date(invoice.createdAt || new Date()).toLocaleDateString()}\nDue: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"}\nEmail: jaffarahmad895@gmail.com\nPhone: 03469416004\nAddress: Shangla`)}`}
                  alt="Invoice QR Code"
                  className="w-20 h-20"
                />
              </div>
            </div>

            {/* Invoice Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              {/* Left Column - Client Info */}
              <div>
                <h3 className="invoice-heading text-xl font-bold text-gray-900 dark:text-gray-900 mb-4 text-left tracking-wide">
                  BILL TO
                </h3>
                <div className="p-3">
                  <div className="space-y-2">
                    <p className="invoice-heading font-bold text-xl text-gray-900 dark:text-gray-100 mb-3">
                      {invoice.clientName}
                    </p>
                    <p className="invoice-body text-gray-700 dark:text-gray-400 leading-relaxed">
                      <span className="font-semibold">Email:</span>{" "}
                      <span className="font-normal">{invoice.clientEmail}</span>
                    </p>
                    <p className="invoice-body text-gray-700 dark:text-gray-400 leading-relaxed">
                      <span className="font-semibold">Phone:</span>{" "}
                      <span className="font-mono">{invoice.clientPhone}</span>
                    </p>
                    <p className="invoice-body text-gray-700 dark:text-gray-400 leading-relaxed">
                      <span className="font-semibold">Address:</span>{" "}
                      <span className="font-normal">
                        {invoice.clientAddress}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Invoice Info */}
              <div>
                <h2 className="invoice-heading text-xl font-bold text-gray-900 dark:text-gray-900 mb-4 text-right tracking-wide">
                  INVOICE
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-end items-center gap-6">
                    <span className="invoice-body font-semibold text-gray-800 dark:text-gray-300">
                      Invoice Number:
                    </span>
                    <span className="invoice-amount font-bold text-lg text-gray-900 dark:text-gray-100">
                      {invoice.invoiceNumber}
                    </span>
                  </div>
                  <div className="flex justify-end items-center gap-6">
                    <span className="invoice-body font-semibold text-gray-800 dark:text-gray-300">
                      Date Issued:
                    </span>
                    <span className="invoice-body font-medium text-gray-900 dark:text-gray-100">
                      {new Date(
                        invoice.createdAt || new Date()
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-end items-center gap-6">
                    <span className="invoice-body font-semibold text-gray-800 dark:text-gray-300">
                      Due Date:
                    </span>
                    <span className="invoice-body font-medium text-gray-900 dark:text-gray-100">
                      {invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-end items-center gap-6">
                    <span className="invoice-body font-semibold text-gray-800 dark:text-gray-300">
                      Status:
                    </span>
                    <Badge
                      className={`${getStatusColor(invoice.status)} font-medium`}
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Services/Items Table */}
            <div className="mb-8">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50 dark:bg-blue-900/20">
                      <TableHead className="invoice-table text-center font-bold text-gray-900 dark:text-gray-100 w-20 whitespace-nowrap py-4">
                        <div>ITEM#</div>
                        <div className="text-xs font-medium mt-1" dir="rtl">
                          رقم الصنف
                        </div>
                      </TableHead>
                      <TableHead className="invoice-table font-bold text-gray-900 dark:text-gray-100 py-4">
                        <div>DESCRIPTION</div>
                        <div className="text-xs font-medium mt-1" dir="rtl">
                          الوصف
                        </div>
                      </TableHead>
                      <TableHead className="invoice-table text-center font-bold text-gray-900 dark:text-gray-100 w-20 py-4">
                        <div>QTY</div>
                        <div className="text-xs font-medium mt-1" dir="rtl">
                          الكمية
                        </div>
                      </TableHead>
                      <TableHead className="invoice-table text-right font-bold text-gray-900 dark:text-gray-100 w-24 py-4">
                        <div>RATE</div>
                        <div className="text-xs font-medium mt-1" dir="rtl">
                          السعر
                        </div>
                      </TableHead>
                      <TableHead className="invoice-table text-right font-bold text-gray-900 dark:text-gray-100 w-32 whitespace-nowrap py-4">
                        <div>TAXABLE AMOUNT</div>
                        <div className="text-xs font-medium mt-1" dir="rtl">
                          المبلغ الخاضع للضريبة
                        </div>
                      </TableHead>
                      <TableHead className="invoice-table text-right font-bold text-gray-900 dark:text-gray-100 w-28 whitespace-nowrap py-4">
                        <div>TAX (SAR)</div>
                        <div className="text-xs font-medium mt-1" dir="rtl">
                          الضريبة
                        </div>
                      </TableHead>
                      <TableHead className="invoice-table text-right font-bold text-gray-900 dark:text-gray-100 w-32 whitespace-nowrap py-4">
                        <div>NET AMOUNT</div>
                        <div className="text-xs font-medium mt-1" dir="rtl">
                          صافي المبلغ
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.length > 0 ? (
                      invoiceItems.map((item, index) => {
                        const taxableAmount = parseFloat(item.amount);
                        const taxAmount = taxableAmount * 0.15; // 15% VAT
                        const netAmount = taxableAmount + taxAmount;

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="invoice-table text-center font-bold py-4">
                              {String(index + 1).padStart(3, "0")}
                            </TableCell>
                            <TableCell className="py-4">
                              <div>
                                <p className="invoice-body font-semibold text-base leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="invoice-table text-center font-medium py-4">
                              {parseFloat(item.quantity)}
                            </TableCell>
                            <TableCell className="invoice-amount text-right font-semibold py-4">
                              {parseFloat(item.rate).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="invoice-amount text-right font-semibold py-4">
                              {taxableAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="invoice-amount text-right font-semibold py-4">
                              {taxAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="invoice-amount text-right font-bold text-base py-4">
                              {netAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell className="text-center font-medium">
                          001
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">Construction Services</p>
                            {invoice.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {invoice.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">1</TableCell>
                        <TableCell className="text-right font-mono">
                          {parseFloat(invoice.subtotal?.toString() || "0").toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {parseFloat(invoice.subtotal?.toString() || "0").toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {parseFloat(invoice.taxAmount || "0").toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {parseFloat(invoice.totalAmount?.toString() || "0").toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Amount Summary */}
            <div className="mb-8">
              <div className="flex justify-end">
                <div className="w-full sm:w-80">
                  <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2">
                        <span className="invoice-body font-semibold text-gray-800 dark:text-gray-300">
                          Subtotal:
                        </span>
                        <span className="invoice-amount font-bold text-lg text-gray-900 dark:text-gray-100">
                          {parseFloat(invoice.subtotal?.toString() || "0").toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}{" "}
                          SAR
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="invoice-body font-semibold text-gray-800 dark:text-gray-300">
                          VAT 15%:
                        </span>
                        <span className="invoice-amount font-bold text-lg text-gray-900 dark:text-gray-100">
                          {parseFloat(invoice.taxAmount || "0").toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}{" "}
                          SAR
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center py-3">
                        <span className="invoice-heading font-bold text-xl text-gray-900 dark:text-gray-100">
                          Total Amount:
                        </span>
                        <span className="invoice-amount font-bold text-2xl text-blue-600 dark:text-blue-400">
                          {parseFloat(invoice.totalAmount?.toString() || "0").toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}{" "}
                          SAR
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount in Words */}
            <div className="mb-6">
              <div className="bg-white dark:bg-white p-4 rounded border border-gray-200 dark:border-gray-700">
                <p className="invoice-body text-base text-gray-900 dark:text-gray-900 leading-relaxed">
                  <span className="font-bold text-gray-800 dark:text-gray-800">
                    Amount in Words:{" "}
                  </span>
                  <span className="font-medium text-sm">
                    {numberToWords(Math.round(parseFloat(invoice.totalAmount?.toString() || "0")))}{" "}
                    Saudi Riyals Only
                  </span>
                </p>
              </div>
            </div>

            {/* Payment Information */}
            {invoice.status === "paid" && invoice.paidDate && (
              <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                  Payment Information
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  This invoice was paid on{" "}
                  {new Date(invoice.paidDate).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Payment Terms & Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
              {/* Bank Details */}
              <div>
                <h3 className="invoice-heading text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Bank Details
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2">
                      <span className="invoice-body font-semibold text-gray-800 dark:text-gray-300">
                        Bank:
                      </span>
                      <span className="invoice-body font-bold text-gray-900 dark:text-gray-100">
                        Riyad Bank
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="invoice-body font-semibold text-gray-800 dark:text-gray-300">
                        Account No:
                      </span>
                      <span className="invoice-amount font-bold text-gray-900 dark:text-gray-100">
                        176331013994
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="invoice-body font-semibold text-gray-800 dark:text-gray-300">
                        IBAN No:
                      </span>
                      <span className="invoice-amount font-bold text-gray-900 dark:text-gray-100">
                        SA572000000176331013940
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-6 border-t-2 border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Email: jaffarahmad895@gmail.com | Phone: 03469416004 |
                  Address: Shangla
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  © 2025 DIOUF AL-SHARQ GENERAL CONTRACTING COMPANY. All rights
                  reserved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
