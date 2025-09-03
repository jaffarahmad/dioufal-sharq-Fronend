import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  insertInventorySchema,
  type InsertInventory,
  type Inventory,
} from "@/lib/schema";
import { Plus, Package } from "lucide-react";
import { z } from "zod";

// Complete inventory form schema aligned with InsertInventory
const inventoryFormSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, "Quantity must be non-negative"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.coerce.number().min(0, "Unit price must be positive"),
  categoryId: z.coerce.number(),
  supplierId: z.coerce.number().optional(),
  minStock: z.coerce.number().min(0).default(0),
  totalValue: z.coerce.number().min(0, "Total value must be non-negative"),
  status: z.enum(["available", "sold", "damaged", "reserved"]).default("available"),
});

type InventoryFormData = z.infer<typeof inventoryFormSchema>;

interface InventoryFormProps {
  inventory?: Inventory;
  trigger?: React.ReactNode;
}

export default function InventoryForm({
  inventory,
  trigger,
}: InventoryFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories and suppliers for dropdowns
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-records"],
    queryFn: () => {
      const stored = localStorage.getItem("categories-records");
      return stored ? JSON.parse(stored) : [];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-records"],
    queryFn: () => {
      const stored = localStorage.getItem("suppliers-records");
      return stored ? JSON.parse(stored) : [];
    },
  });

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: inventory?.name || "",
      description: inventory?.description || "",
      quantity: inventory?.quantity || 1,
      unit: inventory?.unit || "pieces",
      unitPrice: inventory?.unitPrice || 0,
      categoryId: inventory?.categoryId || (categories.length > 0 ? categories[0].id : undefined),
      supplierId: inventory?.supplierId || undefined,
      minStock: inventory?.minStock || 0,
      totalValue: inventory?.totalValue || 0,
      status: inventory?.status || "available",
    },
  });

  // Watch quantity and unitPrice to automatically calculate totalValue
  const quantity = form.watch("quantity");
  const unitPrice = form.watch("unitPrice");
  
  React.useEffect(() => {
    const calculatedTotal = (quantity || 0) * (unitPrice || 0);
    form.setValue("totalValue", calculatedTotal);
  }, [quantity, unitPrice, form]);

  const createMutation = useMutation({
    mutationFn: (data: InsertInventory) => {
      const stored = localStorage.getItem("inventory-records");
      const inventory = stored ? JSON.parse(stored) : [];
      const newInventory = {
        ...data,
        id: Date.now(),
        totalValue: data.quantity * data.unitPrice,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedInventory = [...inventory, newInventory];
      localStorage.setItem("inventory-records", JSON.stringify(updatedInventory));
      return Promise.resolve(newInventory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-records"] });
      const { dismiss } = toast({
        title: "Success",
        description: "Inventory item created successfully",
      });
      setOpen(false);
      form.reset();
      setTimeout(() => dismiss(), 3000);
    },
    onError: (error: any) => {
      const { dismiss } = toast({
        title: "Error",
        description: "Failed to create inventory item",
        variant: "destructive",
      });
      setTimeout(() => dismiss(), 5000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertInventory) => {
      const stored = localStorage.getItem("inventory-records");
      const inventoryList = stored ? JSON.parse(stored) : [];
      const updatedInventoryList = inventoryList.map((item: any) =>
        item.id === inventory?.id
          ? {
              ...item,
              ...data,
              totalValue: data.quantity * data.unitPrice,
              updatedAt: new Date().toISOString(),
            }
          : item
      );
      localStorage.setItem("inventory-records", JSON.stringify(updatedInventoryList));
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-records"] });
      const { dismiss } = toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
      setOpen(false);
      setTimeout(() => dismiss(), 3000);
    },
    onError: (error: any) => {
      const { dismiss } = toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
      });
      setTimeout(() => dismiss(), 5000);
    },
  });

  const onSubmit = (data: InventoryFormData) => {
    // Calculate totalValue
    const dataWithTotalValue = {
      ...data,
      totalValue: data.quantity * data.unitPrice,
    };
    
    if (inventory) {
      updateMutation.mutate(dataWithTotalValue);
    } else {
      createMutation.mutate(dataWithTotalValue);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Reset form when dialog opens
  const handleDialogChange = (newOpen: boolean) => {
    if (newOpen && !inventory) {
      form.reset({
        name: "",
        description: "",
        quantity: 1,
        unit: "pieces",
        unitPrice: 0,
        categoryId: 1,
        supplierId: undefined,
        minStock: 0,
        totalValue: 0,
        status: "available",
      });
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="primary" type="button">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {inventory ? "Edit Inventory Item" : "Add New Inventory Item"}
          </DialogTitle>
          <DialogDescription>
            {inventory
              ? "Update the inventory item details below."
              : "Fill in the details to add a new item to your inventory."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter item description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity and Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pieces">Pieces</SelectItem>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="meters">Meters</SelectItem>
                        <SelectItem value="liters">Liters</SelectItem>
                        <SelectItem value="boxes">Boxes</SelectItem>
                        <SelectItem value="sets">Sets</SelectItem>
                        <SelectItem value="rolls">Rolls</SelectItem>
                        <SelectItem value="bags">Bags</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        readOnly
                        className="bg-gray-50 cursor-not-allowed"
                      />
                    </FormControl>
                    <FormDescription>
                      Automatically calculated (Quantity × Unit Price)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category and Supplier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select
                      value={field.value ? field.value.toString() : "none"}
                      onValueChange={value =>
                        field.onChange(value && value !== "none" ? parseInt(value) : undefined)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category: any) => (
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
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={value =>
                        field.onChange(value ? parseInt(value) : undefined)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No supplier</SelectItem>
                        {suppliers.map((supplier: any) => (
                          <SelectItem
                            key={supplier.id}
                            value={supplier.id.toString()}
                          >
                            {supplier.name}
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
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stock Level</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : inventory
                    ? "Update Item"
                    : "Add Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
