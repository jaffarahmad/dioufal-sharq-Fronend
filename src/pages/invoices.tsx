import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Minus,
  Palette,
  X,
  Eraser,
  Building,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  insertInvoiceSchema,
  type Invoice,
  type Project,
} from "@/lib/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth, hasPermission } from "@/lib/auth";
import logoPath from "@assets/image_17540348329.png";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.string().min(1, "Quantity is required").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Quantity must be a positive number"),
  rate: z.string().min(1, "Rate is required").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Rate must be a valid number"),
  amount: z.number().optional(),
});

const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  poNumber: z.string().optional(),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().optional(),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  description: z.string().optional(),
  status: z.string().default("Draft"),
  projectId: z.string().optional(),
  dueDate: z.string().optional(),
  paidDate: z.string().optional(),
  invoiceDate: z.string().optional(),
  quotationId: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "At least one item is required"),
  taxRate: z.string().optional(),
  notes: z.string().optional(),
});

type CreateInvoiceForm = z.infer<typeof createInvoiceSchema>;

const todayStr = () => new Date().toISOString().split("T")[0];

function ClearableInput({
  value = "",
  onChange,
  onClear,
  placeholder,
  type = "text",
  className = "",
}: {
  value?: string;
  onChange: (val: string) => void;
  onClear: () => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className="relative">
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${className} pr-9`}
      />
      {value && value.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
          title="Clear field"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  const [open, setOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { user } = useAuth();
  const canChangeInvoiceDate = hasPermission(user, "canChangeInvoiceDate");
  const canDeleteInvoices = hasPermission(user, "canDeleteInvoices");

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const notifications = useNotifications();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices-records"],
    queryFn: () => {
      const stored = localStorage.getItem("invoices-records");
      return stored ? JSON.parse(stored) : [];
    },
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects-records"],
    queryFn: () => {
      const stored = localStorage.getItem("projects-records");
      return stored ? JSON.parse(stored) : [];
    },
  });

  const form = useForm<CreateInvoiceForm>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      invoiceNumber: `INV-${Date.now()}`,
      poNumber: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      description: "",
      status: "Draft",
      projectId: "none",
      quotationId: "",
      paidDate: "",
      dueDate: "",
      invoiceDate: todayStr(),
      taxRate: "15",
      items: [{ description: "Service", quantity: "1", rate: "100" }],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calculate totals automatically
  const watchedItems = form.watch("items");
  const watchedTaxRate = form.watch("taxRate");

  const subtotal = watchedItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || "0");
    const rate = parseFloat(item.rate || "0");
    return sum + qty * rate;
  }, 0);

  const taxAmount = subtotal * (parseFloat(watchedTaxRate || "0") / 100);
  const totalAmount = subtotal + taxAmount;

  const createMutation = useMutation({
    mutationFn: async (data: CreateInvoiceForm) => {
      const calculatedSubtotal = data.items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity || "0");
        const rate = parseFloat(item.rate || "0");
        return sum + qty * rate;
      }, 0);

      const calculatedTaxAmount =
        calculatedSubtotal * (parseFloat(data.taxRate || "0") / 100);
      const calculatedTotalAmount = calculatedSubtotal + calculatedTaxAmount;

      const invoiceData = {
        id: Date.now(),
        invoiceNumber: data.invoiceNumber,
        poNumber: data.poNumber || undefined,
        clientName: data.clientName,
        clientEmail: data.clientEmail || undefined,
        clientPhone: data.clientPhone || undefined,
        clientAddress: data.clientAddress || undefined,
        description: data.description || undefined,
        subtotal: calculatedSubtotal,
        taxRate: parseFloat(data.taxRate || "15"),
        taxAmount: calculatedTaxAmount,
        vatAmount: calculatedTaxAmount,
        totalAmount: calculatedTotalAmount,
        status: data.status,
        projectId:
          data.projectId && data.projectId !== "none" && data.projectId !== ""
            ? parseInt(data.projectId)
            : undefined,
        quotationId:
          data.quotationId && data.quotationId !== ""
            ? data.quotationId
            : undefined,
        invoiceDate: data.invoiceDate || todayStr(),
        dueDate: data.dueDate || new Date().toISOString(),
        paidDate: data.paidDate || undefined,
        notes: data.notes || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: data.items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          amount: parseFloat(item.quantity) * parseFloat(item.rate),
        })),
      };

      const existingRecords = JSON.parse(localStorage.getItem("invoices-records") || "[]");
      const updatedRecords = [...existingRecords, invoiceData];
      localStorage.setItem("invoices-records", JSON.stringify(updatedRecords));

      return invoiceData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices-records"] });
      notifications.success("Invoice Created", "Invoice created successfully");
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Invoice creation error:", error);
      console.log("Form validation errors:", form.formState.errors);

      notifications.error(
        "Creation Failed",
        error.message || "Please check all required fields"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: CreateInvoiceForm;
    }) => {
      const calculatedSubtotal = data.items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity || "0");
        const rate = parseFloat(item.rate || "0");
        return sum + qty * rate;
      }, 0);

      const calculatedTaxAmount =
        calculatedSubtotal * (parseFloat(data.taxRate || "0") / 100);
      const calculatedTotalAmount = calculatedSubtotal + calculatedTaxAmount;

      const invoiceData = {
        invoiceNumber: data.invoiceNumber,
        poNumber: data.poNumber || undefined,
        clientName: data.clientName,
        clientEmail: data.clientEmail || undefined,
        clientPhone: data.clientPhone || undefined,
        clientAddress: data.clientAddress || undefined,
        description: data.description || undefined,
        subtotal: calculatedSubtotal,
        taxRate: parseFloat(data.taxRate || "15"),
        taxAmount: calculatedTaxAmount,
        vatAmount: calculatedTaxAmount,
        totalAmount: calculatedTotalAmount,
        status: data.status,
        projectId:
          data.projectId && data.projectId !== "none" && data.projectId !== ""
            ? parseInt(data.projectId)
            : undefined,
        quotationId:
          data.quotationId && data.quotationId !== ""
            ? data.quotationId
            : undefined,
        invoiceDate: data.invoiceDate || todayStr(),
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split("T")[0] : undefined,
        paidDate: data.paidDate ? new Date(data.paidDate).toISOString().split("T")[0] : undefined,
        notes: data.notes || undefined,
        updatedAt: new Date().toISOString(),
        items: data.items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          amount: parseFloat(item.quantity) * parseFloat(item.rate),
        })),
      };

      const existingRecords = JSON.parse(localStorage.getItem("invoices-records") || "[]");
      const recordIndex = existingRecords.findIndex((record: any) => record.id === id);
      
      if (recordIndex !== -1) {
        existingRecords[recordIndex] = { ...existingRecords[recordIndex], ...invoiceData };
        localStorage.setItem("invoices-records", JSON.stringify(existingRecords));
        return existingRecords[recordIndex];
      }
      
      throw new Error("Invoice not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices-records"] });
      notifications.success("Invoice Updated", "Invoice updated successfully");
      setOpen(false);
      setEditingInvoice(null);
      form.reset();
    },
    onError: (error: any) => {
      console.error("Invoice update error:", error);
      notifications.error(
        "Update Failed",
        error.message || "Please check all required fields"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const existingRecords = JSON.parse(localStorage.getItem("invoices-records") || "[]");
      const filteredRecords = existingRecords.filter((record: any) => record.id !== id);
      localStorage.setItem("invoices-records", JSON.stringify(filteredRecords));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices-records"] });
      notifications.success("Invoice Deleted", "Invoice deleted successfully");
    },
    onError: (error: any) => {
      notifications.error("Delete Failed", error.message || "Please try again");
    },
  });

  const handleEditInvoice = async (invoice: Invoice) => {
    try {
      // Use items stored directly with the invoice
      const items = (invoice as any).items || [];

      // Format items for the form
      const formItems =
        items.length > 0
          ? items.map((item: any) => ({
              description: item.description,
              quantity: item.quantity.toString(),
              rate: item.rate.toString(),
            }))
          : [
              {
                description: "",
                quantity: "1",
                rate: invoice.subtotal?.toString() || "0",
              },
            ];

      // Reset form with invoice data
      form.reset({
        invoiceNumber: invoice.invoiceNumber,
        poNumber: invoice.poNumber || "",
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail || "",
        clientPhone: (invoice as any).clientPhone || "",
        clientAddress: invoice.clientAddress || "",
        description: invoice.description || "",
        status: invoice.status,
        projectId: invoice.projectId ? invoice.projectId.toString() : "none",
        quotationId: invoice.quotationId ? invoice.quotationId.toString() : "",
        invoiceDate: (invoice as any).invoiceDate
          ? new Date((invoice as any).invoiceDate).toISOString().split("T")[0]
          : invoice.createdAt
            ? new Date(invoice.createdAt).toISOString().split("T")[0]
            : todayStr(),
        dueDate: invoice.dueDate
          ? new Date(invoice.dueDate).toISOString().split("T")[0]
          : "",
        paidDate: invoice.paidDate
          ? new Date(invoice.paidDate).toISOString().split("T")[0]
          : "",
        taxRate:
          (invoice as any).taxRate !== undefined &&
          (invoice as any).taxRate !== null
            ? String((invoice as any).taxRate)
            : invoice.subtotal && parseFloat(String(invoice.subtotal)) > 0
              ? (
                  (parseFloat(
                    String((invoice as any).taxAmount ?? (invoice as any).vatAmount ?? 0)
                  ) /
                    parseFloat(String(invoice.subtotal))) *
                  100
                ).toFixed(2).replace(/\.?0+$/, "")
              : "15",
        items: formItems,
        notes: (invoice as any).notes || "",
      });

      setEditingInvoice(invoice);
      setOpen(true);
    } catch (error) {
      notifications.error("Error", "Failed to load invoice data for editing");
    }
  };

  const onSubmit = (data: CreateInvoiceForm) => {
    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-foreground";
    }
  };

  if (isLoading) return <div>Loading invoices...</div>;

  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            Manage your client invoices and billing
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={openState => {
            setOpen(openState);
            if (!openState) {
              setEditingInvoice(null);
              form.reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInvoice ? "Edit Invoice" : "Create New Invoice"}
              </DialogTitle>
              <DialogDescription>
                Create a new invoice for your client with company branding
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number</FormLabel>
                        <FormControl>
                          <ClearableInput
                            placeholder="INV-2025-001"
                            {...field}
                            onClear={() => field.onChange("")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="poNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PO # (Optional)</FormLabel>
                        <FormControl>
                          <ClearableInput
                            placeholder="Purchase Order Number"
                            {...field}
                            onClear={() => field.onChange("")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            disabled={!canChangeInvoiceDate}
                            className={!canChangeInvoiceDate ? "bg-muted" : ""}
                          />
                        </FormControl>
                        {!canChangeInvoiceDate && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Only administrators can change the invoice date.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Project</SelectItem>
                            {projects
                              .filter(project => project.id && project.name)
                              .map(project => (
                                <SelectItem
                                  key={project.id}
                                  value={project.id.toString()}
                                >
                                  {project.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Client Name (Supports Arabic & English)
                        </FormLabel>
                        <FormControl>
                          <ClearableInput
                            placeholder="Client or Company Name (English/Arabic)"
                            {...field}
                            onClear={() => field.onChange("")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Phone (Optional)</FormLabel>
                        <FormControl>
                          <ClearableInput
                            placeholder="+966 5X XXX XXXX"
                            {...field}
                            onClear={() => field.onChange("")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client VAT</FormLabel>
                        <FormControl>
                          <ClearableInput
                            placeholder="VAT Registration Number"
                            {...field}
                            onClear={() => field.onChange("")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="clientAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Client Address (Supports Arabic & English)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            placeholder="Street address, city, postal code, Saudi Arabia (English/Arabic)"
                            {...field}
                            className="pr-9"
                          />
                          {field.value && field.value.length > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => field.onChange("")}
                              className="absolute right-2 top-2 h-7 w-7 p-0 hover:bg-muted"
                              title="Clear address"
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Description (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            {...field}
                            placeholder="Overall project or invoice description"
                            className="pr-9"
                          />
                          {field.value && field.value.length > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => field.onChange("")}
                              className="absolute right-2 top-2 h-7 w-7 p-0 hover:bg-muted"
                              title="Clear description"
                            >
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Line Items Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Invoice Items</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        append({ description: "", quantity: "1", rate: "0" })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 space-y-4">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-12 gap-2 items-end"
                      >
                        <div className="col-span-5">
                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">
                                  Description
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Item description..."
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Qty</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    placeholder="1"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`items.${index}.rate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">
                                  Rate (SAR)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-2">
                          <FormLabel className="text-sm">
                            Amount (SAR)
                          </FormLabel>
                          <div className="mt-2 p-2 bg-muted/50 rounded border text-sm font-medium">
                            {(
                              parseFloat(watchedItems[index]?.quantity || "0") *
                                parseFloat(watchedItems[index]?.rate || "0") ||
                              0
                            ).toFixed(2)}
                          </div>
                        </div>
                        <div className="col-span-1">
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => remove(index)}
                              className="h-9"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals Section */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tax Rate (%):</span>
                      <div className="w-20">
                        <FormField
                          control={form.control}
                          name="taxRate"
                          render={({ field }) => (
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                className="text-right"
                                placeholder="15"
                              />
                            </FormControl>
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Subtotal:</span>
                      <span className="font-medium">
                        {subtotal.toFixed(2)} SAR
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Tax ({watchedTaxRate || 0}%):</span>
                      <span className="font-medium">
                        {taxAmount.toFixed(2)} SAR
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span style={{ letterSpacing: "-0.5px" }}>
                        {totalAmount.toFixed(2)}SAR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Add any additional notes or instructions for this invoice..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select invoice status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Sent">Sent</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between items-center pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                        <Eraser className="h-4 w-4 mr-2" />
                        Clear All Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove all information you've entered into this form. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            form.reset({
                              invoiceNumber: `INV-${Date.now()}`,
                              poNumber: "",
                              clientName: "",
                              clientEmail: "",
                              clientPhone: "",
                              clientAddress: "",
                              description: "",
                              status: "Draft",
                              projectId: "none",
                              quotationId: "",
                              paidDate: "",
                              dueDate: "",
                              invoiceDate: todayStr(),
                              taxRate: "15",
                              items: [{ description: "Service", quantity: "1", rate: "100" }],
                              notes: "",
                            });
                          }}
                        >
                          Clear Everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        createMutation.isPending || updateMutation.isPending
                      }
                    >
                      {editingInvoice
                        ? updateMutation.isPending
                          ? "Updating..."
                          : "Update Invoice"
                        : createMutation.isPending
                          ? "Creating..."
                          : "Create Invoice"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
            <CardDescription>View and manage all your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No invoices yet
              </h3>
              <p className="text-muted-foreground">
                Create your first invoice to get started
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map(invoice => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>{invoice.clientName}</TableCell>
                        <TableCell>{invoice.totalAmount} SAR</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invoice.dueDate
                            ? new Date(invoice.dueDate).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setLocation(`/view-invoice/${invoice.id}`)
                              }
                              title="View Invoice"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditInvoice(invoice)}
                              title="Edit Invoice"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setLocation(`/modern-invoice/${invoice.id}`)
                              }
                              title="Modern Invoice Template"
                            >
                              <Palette className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setLocation(`/asset-paths-invoice/${invoice.id}`)
                              }
                              title="Asset Paths Invoice Template"
                            >
                              <Building className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Invoice
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete invoice{" "}
                                    {invoice.invoiceNumber}? This action cannot
                                    be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      deleteMutation.mutate(invoice.id)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {invoices.map(invoice => (
                  <Card key={invoice.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {invoice.invoiceNumber}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {invoice.clientName}
                        </p>
                      </div>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-medium">
                          ${invoice.totalAmount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Due Date:</span>
                        <span>
                          {invoice.dueDate
                            ? new Date(invoice.dueDate).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setLocation(`/view-invoice/${invoice.id}`)
                        }
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditInvoice(invoice)}
                        title="Edit Invoice"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setLocation(`/modern-invoice/${invoice.id}`)
                        }
                        title="Modern Template"
                      >
                        <Palette className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setLocation(`/asset-paths-invoice/${invoice.id}`)
                        }
                        title="Asset Paths Template"
                      >
                        <Building className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete invoice{" "}
                              {invoice.invoiceNumber}? This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(invoice.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
