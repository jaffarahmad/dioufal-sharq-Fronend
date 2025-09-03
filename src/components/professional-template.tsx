import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Download, Printer, Plus, Trash2, Type } from "lucide-react";
import ProfessionalStamp from "./professional-stamp";
import logoImage from "@assets/image_17540348329.png";

import { generateEnhancedPDF } from '@/utils/enhanced-pdf-generator';



interface ProfessionalTemplateItem {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
  amount: string;
}

interface ProfessionalTemplateProps {
  onSave?: (data: any) => void;
  initialData?: any;
  type?: "quotation" | "invoice";
}

export default function ProfessionalTemplate({
  onSave,
  initialData,
  type = "quotation",
}: ProfessionalTemplateProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isRTL, setIsRTL] = useState(false);

  // Form state
  const [documentNumber, setDocumentNumber] = useState(
    initialData?.documentNumber ||
      `${type.toUpperCase()}-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`
  );
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split("T")[0]
  );
  const [clientName, setClientName] = useState(initialData?.clientName || "");
  const [clientAddress, setClientAddress] = useState(
    initialData?.clientAddress || ""
  );
  const [clientPhone, setClientPhone] = useState(
    initialData?.clientPhone || ""
  );
  const [clientEmail, setClientEmail] = useState(
    initialData?.clientEmail || ""
  );
  const [poNumber, setPoNumber] = useState(initialData?.poNumber || "");
  const [dueDate, setDueDate] = useState(initialData?.dueDate || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  const [items, setItems] = useState<ProfessionalTemplateItem[]>(
    initialData?.items || [
      {
        id: "1",
        description: "",
        quantity: "1",
        unit: "Item",
        rate: "0",
        amount: "0",
      },
    ]
  );

  const addItem = () => {
    const newItem: ProfessionalTemplateItem = {
      id: Date.now().toString(),
      description: "",
      quantity: "1",
      unit: "Item",
      rate: "0",
      amount: "0",
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (
    id: string,
    field: keyof ProfessionalTemplateItem,
    value: string
  ) => {
    setItems(
      items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "rate") {
            const qty = parseFloat(updatedItem.quantity) || 0;
            const rate = parseFloat(updatedItem.rate) || 0;
            updatedItem.amount = (qty * rate).toFixed(2);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );
  const vatRate = 0.15;
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateEnhancedPDF({
         elementId: 'professional-template-content',
         filename: `${documentNumber}-professional.pdf`,
         pageFormat: 'a4',
         orientation: 'portrait',
         margins: { top: 10, right: 10, bottom: 10, left: 10 },
         scale: 2,
         quality: 0.98
       }, {
         show: true,
         message: 'Generating professional template PDF...'
       });
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSave = () => {
    const data = {
      documentNumber,
      date,
      clientName,
      clientAddress,
      clientPhone,
      clientEmail,
      poNumber,
      dueDate,
      notes,
      items,
      subtotal,
      vatAmount,
      total,
      type,
    };
    if (onSave) {
      onSave(data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Control Panel */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 print-hidden">
        <Button
          onClick={() => setIsRTL(!isRTL)}
          variant="outline"
          size="sm"
          className={isRTL ? "bg-gray-50 border-gray-300" : ""}
          title="Toggle text direction"
        >
          <Type className="h-4 w-4" />
        </Button>
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
          <Download className="h-4 w-4" />
        </Button>
        <Button onClick={handleSave} variant="outline" size="sm" title="Save">
          💾
        </Button>
      </div>

      {/* Printable Content */}
      <div
        ref={printRef}
        id="professional-template-content"
        className="max-w-5xl mx-auto p-8 bg-white min-h-screen"
      >
        {/* Header */}
        <div className="relative mb-8 pb-6 border-b-2 border-gray-200">
          {/* Company Logo */}
          <div className="absolute left-0 top-0">
            <img
              src={logoImage}
              alt="image-logo.png"
              className="h-16 w-auto object-contain"
            />
          </div>

          {/* Company Info */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-wide">
              DIOUF AL-SHARQ
            </h1>
            <p className="text-lg text-gray-800 font-semibold tracking-wider mb-1">
              GENERAL CONTRACTING COMPANY
            </p>
            <p className="text-sm text-gray-600 mb-1">
              شركة ضيوف الشرق للمقاولات العامة
            </p>
            <p className="text-sm text-gray-600">
              C.R: 4030313386 | Tel: +966 632 428 200
            </p>
          </div>

          {/* Document Type */}
          <div className="absolute right-0 top-0">
            <div className="bg-gray-600 text-white px-4 py-2 rounded-lg">
              <h2 className="text-xl font-bold uppercase">{type}</h2>
            </div>
          </div>
        </div>

        {/* Document Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {type} Number
                </label>
                <Input
                  value={documentNumber}
                  onChange={e => setDocumentNumber(e.target.value)}
                  className="print:border-none print:p-0 print:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="print:border-none print:p-0 print:bg-white"
                />
              </div>
            </div>

            {type === "invoice" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PO Number
                  </label>
                  <Input
                    value={poNumber}
                    onChange={e => setPoNumber(e.target.value)}
                    className="print:border-none print:p-0 print:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="print:border-none print:p-0 print:bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Client Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              {type === "quotation" ? "Client Information" : "Invoice To"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <Input
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="print:border-none print:p-0 print:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <Textarea
                  value={clientAddress}
                  onChange={e => setClientAddress(e.target.value)}
                  className="print:border-none print:p-0 print:bg-white min-h-[60px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <Input
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    className="print:border-none print:p-0 print:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    className="print:border-none print:p-0 print:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {type === "quotation" ? "Quotation Items" : "Invoice Items"}
              </h3>
              <Button onClick={addItem} size="sm" className="print-hidden">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left font-semibold">
                      #
                    </th>
                    <th className="border border-gray-300 p-2 text-left font-semibold">
                      Description
                    </th>
                    <th className="border border-gray-300 p-2 text-center font-semibold">
                      Qty
                    </th>
                    <th className="border border-gray-300 p-2 text-center font-semibold">
                      Unit
                    </th>
                    <th className="border border-gray-300 p-2 text-right font-semibold">
                      Rate (SAR)
                    </th>
                    <th className="border border-gray-300 p-2 text-right font-semibold">
                      Amount (SAR)
                    </th>
                    <th className="border border-gray-300 p-2 text-center font-semibold print-hidden">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border border-gray-300 p-2 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Textarea
                          value={item.description}
                          onChange={e =>
                            updateItem(item.id, "description", e.target.value)
                          }
                          className="w-full min-h-[60px] print:border-none print:p-0 print:bg-white"
                          placeholder="Enter item description..."
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={e =>
                            updateItem(item.id, "quantity", e.target.value)
                          }
                          className="w-20 text-center print:border-none print:p-0 print:bg-white"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input
                          value={item.unit}
                          onChange={e =>
                            updateItem(item.id, "unit", e.target.value)
                          }
                          className="w-20 text-center print:border-none print:p-0 print:bg-white"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.rate}
                          onChange={e =>
                            updateItem(item.id, "rate", e.target.value)
                          }
                          className="w-24 text-right print:border-none print:p-0 print:bg-white"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 text-right font-semibold">
                        {parseFloat(item.amount).toFixed(2)}
                      </td>
                      <td className="border border-gray-300 p-2 text-center print-hidden">
                        <Button
                          onClick={() => removeItem(item.id)}
                          size="sm"
                          variant="destructive"
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-semibold">
                    {subtotal.toFixed(2)} SAR
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">VAT (15%):</span>
                  <span className="font-semibold">
                    {vatAmount.toFixed(2)} SAR
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-blue-600">
                      {total.toFixed(2)} SAR
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes & Terms
          </label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full min-h-[100px] print:border-none print:p-0 print:bg-white"
            placeholder="Enter any additional notes, terms, or conditions..."
          />
        </div>

        {/* Professional Stamp and Signature */}
        <div className="flex justify-between items-end mb-8">
          <div className="text-left">
            <p className="text-sm text-gray-600 mb-2">Prepared by:</p>
            <p className="text-sm font-semibold">DIOUF AL-SHARQ</p>
            <p className="text-sm">General Contracting Company</p>
          </div>

          <ProfessionalStamp size="medium" showSignature={true} />
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 pt-6">
          <div className="text-center">
            <div className="mb-4">
              {/* Decorative lines */}
              <div className="flex items-center justify-center space-x-4">
                <div className="flex-1 h-1 bg-red-600 rounded"></div>
                <div className="w-8 h-3 bg-red-600 rounded"></div>
                <div className="flex-1 h-1 bg-red-600 rounded"></div>
              </div>
            </div>

            <p className="font-semibold text-gray-800 text-base tracking-wide leading-relaxed uppercase mb-2">
              Gharnath Street, Opposite Saudi Aramco Complex,
              <br />
              Mushrifa, Jeddah, Kingdom of Saudi Arabia
            </p>
            <p className="text-sm text-gray-600 tracking-wider">
              Tel: +966 632 428 200 | Email: info@diouf-alsharq.com |
              www.diouf-alsharq.sa
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
          }
          
          .print-hidden {
            display: none !important;
          }
          
          .print\\:border-none {
            border: none !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          .print\:bg-white {
            background: white !important;
          }
          
          .print\\:opacity-100 {
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
