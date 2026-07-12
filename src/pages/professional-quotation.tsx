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
import { generateA4PDF } from "@/utils/html2pdf-generator";
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
    reference: "QUO-2024-001",
    date: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    clientName: "Sample Client Company",
    project: "Sample Construction Project",
    subject: "Quotation for Construction Services",
  });

  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: "1",
      srNo: 1,
      description: "Concrete Foundation Work",
      unit: "m³",
      rate: "450.00",
    },
    {
      id: "2",
      srNo: 2,
      description: "Steel Structure Installation",
      unit: "ton",
      rate: "2,800.00",
    },
    {
      id: "3",
      srNo: 3,
      description: "Electrical Wiring and Installation",
      unit: "point",
      rate: "125.00",
    },
  ]);

  const addItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      srNo: items.length + 1,
      description: "",
      unit: "",
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
    try {
      console.log('🚀 Starting PDF export with html2pdf.js...');
      
      const fileName = `${quotationData.reference || 'Professional_Quotation'}_${new Date()
        .toISOString()
        .split("T")[0]}.pdf`;
      
      await generateA4PDF('professional-quotation-content', fileName);
      
      console.log('✅ PDF export completed successfully!');
    } catch (error) {
      console.error('❌ PDF export failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="bg-gray-50 p-6">
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
                  placeholder="Enter reference number (e.g., QTN-2025-001)"
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
                  placeholder="Enter date (e.g., 5 August 2025)"
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
                  placeholder="Enter client company name"
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
                  placeholder="Enter project name or location"
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
                  placeholder="Enter quotation subject or description"
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
                      placeholder="Enter detailed item description..."
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
                      placeholder="SQM, PCS, etc."
                      value={item.unit}
                      onChange={e =>
                        updateItem(item.id, "unit", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Rate</Label>
                    <Input
                      placeholder="0.00"
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
          id="professional-quotation-content"
          className="pdf-content bg-white shadow-lg relative mx-auto"
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
                <div className="text-sm mb-1">CONTRACTING COMPANY</div>
                <div className="text-xs mb-2">C.R 4030313386 / 700509451</div>
                {/* 3 red lines below company name */}
                <div className="flex flex-col space-y-1">
                  <div className="w-40 h-1 bg-red-600 rounded-sm shadow-sm"></div>
                  <div className="w-40 h-1 bg-red-600 rounded-sm shadow-sm"></div>
                  <div className="w-40 h-1 bg-red-600 rounded-sm shadow-sm"></div>
                </div>
              </div>

              {/* Center - Logo */}
              <div className="flex-shrink-0 mx-8">
                <div className="w-20 h-20 flex items-center justify-center">
                  <img
                    src={logoImage}
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
                <div className="text-xs mb-2">س.ت ٤٠٣٠٣١٣٣٨٦ / ٧٠٠٥٠٩٤٥١٦</div>
                {/* 3 red lines below Arabic company name */}
                <div className="flex flex-col items-start space-y-1">
                  <div className="w-40 h-1 bg-red-600 rounded-sm shadow-sm"></div>
                  <div className="w-40 h-1 bg-red-600 rounded-sm shadow-sm"></div>
                  <div className="w-40 h-1 bg-red-600 rounded-sm shadow-sm"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pb-16 quotation-content compact-spacing quotation-section">
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
            <div className="mb-8 quotation-items">
              <table className="w-full border-collapse">
                <thead className="table-header-group">
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
                    <tr key={item.id} className="no-page-break">
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
            <div className="mb-6 quotation-section terms-section">
              <div className="text-sm font-bold mb-3 text-gray-900 border-b-2 border-red-600 pb-1 shadow-sm">
                Terms and Conditions:
              </div>
              <div className="text-xs space-y-1 text-gray-800 leading-relaxed terms-compact">
                <div>
                  Rates are exclusive of VAT (if applicable).
                </div>
                <div>
                  Quotation is valid for 30 days from the issue date.
                </div>
                <div>
                  Work will be executed as per site conditions and approved specifications.
                </div>
                <div>
                  Payment terms to be agreed upon before commencement of work.
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

            {/* Company Stamp Only */}
            <div className="flex justify-end items-end footer-section no-page-break">
              <div className="text-center company-stamp">
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
          <div className="mt-8">
            {/* Thick Red Line */}
            <div className="w-full h-1 bg-red-600 mb-2 shadow-sm"></div>
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
          
          .quotation-content {
            page-break-inside: auto;
          }
          
          .footer-section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .terms-section {
            page-break-inside: auto !important;
            break-inside: auto !important;
            page-break-before: auto !important;
          }
        }
        
        /* PDF Export styles */
        .pdf-export {
          background: white !important;
          color: black !important;
          font-family: 'Inter', Arial, sans-serif !important;
          line-height: 1.3 !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          padding: 3mm !important;
          width: 210mm !important;
          min-height: auto !important;
          box-sizing: border-box !important;
          overflow: visible !important;
          position: relative !important;
          page-break-inside: auto !important;
        }
        

        
        .pdf-export * {
          color: black !important;
          background: white !important;
          box-shadow: none !important;
          border-color: black !important;
        }
        
        .pdf-export .quotation-content {
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 204mm !important;
          margin-bottom: 5mm !important;
          position: relative !important;
          page-break-inside: auto !important;
        }
        
        .pdf-export table {
          border-collapse: collapse !important;
          width: 100% !important;
          margin: 1rem 0 !important;
          table-layout: fixed !important;
          page-break-inside: auto !important;
        }
        
        .pdf-export th,
        .pdf-export td {
          border: 1px solid #333 !important;
          padding: 6px !important;
          text-align: left !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          font-size: 12px !important;
          line-height: 1.3 !important;
        }
        
        .pdf-export th {
          background-color: #ea580c !important;
          color: white !important;
          font-weight: bold !important;
          text-align: center !important;
        }
        
        .pdf-export tbody tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .pdf-export .footer-section {
          margin-top: 1rem !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 3mm !important;
          position: relative !important;
        }
        
        .pdf-export .mt-8 {
          margin-top: 1rem !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .pdf-export .bg-gradient-to-r {
          background: #dc2626 !important;
          height: 3px !important;
          width: 100% !important;
        }
        
        .pdf-export .footer-section .text-center {
          text-align: center !important;
          font-size: 11px !important;
          line-height: 1.3 !important;
          margin: 0.5rem 0 !important;
        }
        
        .pdf-export .footer-section .text-xs {
          font-size: 10px !important;
          line-height: 1.2 !important;
        }
        
        .pdf-export .footer-section .font-bold {
          font-weight: bold !important;
        }
        
        .pdf-export .company-stamp {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
          text-align: center !important;
          position: relative !important;
        }
        
        .pdf-export .company-stamp img {
          max-width: 100px !important;
          height: auto !important;
          display: block !important;
          margin: 0 auto !important;
          object-fit: contain !important;
          filter: contrast(1.2) !important;
        }
        
        .pdf-export .company-stamp .text-xs {
          margin-top: 0.25rem !important;
          text-align: center !important;
          font-size: 9px !important;
          font-weight: bold !important;
          color: #666 !important;
        }
        
        .pdf-export .terms-section {
          page-break-inside: auto !important;
          break-inside: auto !important;
          margin-top: 4mm !important;
          margin-bottom: 6mm !important;
          padding-bottom: 3mm !important;
        }
        
        .pdf-export .terms-section > div {
          margin-bottom: 2px !important;
          page-break-inside: auto !important;
          break-inside: auto !important;
          line-height: 1.1 !important;
          font-size: 10px !important;
        }
        
        .pdf-export .terms-section .text-sm {
          font-size: 12px !important;
          font-weight: bold !important;
          margin-bottom: 6px !important;
        }
        
        .pdf-export .terms-section .text-xs {
          font-size: 9px !important;
          line-height: 1.1 !important;
        }
        
        .pdf-export .terms-section h3 {
          page-break-after: avoid !important;
          break-after: avoid !important;
          margin-bottom: 6px !important;
          margin-top: 0 !important;
        }
        
        .pdf-export .terms-section p {
          margin-top: 0 !important;
          margin-bottom: 2px !important;
          orphans: 1 !important;
          widows: 1 !important;
        }
        
        .pdf-export h1,
        .pdf-export h2,
        .pdf-export h3 {
          color: black !important;
          margin: 1rem 0 0.5rem 0 !important;
        }
        
        .pdf-export .signature-block {
          margin-top: 2rem !important;
          border-top: 1px solid black !important;
          padding-top: 1rem !important;
        }
       `}</style>
    </div>
  );
}
