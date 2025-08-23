import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { apiRequest } from "@/lib/queryClient";
import {
  insertCategorySchema,
  type InsertCategory,
  type Category,
} from "@/lib/schema";
import { Plus, Tag } from "lucide-react";
import { z } from "zod";

// Use the same schema as InsertCategory to ensure type compatibility
const categoryFormSchema = insertCategorySchema;

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category?: Category;
  trigger?: React.ReactNode;
}

export default function CategoryForm({ category, trigger }: CategoryFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      type: category?.type || "inventory",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const res = await apiRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      const { dismiss } = toast({
        title: "Success",
        description: "Category created successfully",
      });
      setOpen(false);
      form.reset();
      setTimeout(() => dismiss(), 3000);
    },
    onError: (error: any) => {
      const { dismiss } = toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
      setTimeout(() => dismiss(), 5000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const res = await apiRequest(`/api/categories/${category?.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      const { dismiss } = toast({
        title: "Success",
        description: "Category updated successfully",
      });
      setOpen(false);
      setTimeout(() => dismiss(), 3000);
    },
    onError: (error: any) => {
      const { dismiss } = toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
      setTimeout(() => dismiss(), 5000);
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    console.log("Form submitted with data:", data);

    const categoryData: InsertCategory = {
      ...data,
    };

    console.log("Sending category data:", categoryData);

    if (category) {
      updateMutation.mutate(categoryData);
    } else {
      createMutation.mutate(categoryData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Reset form when dialog opens
  const handleDialogChange = (newOpen: boolean) => {
    if (newOpen && !category) {
      form.reset({
        name: "",
        description: "",
        type: "inventory",
      });
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90" type="button">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {category ? "Edit Category" : "Add New Category"}
          </DialogTitle>
          <DialogDescription>
            {category
              ? "Update the category details below."
              : "Create a new category for organizing your items."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, errors => {
              console.log("Form validation errors:", errors);
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Materials, Equipment, Tools"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="asset">Asset</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this category is used for..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  console.log("Cancel button clicked");
                  setOpen(false);
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                onClick={() => console.log("Add Category button clicked")}
              >
                {isPending
                  ? "Saving..."
                  : category
                    ? "Update Category"
                    : "Add Category"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
