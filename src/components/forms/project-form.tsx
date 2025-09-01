import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, type InsertProject, type Project } from "@/lib/schema";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit } from "lucide-react";
import { captureProjectCard } from "@/utils/png-screenshot";

interface ProjectFormProps {
  onSuccess?: () => void;
  project?: Project;
}

export default function ProjectForm({ onSuccess, project }: ProjectFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: project || {
      name: "",
      description: "",
      status: "planning",
      budget: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: undefined,
      clientName: "",
      clientContact: "",
      clientEmail: "",
      progress: 0,
      type: "",
      imageUrl: "",
    },
  });

  // Reset form when project prop changes (for editing)
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name || "",
        description: project.description || "",
        status: project.status || "planning",
        budget: typeof project.budget === 'string' ? parseFloat(project.budget) || 0 : project.budget || 0,
        startDate: project.startDate || new Date().toISOString().split('T')[0],
        endDate: project.endDate || undefined,
        clientName: project.clientName || "",
        clientContact: project.clientContact || "",
        clientEmail: project.clientEmail || "",
        progress: project.progress || 0,
        type: project.type || "",
        imageUrl: project.imageUrl || "",
      });
    }
  }, [project, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      console.log("Creating project with data:", data);
      // Get existing records from localStorage
      const storedData = localStorage.getItem('projects-records');
      const existingRecords = storedData ? JSON.parse(storedData) : [];
      
      // Create new record with ID and timestamps
      const newRecord = {
        ...data,
        id: Date.now().toString(), // Simple ID generation
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Add to existing records
      const updatedRecords = [...existingRecords, newRecord];
      
      // Save back to localStorage
      localStorage.setItem('projects-records', JSON.stringify(updatedRecords));
      
      return newRecord;
    },
    onSuccess: async (response) => {
      console.log("Project created successfully:", response);
      queryClient.invalidateQueries({ queryKey: ["projects-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Project created successfully" });
      
      // Capture screenshot of the project card after creation
      try {
        // Wait longer for the UI to fully update and render
        await new Promise(resolve => setTimeout(resolve, 2000));
        await captureProjectCard(response.id, `project-${response.name}-screenshot.png`);
        console.log("Screenshot captured successfully for project:", response.id);
      } catch (error) {
        console.error("Failed to capture screenshot:", error);
        // Don't show error to user as screenshot is not critical
      }
      
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Failed to create project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      console.log("Updating project with data:", data);
      // Get existing records from localStorage
      const storedData = localStorage.getItem('projects-records');
      const existingRecords = storedData ? JSON.parse(storedData) : [];
      
      // Find and update the record
      const updatedRecords = existingRecords.map((r: any) => 
        r.id === project?.id 
          ? { ...r, ...data, updatedAt: new Date().toISOString() }
          : r
      );
      
      // Save back to localStorage
      localStorage.setItem('projects-records', JSON.stringify(updatedRecords));
      
      return { ...project, ...data, updatedAt: new Date().toISOString() };
    },
    onSuccess: async (response) => {
      console.log("Project updated successfully:", response);
      queryClient.invalidateQueries({ queryKey: ["projects-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Project updated successfully" });
      
      // Capture screenshot of the updated project card
      try {
        // Wait longer for the UI to fully update and render
        await new Promise(resolve => setTimeout(resolve, 2000));
        await captureProjectCard(response.id, `project-${response.name}-updated-screenshot.png`);
        console.log("Screenshot captured successfully for updated project:", response.id);
      } catch (error) {
        console.error("Failed to capture screenshot:", error);
        // Don't show error to user as screenshot is not critical
      }
      
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Failed to update project:", error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProject) => {
    console.log("Form submitted with data:", data);
    console.log("Project ID:", project?.id);
    if (project?.id) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={
            project ? "w-full sm:flex-1" : "bg-primary hover:bg-primary/90"
          }
          variant={project ? "outline" : "default"}
          size={project ? "sm" : "default"}
        >
          {project ? (
            <Edit className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {project ? "Edit" : "New Project"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full bg-white border shadow-xl">
        <DialogHeader>
          <DialogTitle>
            {project ? "Edit Project" : "Create New Project"}
          </DialogTitle>
          <DialogDescription>
            {project
              ? "Update project details and settings."
              : "Fill in the details to create a new construction project."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 p-1"
          >
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Project Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter project name"
                          {...field}
                          value={field.value || ""}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Project Type
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter project type"
                          {...field}
                          value={field.value || ""}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Project Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter project description"
                      {...field}
                      value={field.value || ""}
                      className="min-h-[100px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Budget & Status Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Budget & Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/50 p-4 rounded-lg border">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Budget (SAR)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value || ""}
                          onChange={e =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : 0
                            )
                          }
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Status
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="cancelled">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Timeline Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Project Timeline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-purple-50/30 p-4 rounded-lg border border-purple-200">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Start Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            field.value
                              ? new Date(field.value)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={e =>
                            field.onChange(
                              e.target.value || undefined
                            )
                          }
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        End Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            field.value
                              ? new Date(field.value)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={e =>
                            field.onChange(
                              e.target.value || undefined
                            )
                          }
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Client Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                Client Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-emerald-50/30 p-4 rounded-lg border border-emerald-200">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Client Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter client name"
                          {...field}
                          value={field.value || ""}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Client Contact
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter client contact"
                          {...field}
                          value={field.value || ""}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Client Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter client email"
                          {...field}
                          value={field.value || ""}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Additional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Progress (%)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Enter progress percentage"
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Image URL
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter image URL"
                          {...field}
                          value={field.value || ""}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t mt-8 bg-indigo-50/30 p-4 rounded-lg">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {project ? "Updating..." : "Creating..."}
                  </>
                ) : project ? (
                  "Update Project"
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
