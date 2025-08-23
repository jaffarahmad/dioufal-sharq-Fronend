import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
  insertAttendanceSchema,
  type InsertAttendance,
  type Attendance,
  type Employee,
  type Project,
} from "@/lib/schema";
import { Plus, Clock, User } from "lucide-react";
import { z } from "zod";

// Extended schema for form validation
const attendanceFormSchema = z.object({
  employeeId: z
    .string({ required_error: "Employee is required" })
    .min(1, "Employee is required"),
  projectId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  hoursWorked: z.string().optional(),
  overtime: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
});

type AttendanceFormData = z.infer<typeof attendanceFormSchema>;

  interface AttendanceFormProps {
  attendance?: Attendance;
  trigger?: React.ReactNode;
}

export default function AttendanceForm({
  attendance,
  trigger,
}: AttendanceFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch employees and projects for dropdowns
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const form = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      employeeId: attendance?.employeeId ? attendance.employeeId.toString() : "",
      projectId: attendance?.projectId ? attendance.projectId.toString() : "",
      date: attendance?.date
        ? new Date(attendance.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      checkIn: attendance?.checkIn
        ? new Date(attendance.checkIn).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })
        : "",
      checkOut: attendance?.checkOut
        ? new Date(attendance.checkOut).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })
        : "",
      hoursWorked: attendance?.hoursWorked ? attendance.hoursWorked.toString() : "",
      overtime: attendance?.overtime ? attendance.overtime.toString() : "0",
      status: attendance?.status || "present",
      notes: attendance?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAttendance) => {
      console.log("Making API request to create attendance:", data);
      const res = await apiRequest("/api/attendance", {
        method: "POST",
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("API Error Response:", { status: res.status, statusText: res.statusText, errorData });
        
        if (res.status === 409) {
          throw new Error(errorData.message || "Attendance record already exists for this employee on this date");
        }
        
        throw new Error(errorData.error || errorData.message || "Failed to create attendance");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      const { dismiss } = toast({
        title: "Success",
        description: "Attendance recorded successfully",
      });
      setOpen(false);
      form.reset();
      setTimeout(() => dismiss(), 3000);
    },
    onError: (error: any) => {
      console.error("Create mutation error:", error);
      const { dismiss } = toast({
        title: "Error",
        description: error.message || "Failed to record attendance",
        variant: "destructive",
      });
      setTimeout(() => dismiss(), 5000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertAttendance) => {
      console.log("Making API request to update attendance:", data);
      console.log("Attendance ID:", attendance?.id);
      
      const res = await apiRequest(`/api/attendance/${attendance?.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("API Error Response:", { status: res.status, statusText: res.statusText, errorData });
        throw new Error(errorData.error || errorData.message || "Failed to update attendance");
      }
      
      const result = await res.json();
      console.log("Update API response:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Update mutation successful:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      const { dismiss } = toast({
        title: "Success",
        description: "Attendance updated successfully",
      });
      setOpen(false);
      setTimeout(() => dismiss(), 3000);
    },
    onError: (error: any) => {
      console.error("Update mutation error:", error);
      const { dismiss } = toast({
        title: "Error",
        description: error.message || "Failed to update attendance",
        variant: "destructive",
      });
      setTimeout(() => dismiss(), 5000);
    },
  });

  const onSubmit = (data: AttendanceFormData) => {
    console.log("Form submitted with data:", data);

    // Calculate hours worked if both check-in and check-out are provided
    let calculatedHours = data.hoursWorked;
    if (data.checkIn && data.checkOut && !data.hoursWorked) {
      const checkInTime = new Date(`${data.date}T${data.checkIn}:00`);
      const checkOutTime = new Date(`${data.date}T${data.checkOut}:00`);
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      calculatedHours = Math.max(0, diffHours).toFixed(2);
    }

    const attendanceData: InsertAttendance = {
      employeeId: parseInt(data.employeeId, 10),
      projectId: data.projectId && data.projectId !== "" ? parseInt(data.projectId, 10) : 1, // Default to project 1 if none selected
      date: data.date,
      hoursWorked: calculatedHours ? parseFloat(calculatedHours) : (data.hoursWorked ? parseFloat(data.hoursWorked) : 0),
      overtime: data.overtime ? parseFloat(data.overtime) : 0,
      notes: data.notes || undefined,
    };

    console.log("Sending attendance data:", attendanceData);

    if (attendance) {
      updateMutation.mutate(attendanceData);
    } else {
      createMutation.mutate(attendanceData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Reset form when dialog opens
  const handleDialogChange = (newOpen: boolean) => {
    if (newOpen && !attendance) {
      const today = new Date().toISOString().split("T")[0];
      form.reset({
        employeeId: "",
        projectId: "",
        date: today,
        checkIn: "",
        checkOut: "",
        hoursWorked: "",
        overtime: "0",
        status: "present",
        notes: "",
      });
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Attendance</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {attendance ? "Edit Attendance" : "Record Employee Attendance"}
          </DialogTitle>
          <DialogDescription>
            {attendance
              ? "Update the attendance record details below."
              : "Record attendance for an employee including check-in/out times and work hours."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, errors => {
              console.log("Form validation errors:", errors);
            })}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee *</FormLabel>
                    <Select
                      onValueChange={value => field.onChange(value)}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.map(employee => (
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
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project (Optional)</FormLabel>
                    <Select
                      onValueChange={value =>
                        field.onChange(value === "none" ? "" : value)
                      }
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No project</SelectItem>
                        {projects?.map(project => (
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="w-full" />
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
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="half-day">Half-Day</SelectItem>
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
                name="checkIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-In Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="checkOut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-Out Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        value={field.value || ""}
                        className="w-full"
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
                name="hoursWorked"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours Worked</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="8.0"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="overtime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overtime Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="0.0"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about attendance..."
                      {...field}
                      value={field.value || ""}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  console.log("Cancel button clicked");
                  setOpen(false);
                }}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                onClick={() => console.log("Save Attendance button clicked")}
                className="w-full sm:w-auto"
              >
                {isPending
                  ? "Saving..."
                  : attendance
                    ? "Update Attendance"
                    : "Save Attendance"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
