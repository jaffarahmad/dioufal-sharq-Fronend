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
import { CalendarIcon, Package, Calculator } from "lucide-react";
import { format } from "date-fns";
import type { Category } from "@/lib/schema";

const fixedAssetFormSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  description: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  assetCode: z.string().min(1, "Asset code is required"),
  purchaseDate: z.date({
    required_error: "Purchase date is required",
  }),
  purchasePrice: z.coerce
    .number()
    .min(0, "Purchase price must be non-negative"),
  currentValue: z.coerce.number().min(0, "Current value must be non-negative"),
  depreciationRate: z.coerce
    .number()
    .min(0)
    .max(100, "Depreciation rate must be between 0-100%")
    .default(0),
  location: z.string().min(1, "Location is required"),
  condition: z.string().min(1, "Condition is required"),
  status: z.string().min(1, "Status is required"),
});

type FixedAssetFormData = z.infer<typeof fixedAssetFormSchema>;

interface FixedAssetFormProps {
  categories: Category[];
  onSubmit: (data: FixedAssetFormData) => void;
  onCancel: () => void;
  initialData?: Partial<FixedAssetFormData>;
  isLoading?: boolean;
}

export default function FixedAssetForm({
  categories,
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: FixedAssetFormProps) {
  const form = useForm<FixedAssetFormData>({
    resolver: zodResolver(fixedAssetFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      categoryId: initialData?.categoryId || undefined,
      assetCode: initialData?.assetCode || "",
      purchaseDate: initialData?.purchaseDate || undefined,
      purchasePrice: initialData?.purchasePrice || 0,
      currentValue: initialData?.currentValue || 0,
      depreciationRate: initialData?.depreciationRate || 0,
      location: initialData?.location || "",
      condition: initialData?.condition || "Good",
      status: initialData?.status || "Active",
    },
  });

  // Watch purchase price and depreciation rate for automatic current value calculation
  const purchasePrice = form.watch("purchasePrice") || 0;
  const depreciationRate = form.watch("depreciationRate") || 0;
  const purchaseDate = form.watch("purchaseDate");

  // Calculate depreciated value
  const calculateCurrentValue = () => {
    if (!purchaseDate || purchasePrice <= 0) return purchasePrice;

    const yearsElapsed =
      (new Date().getTime() - purchaseDate.getTime()) /
      (1000 * 60 * 60 * 24 * 365.25);
    const depreciation =
      ((purchasePrice * depreciationRate) / 100) * yearsElapsed;
    return Math.max(0, purchasePrice - depreciation);
  };

  // Auto-update current value when relevant fields change
  const handleAutoCalculateValue = () => {
    if (purchasePrice > 0 && depreciationRate > 0 && purchaseDate) {
      const calculatedValue = calculateCurrentValue();
      form.setValue("currentValue", parseFloat(calculatedValue.toFixed(2)));
    }
  };

  const conditionOptions = [
    { value: "Excellent", label: "Excellent" },
    { value: "Good", label: "Good" },
    { value: "Fair", label: "Fair" },
    { value: "Poor", label: "Poor" },
  ];

  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Disposed", label: "Disposed" },
    { value: "Maintenance", label: "Under Maintenance" },
  ];

  const handleFormSubmit = (data: FixedAssetFormData) => {
    console.log("[FORM] Form submitted with data:", JSON.stringify(data, null, 2));
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6 max-h-[80vh] overflow-y-auto"
      >
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Excavator CAT 320D" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assetCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="EQ-2024-001" {...field} />
                    </FormControl>
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Warehouse A, Site Office, etc."
                        {...field}
                      />
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
                    <Textarea
                      placeholder="Detailed description of the asset, specifications, and features"
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

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Purchase Date *</FormLabel>
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
                              <span>Pick purchase date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={date => {
                            field.onChange(date);
                            // Auto-calculate current value after date selection
                            setTimeout(handleAutoCalculateValue, 100);
                          }}
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
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price (SAR) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={e => {
                          field.onChange(e);
                          setTimeout(handleAutoCalculateValue, 100);
                        }}
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
                name="depreciationRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Depreciation Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="10.00"
                        {...field}
                        onChange={e => {
                          field.onChange(e);
                          setTimeout(handleAutoCalculateValue, 100);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Value (SAR) *</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAutoCalculateValue}
                        title="Auto-calculate based on depreciation"
                      >
                        <Calculator className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Show calculated depreciation info */}
            {purchasePrice > 0 && depreciationRate > 0 && purchaseDate && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-sm text-blue-700 dark:text-blue-400">
                  <div className="font-medium mb-1">
                    Depreciation Information:
                  </div>
                  <div>
                    Annual Depreciation:{" "}
                    {((purchasePrice * depreciationRate) / 100).toLocaleString(
                      "en-US",
                      { style: "currency", currency: "SAR" }
                    )}
                  </div>
                  <div>
                    Age:{" "}
                    {(
                      (new Date().getTime() - purchaseDate.getTime()) /
                      (1000 * 60 * 60 * 24 * 365.25)
                    ).toFixed(1)}{" "}
                    years
                  </div>
                  <div>
                    Calculated Current Value:{" "}
                    {calculateCurrentValue().toLocaleString("en-US", {
                      style: "currency",
                      currency: "SAR",
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status & Condition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {conditionOptions.map(option => (
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
            className="w-full sm:w-auto order-1 sm:order-2 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading
              ? "Saving..."
              : initialData
                ? "Update Asset"
                : "Create Asset"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
