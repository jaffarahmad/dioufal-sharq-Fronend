import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, FileText, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

interface QuotationItem {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
  amount: string;
}

export default function CreateQuotation() {
  const [, setLocation] = useLocation();
  const [quotationData, setQuotationData] = useState({
    reference: "",
    date: new Date().toISOString().split("T")[0],
    clientName: "",
    clientAddress: "",
    project: "",
    subject: "",
    validityPeriod: "30 days",
    paymentTerms: "Net 30 days",
  });

  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: "1",
      description: "",
      quantity: "1",
      unit: "SQM",
      rate: "",
      amount: "0",
    },
  ]);

  const addItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      description: "",
      quantity: "1",
      unit: "SQM",
      rate: "",
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
    field: keyof QuotationItem,
    value: string
  ) => {
    setItems(
      items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Calculate amount when quantity or rate changes
          if (field === "quantity" || field === "rate") {
            const quantity =
              parseFloat(field === "quantity" ? value : updatedItem.quantity) ||
              0;
            const rate =
              parseFloat(field === "rate" ? value : updatedItem.rate) || 0;
            updatedItem.amount = (quantity * rate).toFixed(2);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const calculateTotal = () => {
    return items
      .reduce((total, item) => total + (parseFloat(item.amount) || 0), 0)
      .toFixed(2);
  };

  const handleSave = () => {
    const quotationDataToSave = {
      ...quotationData,
      items,
      total: calculateTotal(),
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage for now
    const savedQuotations = JSON.parse(
      localStorage.getItem("quotations") || "[]"
    );
    savedQuotations.push(quotationDataToSave);
    localStorage.setItem("quotations", JSON.stringify(savedQuotations));

    alert("Quotation saved successfully!");
  };

  const handlePreview = () => {
    // Validate required fields
    if (
      !quotationData.reference ||
      !quotationData.clientName ||
      items.length === 0
    ) {
      alert(
        "Please fill in the reference number, client name, and add at least one item before previewing."
      );
      return;
    }

    // Validate items have descriptions and rates
    const invalidItems = items.filter(
      item =>
        !item.description.trim() || !item.rate || parseFloat(item.rate) <= 0
    );
    if (invalidItems.length > 0) {
      alert(
        "Please ensure all items have descriptions and valid rates before previewing."
      );
      return;
    }

    // Save current data and open preview
    const previewData = {
      ...quotationData,
      items,
      total: calculateTotal(),
    };

    console.log("Saving preview data:", previewData);
    localStorage.setItem("quotation-preview", JSON.stringify(previewData));

    // Verify data was saved
    const savedData = localStorage.getItem("quotation-preview");
    if (savedData) {
      console.log("Data successfully saved to localStorage");
      window.open("/quotation-preview", "_blank");
    } else {
      console.error("Failed to save data to localStorage");
      alert("Failed to save quotation data. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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
              Create New Quotation
            </h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={handlePreview}
              className="bg-gray-600 hover:bg-gray-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Basic Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quotation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                      placeholder="QTN-2025-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={quotationData.date}
                      onChange={e =>
                        setQuotationData({
                          ...quotationData,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
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
                    placeholder="Quotation for..."
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
                    placeholder="Project name or location"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="validity">Validity Period</Label>
                    <Input
                      id="validity"
                      value={quotationData.validityPeriod}
                      onChange={e =>
                        setQuotationData({
                          ...quotationData,
                          validityPeriod: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment">Payment Terms</Label>
                    <Input
                      id="payment"
                      value={quotationData.paymentTerms}
                      onChange={e =>
                        setQuotationData({
                          ...quotationData,
                          paymentTerms: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    placeholder="Client company name"
                  />
                </div>

                <div>
                  <Label htmlFor="clientAddress">Client Address</Label>
                  <Textarea
                    id="clientAddress"
                    value={quotationData.clientAddress}
                    onChange={e =>
                      setQuotationData({
                        ...quotationData,
                        clientAddress: e.target.value,
                      })
                    }
                    placeholder="Client address"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Items */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Quotation Items</CardTitle>
                  <Button onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-gray-600">
                          Item {index + 1}
                        </span>
                        {items.length > 1 && (
                          <Button
                            onClick={() => removeItem(item.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={item.description}
                          onChange={e =>
                            updateItem(item.id, "description", e.target.value)
                          }
                          placeholder="Item description"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={e =>
                              updateItem(item.id, "quantity", e.target.value)
                            }
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label>Unit</Label>
                          <Input
                            value={item.unit}
                            onChange={e =>
                              updateItem(item.id, "unit", e.target.value)
                            }
                            placeholder="SQM, PCS, etc."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Rate (SAR)</Label>
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={e =>
                              updateItem(item.id, "rate", e.target.value)
                            }
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label>Amount (SAR)</Label>
                          <Input
                            value={item.amount}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span className="text-blue-600">
                        SAR {calculateTotal()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
