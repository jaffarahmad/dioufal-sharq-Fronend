import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  FileText,
  Plus,
  Trash2,
  Download,
} from "lucide-react";
import { useLocation } from "wouter";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import companyStamp from "@assets/image_17540348329.png";
import logoImage from "@assets/image-logo.png";

interface QuotationItem {
  id: string;
  srNo: number;
  description: string;
  unit: string;
  rate: string;
}

export default function ProfessionalQuotation() {
  const [, setLocation] = useLocation();
  const quotationRef = useRef<HTMLDivElement>(null);

  const [quotationData, setQuotationData] = useState({
    reference: "QTN-CR6G-408-25",
    date: "5 August 2025",
    clientName: "M/S. China Railway Engineering Group",
    project: "Riyadh/Al Qassim",
    subject: "Quotation of asphalt Work to QASSIM-2 1980MW CCGT",
  });

  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: "1",
      srNo: 1,
      description:
        "Supply, lay, spread, and compact a hot-mix asphalt concrete binder course to a compacted thickness of 10 cm. The work shall be performed with the project drawings and specifications",
      unit: "SQM",
      rate: "92",
    },
    {
      id: "2",
      srNo: 2,
      description:
        "Supply, lay, spread, and compact a hot-mix asphalt concrete wearing course to a compacted thickness of 5 cm. The work shall be performed with the project drawings and specifications",
      unit: "SQM",
      rate: "92",
    },
  ]);

  const addItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      srNo: items.length + 1,
      description: "",
      unit: "SQM",
      rate: "",
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      const updatedItems = items.filter(item => item.id !== id);
      // Renumber items
      updatedItems.forEach((item, index) => {
        item.srNo = index + 1;
      });
      setItems(updatedItems);
    }
  };

  const updateItem = (
    id: string,
    field: keyof QuotationItem,
    value: string | number
  ) => {
    setItems(
      items.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Handle page overflow detection
  useEffect(() => {
    const checkPageOverflow = () => {
      const firstPage = document.querySelector(".quotation-page");
      const continuationPage = document.querySelector(".page-break");

      if (firstPage && continuationPage) {
        const firstPageHeight = firstPage.scrollHeight;
        const maxPageHeight = 1123; // A4 height in pixels at 96 DPI (297mm * 96/25.4)

        if (firstPageHeight > maxPageHeight) {
          (continuationPage as HTMLElement).style.display = "block";
        } else {
          (continuationPage as HTMLElement).style.display = "none";
        }
      }
    };

    // Check on component mount and when items change
    checkPageOverflow();

    // Also check after a short delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(checkPageOverflow, 100);

    return () => clearTimeout(timeoutId);
  }, [items, quotationData]);

  const exportToPDF = async () => {
    if (!quotationRef.current) return;

    const element = quotationRef.current;
    const originalStyles = {
      minHeight: element.style.minHeight,
      height: element.style.height,
      fontSize: element.style.fontSize,
      lineHeight: element.style.lineHeight,
    };

    try {
      // Step 1: Measure content with current styling
      element.style.minHeight = "auto";
      element.style.height = "auto";

      let canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        height: element.scrollHeight,
        width: element.scrollWidth,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 280; // Leave margin for footer
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Step 2: If content exceeds single page, try to compress
      if (imgHeight > pageHeight) {
        // Apply compression styles
        element.classList.add("pdf-compress");
        const termsSection = element.querySelector(".terms-section") as HTMLElement;
        const contentSection = element.querySelector(".quotation-content") as HTMLElement;

        if (termsSection) {
          termsSection.style.fontSize = "9px";
          termsSection.style.lineHeight = "1.1";
        }
        if (contentSection) {
          contentSection.style.lineHeight = "1.2";
        }

        // Re-capture with compressed styling
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow reflow
        canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          height: element.scrollHeight,
          width: element.scrollWidth,
        });

        imgHeight = (canvas.height * imgWidth) / canvas.width;
      }

      const imgData = canvas.toDataURL("image/png");

      // Step 3: Generate PDF based on final content size
      if (imgHeight <= pageHeight) {
        // Single page - add with proper margins
        const yOffset = 10; // Top margin
        pdf.addImage(imgData, "PNG", 0, yOffset, imgWidth, imgHeight);
      } else {
        // Multiple pages - ensure footer only on last page
        const fullPageHeight = 297;
        let heightLeft = imgHeight;
        let position = 0;
        let pageCount = 0;

        // First page
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= fullPageHeight;
        pageCount++;

        // Additional pages
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= fullPageHeight;
          pageCount++;
        }
      }

      pdf.save(`${quotationData.reference}.pdf`);
    } finally {
      // Restore original styles
      element.style.minHeight = originalStyles.minHeight;
      element.style.height = originalStyles.height;
      element.classList.remove("pdf-compress");

      // Reset any modified sections
      const termsSection = element.querySelector(".terms-section") as HTMLElement;
      const contentSection = element.querySelector(".quotation-content") as HTMLElement;
      if (termsSection) {
        termsSection.style.fontSize = "";
        termsSection.style.lineHeight = "";
      }
      if (contentSection) {
        contentSection.style.lineHeight = "";
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/quotations")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quotations
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Professional Quotation
            </h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Edit Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="reference">Reference Number</Label>
                <Input
                  id="reference"
                  value={quotationData.reference}
                  onChange={e =>
                    setQuotationData({
                      ...quotationData,
                      reference: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  value={quotationData.date}
                  onChange={e =>
                    setQuotationData({ ...quotationData, date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={quotationData.clientName}
                  onChange={e =>
                    setQuotationData({
                      ...quotationData,
                      clientName: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="project">Project</Label>
                <Input
                  id="project"
                  value={quotationData.project}
                  onChange={e =>
                    setQuotationData({
                      ...quotationData,
                      project: e.target.value,
                    })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={quotationData.subject}
                  onChange={e =>
                    setQuotationData({
                      ...quotationData,
                      subject: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Quotation Items</h3>
                <Button onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {items.map(item => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 items-start p-4 border rounded-lg"
                >
                  <div className="col-span-1">
                    <Label>Sr.#</Label>
                    <div className="text-sm font-medium">{item.srNo}</div>
                  </div>
                  <div className="col-span-7">
                    <Label>Description</Label>
                    <Textarea
                      value={item.description}
                      onChange={e =>
                        updateItem(item.id, "description", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Unit</Label>
                    <Input
                      value={item.unit}
                      onChange={e =>
                        updateItem(item.id, "unit", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Rate</Label>
                    <Input
                      value={item.rate}
                      onChange={e =>
                        updateItem(item.id, "rate", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Professional Quotation Template */}
        <div
          ref={quotationRef}
          className="bg-white shadow-lg relative mx-auto"
          style={{ width: "210mm", minHeight: "auto" }}
        >
          {/* Header */}
          <div className="relative bg-white" style={{ height: "100px" }}>
            <div className="flex items-start justify-between px-8 py-4 h-full">
              {/* Left side - Company Info */}
              <div className="text-black flex-1">
                <div className="text-lg font-bold mb-1">
                  DIOUF AL SHARQ GENERAL
                </div>
                <div className="text-sm mb-1">Contracting Company</div>
                <div className="text-xs mb-2">C.R 4030313386 / 700509451</div>
                {/* 3 red lines below company name */}
                <div className="flex flex-col space-y-1">
                  <div className="w-40 h-1 bg-gradient-to-r from-red-600 to-red-500 rounded-sm shadow-sm"></div>
                  <div className="w-40 h-1 bg-gradient-to-r from-red-600 to-red-500 rounded-sm shadow-sm"></div>
                  <div className="w-40 h-1 bg-gradient-to-r from-red-600 to-red-500 rounded-sm shadow-sm"></div>
                </div>
              </div>

              {/* Center - Logo */}
              <div className="flex-shrink-0 mx-8">
                <div className="w-20 h-20 flex items-center justify-center">
                  <img
                    src="/attached_assets/image-logo.png"
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                    style={{ width: '72px', height: '72px' }}
                  />
                </div>
              </div>

              {/* Right side - Arabic Info */}
              <div className="text-black text-right flex-1" dir="rtl">
                <div className="text-lg font-bold mb-1">شركة ضيوف الشرق</div>
                <div className="text-sm mb-1">للمقاولات العامة</div>
                <div className="text-xs mb-2">ست ٤٠٣٠٣١۳۳۸۱ / ٧٠٠٥٠٩٤٥١٦</div>
                {/* 3 red lines below Arabic company name */}
                <div className="flex flex-col items-start space-y-1">
                  <div className="w-40 h-1 bg-gradient-to-l from-red-600 to-red-500 rounded-sm shadow-sm"></div>
                  <div className="w-40 h-1 bg-gradient-to-l from-red-600 to-red-500 rounded-sm shadow-sm"></div>
                  <div className="w-40 h-1 bg-gradient-to-l from-red-600 to-red-500 rounded-sm shadow-sm"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pb-16 quotation-content compact-spacing">
            {/* Reference and Date */}
            <div className="flex justify-between mb-4">
              <div>
                <div className="text-sm font-medium">
                  Reference: {quotationData.reference}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">
                  Date: {quotationData.date}
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="mb-4">
              <div className="text-sm font-medium mb-2">
                {quotationData.clientName}
              </div>
              <div className="text-sm mb-2">
                Project: {quotationData.project}
              </div>
            </div>

            {/* Subject */}
            <div className="mb-6">
              <div className="text-sm font-bold mb-2">
                Subject: {quotationData.subject}
              </div>
            </div>

            {/* Greeting */}
            <div className="mb-6">
              <div className="text-sm">Dear Sir,</div>
              <div className="text-sm mt-2">
                Kindly refer to the quoted price for:
              </div>
            </div>

            {/* Table */}
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-orange-600 text-white">
                    <th
                      className="border border-gray-400 px-3 py-2 text-sm font-bold text-center"
                      style={{ width: "8%" }}
                    >
                      Sr.#
                    </th>
                    <th
                      className="border border-gray-400 px-3 py-2 text-sm font-bold text-center"
                      style={{ width: "62%" }}
                    >
                      Description
                    </th>
                    <th
                      className="border border-gray-400 px-3 py-2 text-sm font-bold text-center"
                      style={{ width: "15%" }}
                    >
                      Unit
                    </th>
                    <th
                      className="border border-gray-400 px-3 py-2 text-sm font-bold text-center"
                      style={{ width: "15%" }}
                    >
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="border border-gray-400 px-3 py-2 text-sm text-center">
                        {item.srNo}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-sm">
                        {item.description}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-sm text-center">
                        {item.unit}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-sm text-center">
                        {item.rate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-6">
              <div className="text-sm font-bold mb-3 text-gray-900 border-b-2 border-red-600 pb-1 shadow-sm">
                Terms and Conditions:
              </div>
              <div className="text-xs space-y-1 text-gray-800 leading-relaxed terms-compact terms-section">
                <div>
                  <span className="font-bold">1. Advance Payment:</span> The
                  client must pay 40% of the contract amount upfront. The rest
                  will be paid monthly based on the work's progress.
                </div>
                <div>
                  <span className="font-bold">2. VAT (Value Added Tax):</span> A
                  15% VAT will be added to the quoted price.
                </div>
                <div>
                  <span className="font-bold">3. Payment Deductions:</span> The
                  client cannot withhold or deduct any payments for goods and
                  services, even if they have a counterclaim or set-off.
                </div>
                <div>
                  <span className="font-bold">
                    4. Advice and Services Liability:
                  </span>{" "}
                  Any advice or service provided by the contractor, Diouf
                  AL-Sharq, is given in good faith, and the contractor is not
                  liable for any resulting loss or damage.
                </div>
                <div>
                  <span className="font-bold">5. Site Access and Permits:</span>{" "}
                  The client is responsible for providing site access and
                  obtaining all necessary permits for the work to begin. All
                  quantities are based on the Purchase Order (P.O.), and any
                  changes must be in writing.
                </div>
                <div>
                  <span className="font-bold">
                    6. Delays and Responsibility:
                  </span>{" "}
                  The client is responsible for any delays caused by the site
                  not being ready or due to access issues.
                </div>
                <div>
                  <span className="font-bold">7. Fixed Project Scope:</span> The
                  project scope is fixed. Any additional work must be agreed
                  upon and charged separately.
                </div>
                <div>
                  <span className="font-bold">8. Termination of Project:</span>{" "}
                  If the project is terminated by either party, the client must
                  immediately pay for all work completed up to the termination
                  date.
                </div>
              </div>
            </div>

            {/* Footer Text */}
            <div className="mb-6">
              <div className="text-sm mb-3">
                Your positive response will be highly Appreciated.
              </div>
              <div className="text-sm">Thanks, and Best Regards</div>
            </div>

            {/* Signature */}
            <div className="flex justify-between items-end footer-section">
              <div>
                <div className="text-sm font-bold mb-2">
                  Muhammad Hafeez Khan
                </div>
                <div className="text-sm mb-1">Executive Director</div>
                <div className="text-sm mb-1">Diouf al Sharq</div>
                <div className="text-sm">Cell: 00966632428200</div>
              </div>
              <div className="text-center">
                <div className="w-32 h-20 mb-2 flex items-center justify-center">
                  <img
                    src={companyStamp}
                    alt="Company Official Stamp"
                    className="w-full h-full object-contain"
                    style={{ filter: "contrast(1.2)" }}
                  />
                </div>
                <div className="w-24 h-1 border-b-2 border-gray-400 mx-auto"></div>
                <div className="text-xs text-gray-600 mt-1 font-medium">
                  Official Stamp
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0">
            {/* Thick Red Line */}
            <div className="w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600 mb-2 shadow-sm"></div>
            <div className="bg-white text-black text-center py-2 border-t border-gray-200">
              <div className="text-xs font-medium">
                Gharnath Street , opposite Saudi Aramco complex , mushrita
                Jeddah KSA
              </div>
              <div className="text-xs">
                Email :hussainbhader@gmail.com  website:www.dioufalsharq.com
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print and PDF Optimization Styles */}
      <style>{`
        @media print {
          * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          
          @page {
            margin: 15mm;
            size: A4;
          }
          
          .quotation-content {
            page-break-inside: avoid;
          }
          
          .footer-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        /* PDF Compression styles */
        .pdf-compress {
          font-size: 11px !important;
        }
        
        .pdf-compress .quotation-content {
          padding: 1rem 1.5rem 1rem !important;
          line-height: 1.2 !important;
        }
        
        .pdf-compress .footer-text {
          margin-bottom: 1rem !important;
        }
        
        .pdf-compress .signature-block {
          margin-bottom: 0.5rem !important;
        }
        
        .pdf-compress h2 {
          font-size: 14px !important;
          margin-bottom: 0.5rem !important;
        }
        
        .pdf-compress h3 {
           font-size: 12px !important;
           margin-bottom: 0.25rem !important;
         }
         
         /* Optimize for single-page layout */
          .single-page-optimized {
             max-height: 280mm;
             overflow: hidden;
           }
          
          .compact-spacing {
            line-height: 1.3;
          }
       `}</style>
    </div>
  );
}
