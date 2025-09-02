import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import ProgressBar from "@/components/ui/progress-bar";
import ProjectForm from "@/components/forms/project-form";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { Eye, Edit, Trash2, MoreVertical } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Project } from "@/lib/schema";

// Edit form schema with validation
const editProjectSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(80, "Name must be at most 80 characters"),
  client: z.string().min(1, "Client is required"),
  status: z.enum(["Active", "On Hold", "Completed"]),
  progress: z.coerce.number().min(0, "Progress must be at least 0").max(100, "Progress must be at most 100"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  budget: z.coerce.number().min(0, "Budget must be at least 0").optional(),
  description: z.string().max(2000, "Description must be at most 2000 characters").optional(),
}).refine((data) => {
  if (!data.endDate) return true;
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate > startDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type EditProjectFormData = z.infer<typeof editProjectSchema>;

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["projects-records"],
    queryFn: () => {
      try {
        const storedData = localStorage.getItem('projects-records');
        return storedData ? JSON.parse(storedData) : [];
      } catch (error) {
        console.error('Error loading projects from localStorage:', error);
        return [];
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const storedData = localStorage.getItem('projects-records');
        const existingRecords = storedData ? JSON.parse(storedData) : [];
        const updatedRecords = existingRecords.filter((record: any) => record.id !== id);
        localStorage.setItem('projects-records', JSON.stringify(updatedRecords));
        return { success: true };
      } catch (error) {
        throw new Error('Failed to delete project from localStorage');
      }
    },
    onSuccess: () => {
      console.log('✅ Frontend: Delete request successful');
      queryClient.invalidateQueries({ queryKey: ["projects-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Project deleted successfully" });
    },
    onError: (error) => {
      console.error('❌ Frontend: Delete request failed:', error);
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditProjectFormData }) => {
      try {
        const storedData = localStorage.getItem('projects-records');
        const existingRecords = storedData ? JSON.parse(storedData) : [];
        const updatedRecords = existingRecords.map((record: any) => 
          record.id === id ? { 
            ...record, 
            name: data.name,
            clientName: data.client,
            status: data.status,
            progress: data.progress,
            startDate: data.startDate,
            endDate: data.endDate || null,
            budget: data.budget || 0,
            description: data.description || '',
            updatedAt: new Date().toISOString()
          } : record
        );
        localStorage.setItem('projects-records', JSON.stringify(updatedRecords));
        return { success: true };
      } catch (error) {
        throw new Error('Failed to update project in localStorage');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects-records"] });
      toast({ title: "Success", description: "Project updated successfully" });
      setIsEditDialogOpen(false);
      setEditingProject(null);
    },
    onError: (error) => {
      console.error('❌ Frontend: Update request failed:', error);
      toast({ title: "Error", description: "Failed to update project", variant: "destructive" });
    },
  });

  const editForm = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: '',
      client: '',
      status: 'Active',
      progress: 0,
      startDate: '',
      endDate: '',
      budget: 0,
      description: '',
    },
  });

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    editForm.reset({
      name: project.name,
      client: project.clientName || '',
      status: project.status === 'active' ? 'Active' : 
              project.status === 'cancelled' ? 'On Hold' : 
              project.status === 'completed' ? 'Completed' : 'Active',
      progress: project.progress,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      budget: project.budget || 0,
      description: project.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = (data: EditProjectFormData) => {
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data });
    }
  };

  const formatCurrencyDisplay = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const formatDateDisplay = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US').format(new Date(dateString));
  };

  const filteredProjects = projects?.filter(project => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    const matchesType = typeFilter === "all" || project.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: "bg-green-100 text-green-800",
      planning: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-gray-100 text-gray-800",
      // Legacy support for capitalized values
      Active: "bg-green-100 text-green-800",
      Planning: "bg-yellow-100 text-yellow-800",
      "On Hold": "bg-red-100 text-red-800",
      Completed: "bg-gray-100 text-gray-800",
    };
    return (
      statusMap[status as keyof typeof statusMap] || "bg-gray-100 text-gray-800"
    );
  };

  const getStatusDisplay = (status: string) => {
    const displayMap = {
      active: "Active",
      planning: "Planning",
      cancelled: "On Hold",
      completed: "Completed",
    };
    return displayMap[status as keyof typeof displayMap] || status;
  };

  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    return `SAR ${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount)}`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Project Management
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
            >
              <div className="w-full h-48 bg-gray-200"></div>
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
        <ProjectForm />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Projects
              </label>
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="cancelled">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type
              </label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full"
                onClick={e => {
                  e.preventDefault();
                  console.log("Clear Filters clicked"); // Debug log
                  setSearchQuery("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects?.map(project => (
          <Card
            key={project.id}
            id={`project-card-${project.id}`}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-video overflow-hidden">
              <img
                src={
                  project.imageUrl ||
                  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
                }
                alt={project.name}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-6 flex flex-col h-full min-h-[400px] relative">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {project.name}
                </h3>
                <Badge className={getStatusBadge(project.status)}>
                  {getStatusDisplay(project.status)}
                </Badge>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {project.description || "No description available"}
              </p>

              <div className="space-y-3 flex-grow">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} />

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Budget</span>
                  <span className="font-medium">
                    {formatCurrency(String(project.budget))}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Due Date</span>
                  <span className="font-medium">
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 absolute top-2 right-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Sheet>
                      <SheetTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                      </SheetTrigger>
                      <SheetContent className="w-[400px] sm:w-[540px]">
                        <SheetHeader>
                          <SheetTitle>{project.name}</SheetTitle>
                          <SheetDescription>
                            Complete project information and details
                          </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6 space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Name</label>
                              <p className="text-sm text-gray-900">{project.name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Client</label>
                              <p className="text-sm text-gray-900">{project.clientName || 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Status</label>
                              <Badge className={getStatusBadge(project.status)}>
                                {getStatusDisplay(project.status)}
                              </Badge>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Progress</label>
                              <p className="text-sm text-gray-900">{project.progress}%</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Budget</label>
                              <p className="text-sm text-gray-900">
                                {formatCurrencyDisplay(project.budget || 0)}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Start Date</label>
                              <p className="text-sm text-gray-900">
                                {project.startDate ? formatDateDisplay(project.startDate) : 'Not set'}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <label className="text-sm font-medium text-gray-500">End Date</label>
                              <p className="text-sm text-gray-900">
                                {project.endDate ? formatDateDisplay(project.endDate) : 'Not set'}
                              </p>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Description</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {project.description || 'No description available'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Activity</label>
                            <div className="mt-2 space-y-2">
                              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                • Project created on {project.createdAt ? formatDateDisplay(project.createdAt) : 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                • Last updated on {project.updatedAt ? formatDateDisplay(project.updatedAt) : 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                • Current progress: {project.progress}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                    <DropdownMenuItem onClick={() => handleEdit(project)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the project "{project.name}" and remove all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(String(project.id))}
                            disabled={deleteMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects?.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            No projects found matching your criteria
          </div>
          <ProjectForm />
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project information and details
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter client name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="On Hold">On Hold</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Progress (0-100) *</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (SAR)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter project description" 
                        className="resize-none" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Project'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
