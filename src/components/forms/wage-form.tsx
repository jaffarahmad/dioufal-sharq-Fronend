import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Employee, Wage } from "@/lib/schema";

const wageFormSchema = z
  .object({
    employeeId: z.string().min(1, "Employee is required"),
    period: z.string().min(1, "Period is required"),
    startDate: z.date({ required_error: "Start date is required" }),
    endDate: z.date({ required_error: "End date is required" }),
    basicSalary: z
      .string()
      .min(1, "Basic salary is required")
      .refine(
        val => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        "Basic salary must be a positive number"
      ),
    overtimePay: z.string().optional().default("0"),
    bonuses: z.string().optional().default("0"),
    deductions: z.string().optional().default("0"),
  })
  .refine(data => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

type WageFormValues = z.infer<typeof wageFormSchema>;

interface WageFormProps {
  employees: Employee[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Wage;
}

export default function WageForm({
  employees,
  onSubmit,
  onCancel,
  isLoading,
  initialData,
}: WageFormProps) {
  const form = useForm<WageFormValues>({
    resolver: zodResolver(wageFormSchema),
    defaultValues: initialData ? {
      employeeId: initialData.employeeId.toString(),
      period: initialData.period,
      startDate: new Date(initialData.paymentDate),
      endDate: new Date(initialData.paymentDate),
      basicSalary: (initialData.amount - initialData.overtime - initialData.bonuses + initialData.deductions).toString(),
      overtimePay: initialData.overtime.toString(),
      bonuses: initialData.bonuses.toString(),
      deductions: initialData.deductions.toString(),
    } : {
      employeeId: "",
      period: "",
      overtimePay: "0",
      bonuses: "0",
      deductions: "0",
    },
  });

  const handleSubmit: SubmitHandler<WageFormValues> = (data: WageFormValues) => {
    console.log("Wage form submitted with data:", data);

    const basicSalary = parseFloat(data.basicSalary);
    const overtimePay = parseFloat(data.overtimePay || "0");
    const bonuses = parseFloat(data.bonuses || "0");
    const deductions = parseFloat(data.deductions || "0");
    const totalAmount = basicSalary + overtimePay + bonuses - deductions;

    const formattedData = {
      employeeId: parseInt(data.employeeId),
      amount: totalAmount,
      paymentDate: data.endDate.toISOString().split('T')[0],
      period: data.period,
      hoursWorked: 0, // Default value, can be updated if needed
      overtime: overtimePay,
      deductions: deductions,
      bonuses: bonuses,
      notes: `Basic Salary: ${basicSalary}, Start: ${data.startDate.toISOString().split('T')[0]}, End: ${data.endDate.toISOString().split('T')[0]}`,
    };

    console.log("Sending wage data:", formattedData);
    onSubmit(formattedData);
  };

  const basicSalary = parseFloat(form.watch("basicSalary") || "0");
  const overtimePay = parseFloat(form.watch("overtimePay") || "0");
  const bonuses = parseFloat(form.watch("bonuses") || "0");
  const deductions = parseFloat(form.watch("deductions") || "0");
  const totalPay = basicSalary + overtimePay + bonuses - deductions;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-3 sm:space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={value => field.onChange(value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem
                        key={employee.id}
                        value={employee.id.toString()}
                      >
                        {employee.name} - {employee.position}
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
            name="period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pay Period</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
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
                          <span>Pick a date</span>
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
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
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
                          <span>Pick a date</span>
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="basicSalary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Basic Salary (SAR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
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
            name="overtimePay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overtime Pay (SAR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="bonuses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bonuses (SAR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
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
            name="deductions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deductions (SAR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Total Pay Summary */}
        <div className="bg-cyan-50 dark:bg-cyan-800 p-3 sm:p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
            <span className="font-medium text-sm sm:text-base">Total Pay:</span>
            <span className="text-lg sm:text-xl font-bold text-green-600">
              {totalPay.toLocaleString("en-US", {
                style: "currency",
                currency: "SAR",
              })}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
            <div className="flex justify-between items-center">
              <span>Basic Salary:</span>
              <span className="font-mono text-xs sm:text-sm">
                {basicSalary.toLocaleString("en-US", {
                  style: "currency",
                  currency: "SAR",
                })}
              </span>
            </div>
            {overtimePay > 0 && (
              <div className="flex justify-between items-center text-blue-600">
                <span>+ Overtime:</span>
                <span className="font-mono text-xs sm:text-sm">
                  {overtimePay.toLocaleString("en-US", {
                    style: "currency",
                    currency: "SAR",
                  })}
                </span>
              </div>
            )}
            {bonuses > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span>+ Bonuses:</span>
                <span className="font-mono text-xs sm:text-sm">
                  {bonuses.toLocaleString("en-US", {
                    style: "currency",
                    currency: "SAR",
                  })}
                </span>
              </div>
            )}
            {deductions > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span>- Deductions:</span>
                <span className="font-mono text-xs sm:text-sm">
                  {deductions.toLocaleString("en-US", {
                    style: "currency",
                    currency: "SAR",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
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
            variant="primary"
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {isLoading ? "Creating..." : "Create Wage Entry"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
