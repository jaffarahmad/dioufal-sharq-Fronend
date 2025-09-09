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
import logoImage from "@assets/logo.view-invoice.png";

interface QuotationItem {
  id: string;
  srNo: number;
  description: string;
  unit: string;
  rate: string;
}

export default function AmaniQuotation() {
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
      
      const fileName = `${quotationData.reference || 'AMANI_MUHAMMAD_Quotation'}_${new Date()
        .toISOString()
        .split("T")[0]}.pdf`;
      
      await generateA4PDF('amani-quotation-content', fileName);
      
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
              AMANI MUHAMMAD Quotation
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

        {/* AMANI MUHAMMAD Quotation Template */}
        <div
          ref={quotationRef}
          id="amani-quotation-content"
          className="pdf-content bg-white shadow-lg relative mx-auto"
          style={{ width: "210mm", minHeight: "auto" }}
        >
          {/* Header */}
          <div className="relative bg-white" style={{ height: "100px" }}>
            <div className="flex items-start justify-between px-8 py-4 h-full">
              {/* Left side - Company Info */}
              <div className="text-black flex-1">
                <div className="text-lg font-bold mb-1" style={{ color: "#0ea5e9" }}>
                  AMANI MUHAMMAD AL OTAIBI
                </div>
                <div className="text-sm mb-1">GENERAL CONTRACTING COMPANY</div>
                <div className="text-xs mb-2">
                  <div>CR NO: 7050857452</div>
                  <div>VAT NO: 312169201500003</div>
                </div>
                {/* 3 sky blue lines below company name */}
                <div className="flex flex-col space-y-1">
                  <div className="w-40 h-1 bg-gradient-to-r from-sky-500 to-sky-400 rounded-sm shadow-sm"></div>
                  <div className="w-40 h-1 bg-gradient-to-r from-sky-500 to-sky-400 rounded-sm shadow-sm"></div>
                  <div className="w-40 h-1 bg-gradient-to-r from-sky-500 to-sky-400 rounded-sm shadow-sm"></div>
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
                <div className="text-lg font-bold mb-1" style={{ color: "#0ea5e9" }}>شركة أماني محمد العتيبي</div>
                <div className="text-sm mb-1">للمقاولات العامة</div>
                <div className="text-xs mb-2">
                  <div>CR NO: 7050857452</div>
                  <div>VAT NO: 312169201500003</div>
                </div>
                {/* 3 sky blue lines below Arabic company name */}
                <div className="flex flex-col items-start space-y-1">
                  <div className="w-40 h-1 bg-gradient-to-l from-sky-500 to-sky-400 rounded-sm shadow-sm"></div>
                  <div className="w-40 h-1 bg-gradient-to-l from-sky-500 to-sky-400 rounded-sm shadow-sm"></div>
                  <div className="w-40 h-1 bg-gradient-to-l from-sky-500 to-sky-400 rounded-sm shadow-sm"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 quotation-content compact-spacing quotation-section">
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
              <div className="text-sm">
                Dear Sir/Madam,
              </div>
              <div className="text-sm mt-2">
                We are pleased to submit our quotation for the above-mentioned project. Please find the details below:
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-sky-50">
                    <th className="border border-gray-300 p-2 text-left w-12">Sr.#</th>
                    <th className="border border-gray-300 p-2 text-left">Description</th>
                    <th className="border border-gray-300 p-2 text-center w-20">Unit</th>
                    <th className="border border-gray-300 p-2 text-right w-24">Rate (SAR)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-gray-300 p-2 text-center">{item.srNo}</td>
                      <td className="border border-gray-300 p-2">{item.description}</td>
                      <td className="border border-gray-300 p-2 text-center">{item.unit}</td>
                      <td className="border border-gray-300 p-2 text-right">{item.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-6">
              <div className="text-sm font-bold mb-2">Terms & Conditions</div>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Rates are exclusive of VAT (if applicable).</li>
                <li>Quotation is valid for 30 days from the issue date.</li>
                <li>Work will be executed as per site conditions and approved specifications.</li>
                <li>Payment terms to be agreed upon before commencement of work.</li>
              </ul>
            </div>

            {/* Signature */}
            <div className="flex justify-between items-end mb-8">
              <div>
                <div className="text-sm font-medium mb-2">Prepared by:</div>
              </div>
              <div className="text-right">
                <div className="w-24 h-16 border-b border-gray-400 mb-2"></div>
                <div className="text-xs">Authorized Signatory</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-gray-300 text-black p-4 mt-4">
            <div className="flex justify-center items-center text-xs">
              <div className="text-center">
                <div>📍 جدة العزيزية لشارع سبعين</div>
                <div>📧 joodinternationalinfo@gmail.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}