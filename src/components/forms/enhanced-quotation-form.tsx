import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Minus, Calculator } from "lucide-react";
import type { Project } from "@/lib/schema";

const quotationItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.string().min(1, "Quantity is required"),
  unitPrice: z.string().min(1, "Unit price is required"),
  total: z.string().min(1, "Total is required"),
});

const quotationFormSchema = z.object({
  quotationNumber: z.string().min(1, "Quotation number is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  projectTitle: z.string().optional(),
  description: z.string().optional(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
  discountAmount: z.string().optional(),
  taxRate: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationFormSchema>;

interface EnhancedQuotationFormProps {
  onSubmit: (data: any) => void;
  projects?: Project[];
  isSubmitting?: boolean;
}

export default function EnhancedQuotationForm({
  onSubmit,
  projects = [],
  isSubmitting,
}: EnhancedQuotationFormProps) {
  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      quotationNumber: `QUO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      projectTitle: "",
      description: "",
      validUntil: "",
      notes: "",
      termsAndConditions:
        "Payment terms: 30 days\nValidity: 30 days from quotation date\nDelivery: As per project schedule",
      items: [{ description: "", quantity: "1", unitPrice: "0", total: "0" }],
      discountAmount: "0",
      taxRate: "15",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const discountAmount = parseFloat(form.watch("discountAmount") || "0");
  const taxRate = parseFloat(form.watch("taxRate") || "15");

  // Calculate totals
  const subtotal = watchedItems.reduce((sum, item) => {
    const quantity = parseFloat(item.quantity || "0");
    const unitPrice = parseFloat(item.unitPrice || "0");
    return sum + quantity * unitPrice;
  }, 0);

  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = (discountedSubtotal * taxRate) / 100;
  const totalAmount = discountedSubtotal + taxAmount;

  // Update item total when quantity or unit price changes
  const updateItemTotal = (index: number) => {
    const quantity = parseFloat(
      form.getValues(`items.${index}.quantity`) || "0"
    );
    const unitPrice = parseFloat(
      form.getValues(`items.${index}.unitPrice`) || "0"
    );
    const total = quantity * unitPrice;
    form.setValue(`items.${index}.total`, total.toFixed(2));
  };

  const addItem = () => {
    append({ description: "", quantity: "1", unitPrice: "0", total: "0" });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handleSubmit = (data: QuotationFormData) => {
    const processedData = {
      ...data,
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxRate: taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      items: data.items.map(item => ({
        description: item.description,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        total: parseFloat(item.total),
      })),
    };
    onSubmit(processedData);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Quotation Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quotationNumber">Quotation Number</Label>
            <Input
              id="quotationNumber"
              {...form.register("quotationNumber")}
              placeholder="QUO-2025-001"
            />
            {form.formState.errors.quotationNumber && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.quotationNumber.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="validUntil">Valid Until</Label>
            <Input
              id="validUntil"
              type="date"
              {...form.register("validUntil")}
            />
          </div>

          <div>
            <Label htmlFor="projectTitle">Project Title</Label>
            <Input
              id="projectTitle"
              {...form.register("projectTitle")}
              placeholder="Project name or title"
            />
          </div>

          <div>
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Brief project description"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              {...form.register("clientName")}
              placeholder="Client or company name"
            />
            {form.formState.errors.clientName && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.clientName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="clientEmail">Email</Label>
            <Input
              id="clientEmail"
              type="email"
              {...form.register("clientEmail")}
              placeholder="client@example.com"
            />
            {form.formState.errors.clientEmail && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.clientEmail.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="clientPhone">Phone</Label>
            <Input
              id="clientPhone"
              {...form.register("clientPhone")}
              placeholder="+966 50 123 4567"
            />
          </div>

          <div>
            <Label htmlFor="clientAddress">Address</Label>
            <Textarea
              id="clientAddress"
              {...form.register("clientAddress")}
              placeholder="Client address"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Items & Services
            <Button type="button" onClick={addItem} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Description</TableHead>
                  <TableHead className="w-[15%]">Quantity</TableHead>
                  <TableHead className="w-[20%]">Unit Price (SAR)</TableHead>
                  <TableHead className="w-[20%]">Total (SAR)</TableHead>
                  <TableHead className="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Textarea
                        {...form.register(`items.${index}.description`)}
                        placeholder="Service or product description"
                        rows={2}
                        className="min-h-[60px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register(`items.${index}.quantity`)}
                        onChange={e => {
                          form.setValue(
                            `items.${index}.quantity`,
                            e.target.value
                          );
                          setTimeout(() => updateItemTotal(index), 0);
                        }}
                        placeholder="1"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register(`items.${index}.unitPrice`)}
                        onChange={e => {
                          form.setValue(
                            `items.${index}.unitPrice`,
                            e.target.value
                          );
                          setTimeout(() => updateItemTotal(index), 0);
                        }}
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        {...form.register(`items.${index}.total`)}
                        readOnly
                        className="bg-teal-50"
                        value={watchedItems[index]?.total || "0"}
                      />
                    </TableCell>
                    <TableCell>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {form.formState.errors.items && (
            <p className="text-sm text-red-600 mt-2">
              {form.formState.errors.items.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="discountAmount">Discount Amount (SAR)</Label>
              <Input
                id="discountAmount"
                type="number"
                step="0.01"
                {...form.register("discountAmount")}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                {...form.register("taxRate")}
                placeholder="15"
              />
            </div>
          </div>

          <div className="bg-violet-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{subtotal.toFixed(2)} SAR</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span className="font-medium">
                  -{discountAmount.toFixed(2)} SAR
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax ({taxRate}%):</span>
              <span className="font-medium">{taxAmount.toFixed(2)} SAR</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total Amount:</span>
              <span>{totalAmount.toFixed(2)} SAR</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes and Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Additional notes or comments"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
            <Textarea
              id="termsAndConditions"
              {...form.register("termsAndConditions")}
              placeholder="Terms and conditions"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="px-8">
          {isSubmitting ? "Creating..." : "Create Quotation"}
        </Button>
      </div>
    </form>
  );
}
