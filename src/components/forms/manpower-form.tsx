import { useState, useEffect } from "react";
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
  insertManpowerSchema,
  type InsertManpower,
  type Manpower,
  type Employee,
  type Project,
} from "@/lib/schema";
import { Plus, Users } from "lucide-react";
import { z } from "zod";

// Extended schema for form validation - matching actual manpower schema
const manpowerFormSchema = z.object({
  employeeId: z.string({ required_error: "Employee is required" }),
  projectId: z.string({ required_error: "Project is required" }),
  role: z.string().min(1, "Role is required"),
  assignedDate: z.string().min(1, "Assigned date is required"),
  endDate: z.string().optional(),
  dailyRate: z.coerce.number().min(0, "Daily rate must be positive"),
  status: z.enum(["active", "completed", "terminated"]).default("active"),
});

type ManpowerFormData = z.infer<typeof manpowerFormSchema>;

interface ManpowerFormProps {
  manpower?: Manpower;
  trigger?: React.ReactNode;
}

export default function ManpowerForm({ manpower, trigger }: ManpowerFormProps) {
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

  const form = useForm<ManpowerFormData>({
    resolver: zodResolver(manpowerFormSchema),
    defaultValues: {
      employeeId: manpower?.employeeId || "",
      projectId: manpower?.projectId || "",
      role: manpower?.role || "",
      assignedDate: manpower?.assignedDate
        ? new Date(manpower.assignedDate).toISOString().split("T")[0]
        : "",
      endDate: manpower?.endDate
        ? new Date(manpower.endDate).toISOString().split("T")[0]
        : "",
      dailyRate: manpower?.dailyRate || 0,
      status: manpower?.status || "active",
    },
  });

  // Reset form when manpower prop changes (for editing)
  useEffect(() => {
    if (manpower) {
      console.log("Resetting form with manpower data:", manpower);
      form.reset({
        employeeId: manpower.employeeId,
        projectId: manpower.projectId,
        role: manpower.role,
        assignedDate: manpower.assignedDate
          ? new Date(manpower.assignedDate).toISOString().split("T")[0]
          : "",
        endDate: manpower.endDate
          ? new Date(manpower.endDate).toISOString().split("T")[0]
          : "",
        dailyRate: manpower.dailyRate,
        status: manpower.status,
      });
    }
  }, [manpower, form]);

  // Debug: Log employees and projects data
  useEffect(() => {
    console.log("Employees data:", employees);
    console.log("Projects data:", projects);
  }, [employees, projects]);

  const createMutation = useMutation({
    mutationFn: (data: InsertManpower) =>
      apiRequest("/api/manpower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manpower"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      const { dismiss } = toast({
        title: "Success",
        description: "Employee assigned successfully",
      });
      setOpen(false);
      form.reset();
      setTimeout(() => dismiss(), 3000);
    },
    onError: (error: any) => {
      const { dismiss } = toast({
        title: "Error",
        description: error.message || "Failed to assign employee",
        variant: "destructive",
      });
      setTimeout(() => dismiss(), 5000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertManpower) =>
      apiRequest(`/api/manpower/${manpower?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manpower"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      const { dismiss } = toast({
        title: "Success",
        description: "Assignment updated successfully",
      });
      setOpen(false);
      setTimeout(() => dismiss(), 3000);
    },
    onError: (error: any) => {
      const { dismiss } = toast({
        title: "Error",
        description: "Failed to update assignment",
        variant: "destructive",
      });
      setTimeout(() => dismiss(), 5000);
    },
  });

  const onSubmit = (data: ManpowerFormData) => {
    console.log("Form submitted with data:", data);

    const manpowerData = {
      employeeId: data.employeeId,
      projectId: data.projectId,
      role: data.role,
      assignedDate: data.assignedDate,
      endDate: data.endDate || undefined,
      dailyRate: data.dailyRate,
      status: data.status,
    };

    console.log("Sending manpower data:", manpowerData);

    if (manpower) {
      updateMutation.mutate(manpowerData);
    } else {
      createMutation.mutate(manpowerData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Reset form when dialog opens
  const handleDialogChange = (newOpen: boolean) => {
    if (newOpen && !manpower) {
      form.reset({
        employeeId: "",
        projectId: "",
        role: "",
        assignedDate: "",
        endDate: "",
        dailyRate: 0,
        status: "active",
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
            <span className="hidden sm:inline">Assign Employee</span>
            <span className="sm:hidden">Assign</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {manpower ? "Edit Assignment" : "Assign Employee to Project"}
          </DialogTitle>
          <DialogDescription>
            {manpower
              ? "Update the employee assignment details below."
              : "Assign an employee to a project with their role and status."}
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
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!employees || employees.length === 0 ? (
                          <SelectItem value="no-employees" disabled>
                            {!employees
                              ? "Loading employees..."
                              : "No employees available"}
                          </SelectItem>
                        ) : (
                          employees.map(employee => (
                            <SelectItem
                              key={employee.id}
                              value={String(employee.id)}
                            >
                              {employee.name} - {employee.position}
                            </SelectItem>
                          ))
                        )}
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
                    <FormLabel>Project *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!projects || projects.length === 0 ? (
                          <SelectItem value="no-projects" disabled>
                            {!projects
                              ? "Loading projects..."
                              : "No projects available"}
                          </SelectItem>
                        ) : (
                          projects.map(project => (
                            <SelectItem
                              key={project.id}
                              value={String(project.id)}
                            >
                              {project.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Project Manager">
                        Project Manager
                      </SelectItem>
                      <SelectItem value="Site Engineer">
                        Site Engineer
                      </SelectItem>
                      <SelectItem value="Foreman">Foreman</SelectItem>
                      <SelectItem value="Supervisor">Supervisor</SelectItem>
                      <SelectItem value="Worker">Worker</SelectItem>
                      <SelectItem value="Operator">Operator</SelectItem>
                      <SelectItem value="Technician">Technician</SelectItem>
                      <SelectItem value="Safety Officer">
                        Safety Officer
                      </SelectItem>
                      <SelectItem value="Quality Inspector">
                        Quality Inspector
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assignedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dailyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Rate (SAR) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
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
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>



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
                onClick={() => console.log("Assign Employee button clicked")}
                className="w-full sm:w-auto"
              >
                {isPending
                  ? "Saving..."
                  : manpower
                    ? "Update Assignment"
                    : "Assign Employee"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
