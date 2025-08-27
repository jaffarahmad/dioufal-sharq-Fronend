import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  ShoppingCart,
  Calculator,
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import type { Supplier, Category } from "@/lib/schema";
import { useState } from "react";

const purchaseItemSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative"),
  total: z.coerce.number().min(0, "Total must be non-negative"),
});

const purchaseFormSchema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  supplierEmail: z
    .string()
    .email("Valid email is required")
    .optional()
    .or(z.literal("")),
  supplierPhone: z.string().min(1, "Supplier phone is required"),
  orderDate: z.date({
    required_error: "Order date is required",
  }),
  expectedDelivery: z
    .date({
      required_error: "Expected delivery date is required",
    })
    .optional(),
  categoryId: z.coerce.number().optional(),
  description: z.string().min(1, "Purchase description is required"),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  status: z.string().min(1, "Status is required"),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

interface PurchaseFormProps {
  suppliers: Supplier[];
  categories: Category[];
  onSubmit: (data: PurchaseFormData) => void;
  onCancel: () => void;
  initialData?: Partial<PurchaseFormData>;
  isLoading?: boolean;
}

export default function PurchaseForm({
  suppliers,
  categories,
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: PurchaseFormProps) {
  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      supplierName: initialData?.supplierName || "",
      supplierEmail: initialData?.supplierEmail || "",
      supplierPhone: initialData?.supplierPhone || "",
      orderDate: initialData?.orderDate || undefined,
      expectedDelivery: initialData?.expectedDelivery || undefined,
      categoryId: initialData?.categoryId || undefined,
      description: initialData?.description || "",
      items: initialData?.items || [
        { description: "", quantity: 1, unitPrice: 0, total: 0 },
      ],
      notes: initialData?.notes || "",
      status: initialData?.status || "Pending",
    },
  });

  const watchedItems = form.watch("items");

  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [
      ...currentItems,
      { description: "", quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length > 1) {
      form.setValue(
        "items",
        currentItems.filter((_, i) => i !== index)
      );
    }
  };

  const updateItemTotal = (index: number) => {
    const items = form.getValues("items");
    const item = items[index];
    if (item) {
      const total = item.quantity * item.unitPrice;
      form.setValue(`items.${index}.total`, total);
    }
  };

  const handleSupplierSelect = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id.toString() === supplierId);
    if (supplier) {
      form.setValue("supplierName", supplier.name);
      form.setValue("supplierEmail", supplier.email || "");
      form.setValue("supplierPhone", supplier.phone || "");
    }
  };

  // Calculate totals
  const subtotal = watchedItems.reduce(
    (sum, item) => sum + (item.total || 0),
    0
  );
  const vatRate = 15; // Saudi VAT rate
  const vatAmount = subtotal * (vatRate / 100);
  const totalAmount = subtotal + vatAmount;

  const statusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Ordered", label: "Ordered" },
    { value: "Delivered", label: "Delivered" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const handleFormSubmit = (data: PurchaseFormData) => {
    console.log('PurchaseForm: Form submitted with data:', data);
    console.log('PurchaseForm: Form validation errors:', form.formState.errors);
    console.log('PurchaseForm: Form is valid:', form.formState.isValid);
    console.log('PurchaseForm: Form values:', form.getValues());
    onSubmit(data);
  };

  const handleFormError = (errors: any) => {
    console.error('PurchaseForm: Form validation failed:', errors);
    console.log('PurchaseForm: Current form values:', form.getValues());
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit, handleFormError)}
        className="space-y-4 sm:space-y-6 max-h-[80vh] overflow-y-auto"
      >
        {/* Supplier Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Supplier Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {suppliers.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Select Existing Supplier (Optional)
                </label>
                <Select onValueChange={handleSupplierSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose from existing suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem
                        key={supplier.id}
                        value={supplier.id.toString()}
                      >
                        {supplier.name} - {supplier.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplierName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABC Construction Supplies"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplierPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="+966 50 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="supplierEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="supplier@company.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Purchase Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Purchase Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Order Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick order date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={date => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedDelivery"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expected Delivery</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick delivery date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={date => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={value =>
                        field.onChange(value ? parseInt(value) : undefined)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Construction materials for Project ABC"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Purchase Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Purchase Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {watchedItems.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {watchedItems.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Input placeholder="Cement bags 50kg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            {...field}
                            onChange={e => {
                              field.onChange(e);
                              setTimeout(() => updateItemTotal(index), 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price (SAR) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={e => {
                              field.onChange(e);
                              setTimeout(() => updateItemTotal(index), 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.total`}
                    render={({ field }) => (
                      <FormItem className="lg:col-span-4">
                        <FormLabel>Total (SAR)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            readOnly
                            className="bg-gray-50"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>
                  {subtotal.toLocaleString("en-US", {
                    style: "currency",
                    currency: "SAR",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VAT ({vatRate}%):</span>
                <span>
                  {vatAmount.toLocaleString("en-US", {
                    style: "currency",
                    currency: "SAR",
                  })}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount:</span>
                  <span>
                    {totalAmount.toLocaleString("en-US", {
                      style: "currency",
                      currency: "SAR",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Special delivery instructions, payment terms, or other notes..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto order-1 sm:order-2 bg-gray-600 hover:bg-gray-700"
          >
            {isLoading
              ? "Saving..."
              : initialData
                ? "Update Purchase"
                : "Create Purchase Order"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
