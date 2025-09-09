import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Download, Printer, Plus, Trash2 } from "lucide-react";

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

interface QuotationItem {
  id: string;
  description: string;
  unit: string;
  rate: string;
}

interface ExactQuotationTemplateProps {
  onSave?: (data: any) => void;
  initialData?: any;
}

export default function ExactQuotationTemplate({
  onSave,
  initialData,
}: ExactQuotationTemplateProps) {
  const [reference, setReference] = useState(
    initialData?.reference || "QTN-CREG-408-25"
  );
  const [date, setDate] = useState(initialData?.date || "5 August 2025");
  const [clientName, setClientName] = useState(
    initialData?.clientName || "M/S China Railway Engineering Group"
  );
  const [project, setProject] = useState(
    initialData?.project || "Buraidah / Al Qassim"
  );
  const [subject, setSubject] = useState(
    initialData?.subject || "Quotation of asphalt Work to QASSIM-2 1980MW CCGT"
  );
  const [items, setItems] = useState<QuotationItem[]>(
    initialData?.items || [
      {
        id: "1",
        description:
          "Supply, lay, spread, and compact a hot-mix asphalt concrete binder course to a compacted thickness of 10 cm. The work shall be performed with the project drawings and specifications",
        unit: "SQM",
        rate: "85",
      },
      {
        id: "2",
        description:
          "Supply, lay, spread, and compact a hot-mix asphalt concrete wearing course to a compacted thickness of 5 cm. The work shall be performed with the project drawings and specifications",
        unit: "SQM",
        rate: "92",
      },
    ]
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    setIsGeneratingPDF(true);

    try {
      // Load html2pdf library if not already loaded
      if (!(window as any).html2pdf) {
        await loadLibrary(
          "html2pdf",
          "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        );
      }

      const element = printRef.current;
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `DIOUF-AL-SHARQ-quotation-${reference}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
        },
        jsPDF: {
          unit: "in",
          format: "a4",
          orientation: "portrait",
        },
      };

      await (window as any).html2pdf().set(opt).from(element).save();
      console.log("PDF generated successfully");
    } catch (error) {
      console.error("PDF generation failed:", error);
      // Fallback to print dialog
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSaveData = () => {
    const data = {
      reference,
      date,
      clientName,
      project,
      subject,
      items,
    };
    if (onSave) {
      onSave(data);
    }
  };

  const addItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      description: "",
      unit: "SQM",
      rate: "",
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (
    id: string,
    field: keyof QuotationItem,
    value: string
  ) => {
    setItems(
      items.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Control Buttons - Only visible on screen, not in print */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 screen-only">
        <Button onClick={handlePrint} variant="outline" size="sm" title="Print">
          <Printer className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleDownloadPDF}
          variant="outline"
          size="sm"
          disabled={isGeneratingPDF}
          title="Download PDF"
        >
          {isGeneratingPDF ? "Generating..." : <Download className="h-4 w-4" />}
        </Button>
        <Button
          onClick={handleSaveData}
          variant="outline"
          size="sm"
          title="Save Data"
        >
          💾
        </Button>
      </div>

      {/* Printable Content */}
      <div
        ref={printRef}
        className="max-w-4xl mx-auto p-8 bg-white min-h-screen"
      >
        {/* Header with Company Branding */}
        <div className="relative pb-8 mb-6">
          {/* Left: English Company Name */}
          <div className="absolute left-0 top-0">
            <h1 className="text-lg font-bold text-purple-800 mb-1">
              DIOUF AL SHARQ GENERAL
            </h1>
            <p className="text-sm text-gray-700 font-medium">
              Contracting Company
            </p>
            <p className="text-xs text-gray-600 mt-1">
              C.R 4030313386 / 7005094516
            </p>
          </div>

          {/* Center: Company Logo */}
          <div className="flex justify-center pt-2">
            <div className="w-20 h-20 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">D</span>
            </div>
          </div>

          {/* Right: Arabic Company Name */}
          <div className="absolute right-0 top-0 text-right" dir="rtl">
            <h1 className="text-lg font-bold text-purple-800 mb-1">
              شركة أماني محمد العتيبي للمقاولات
            </h1>
            <p className="text-sm text-gray-700 font-medium">
              للمقاولات
            </p>
            <p className="text-xs text-gray-600 mt-1">
              س.ت ٤٠٣٠٣١٣٣٨٦ / ٧٠٠٥٠٩٤٥١٦
            </p>
          </div>

          {/* Red lines below header */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="flex items-center">
              <div className="flex-1 h-1 bg-red-600"></div>
              <div className="w-16"></div>
              <div className="flex-1 h-1 bg-red-600"></div>
            </div>
            <div className="flex items-center mt-1">
              <div className="flex-1 h-1 bg-red-600"></div>
              <div className="w-16"></div>
              <div className="flex-1 h-1 bg-red-600"></div>
            </div>
            <div className="flex items-center mt-1">
              <div className="flex-1 h-1 bg-red-600"></div>
              <div className="w-16"></div>
              <div className="flex-1 h-1 bg-red-600"></div>
            </div>
          </div>
        </div>

        {/* Reference and Date */}
        <div className="flex justify-between mb-6">
          <div className="screen-only">
            <label className="block text-sm font-medium mb-1">Reference:</label>
            <Input
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-48"
            />
          </div>
          <div className="screen-only">
            <label className="block text-sm font-medium mb-1">Date:</label>
            <Input
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-48"
            />
          </div>

          {/* Print version */}
          <div className="print-only hidden">
            <p>
              <strong>Reference:</strong> {reference}
            </p>
          </div>
          <div className="print-only hidden">
            <p>
              <strong>Date:</strong> {date}
            </p>
          </div>
        </div>

        {/* Client Information */}
        <div className="mb-6">
          <div className="screen-only mb-4">
            <label className="block text-sm font-medium mb-1">
              Client Name:
            </label>
            <Input
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="print-only hidden mb-2">
            <p>{clientName}</p>
          </div>

          <div className="screen-only mb-4">
            <label className="block text-sm font-medium mb-1">Project:</label>
            <Input
              value={project}
              onChange={e => setProject(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="print-only hidden mb-2">
            <p>
              <strong>Project:</strong> {project}
            </p>
          </div>

          <div className="screen-only mb-4">
            <label className="block text-sm font-medium mb-1">Subject:</label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="print-only hidden mb-4">
            <p>
              <strong>Subject:</strong> {subject}
            </p>
          </div>
        </div>

        {/* Dear Sir */}
        <div className="mb-6">
          <p className="font-medium">Dear Sir,</p>
          <p className="mt-2">Kindly refer to the quoted price for:</p>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-orange-500 text-white">
                <th className="border border-gray-400 px-3 py-2 text-left font-bold">
                  Sr.#
                </th>
                <th className="border border-gray-400 px-3 py-2 text-left font-bold">
                  Description
                </th>
                <th className="border border-gray-400 px-3 py-2 text-left font-bold">
                  Unit
                </th>
                <th className="border border-gray-400 px-3 py-2 text-left font-bold">
                  Rate
                </th>
                <th className="border border-gray-400 px-3 py-2 text-left font-bold screen-only">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-gray-400 px-3 py-2 text-center font-medium">
                    {index + 1}
                  </td>
                  <td className="border border-gray-400 px-3 py-2">
                    <div className="screen-only">
                      <Textarea
                        value={item.description}
                        onChange={e =>
                          updateItem(item.id, "description", e.target.value)
                        }
                        className="w-full min-h-[80px] border-none bg-white resize-none"
                      />
                    </div>
                    <div className="print-only hidden">{item.description}</div>
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-center">
                    <div className="screen-only">
                      <Input
                        value={item.unit}
                        onChange={e =>
                          updateItem(item.id, "unit", e.target.value)
                        }
                        className="w-16 text-center border-none bg-white"
                      />
                    </div>
                    <div className="print-only hidden">{item.unit}</div>
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-center">
                    <div className="screen-only">
                      <Input
                        value={item.rate}
                        onChange={e =>
                          updateItem(item.id, "rate", e.target.value)
                        }
                        className="w-16 text-center border-none bg-white"
                      />
                    </div>
                    <div className="print-only hidden">{item.rate}</div>
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-center screen-only">
                    <Button
                      onClick={() => removeItem(item.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 screen-only">
            <Button onClick={addItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Closing */}
        <div className="mb-8">
          <p className="mb-2">
            Your positive response will be highly Appreciated.
          </p>
          <p className="mb-6">Thanks, and Best Regards</p>
        </div>

        {/* Signature Section */}
        <div className="mb-8">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-medium mb-1">Muhammad Hafeez Khan</p>
              <p className="text-sm mb-1">Executive Director</p>
              <p className="text-sm mb-1">Diouf al Sharq</p>
              <p className="text-sm">Cell: 00966532428200</p>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-32 h-20 border-2 border-gray-400 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-500">4030313386</span>
              </div>
            </div>
          </div>

          {/* Signature line */}
          <div className="mt-8 w-48">
            <div className="border-b-2 border-gray-400 mb-2"></div>
            <p className="text-sm text-center">Signature</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12">
          {/* Red decorative design - thick center rectangle with thin lines */}
          <div className="mb-4 relative">
            {/* Left side - three thin lines */}
            <div className="absolute left-0 top-0 w-1/3">
              <div className="h-0.5 bg-red-1000 mb-1"></div>
              <div className="h-0.5 bg-red-1000 mb-1"></div>
              <div className="h-0.5 bg-red-1000"></div>
            </div>

            {/* Center - thick red rectangle */}
            <div className="absolute left-1/3 right-1/3 top-0">
              <div className="h-4 bg-red-600 rounded-sm"></div>
            </div>

            {/* Right side - three thin lines */}
            <div className="absolute right-0 top-0 w-1/3">
              <div className="h-0.5 bg-red-1000 mb-1"></div>
              <div className="h-0.5 bg-red-1000 mb-1"></div>
              <div className="h-0.5 bg-red-1000"></div>
            </div>

            {/* Spacer for height */}
            <div className="h-4"></div>
          </div>

          <div className="text-center">
            <p className="font-bold text-sm leading-relaxed">
              Gharnath Street, opposite Saudi Aramco complex, mushrifa Jeddah
              KSA
            </p>
            <p className="text-sm text-gray-600 mt-1">
              info@amani-alotaibi.com | www.amani-alotaibi.com
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        .screen-only {
          display: block;
        }
        
        @media print {
          * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .screen-only {
            display: none !important;
          }
          
          .print-hidden {
            display: none !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          input, textarea {
            border: none !important;
            background: white !important;
            box-shadow: none !important;
            resize: none !important;
            outline: none !important;
          }
          
          /* Preserve table borders */
          table, th, td {
            border: 1px solid #9ca3af !important;
            border-collapse: collapse !important;
          }
          
          /* Preserve header background */
          thead tr {
            background-color: #f97316 !important;
            color: white !important;
          }
          
          /* Ensure borders are visible */
          .border {
            border: 1px solid #9ca3af !important;
          }
          
          .border-gray-400 {
            border-color: #9ca3af !important;
          }
          
          .bg-orange-500 {
            background-color: #f97316 !important;
          }
          
          @page {
            margin: 1.5cm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
