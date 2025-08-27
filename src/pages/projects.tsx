import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import ProgressBar from "@/components/ui/progress-bar";
import ProjectForm from "@/components/forms/project-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { Eye, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Project } from "@/lib/schema";

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const { toast } = useToast();
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      console.log('🌐 Frontend: Making DELETE request to /api/projects/' + id);
      return apiRequest(`/api/projects/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      console.log('✅ Frontend: Delete request successful');
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      notifications.success("Project Deleted", "Project deleted successfully");
    },
    onError: (error) => {
      console.error('❌ Frontend: Delete request failed:', error);
      notifications.error("Delete Failed", "Failed to delete project");
    },
  });

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
      Active: "bg-green-100 text-green-800",
      Planning: "bg-yellow-100 text-yellow-800",
      "On Hold": "bg-red-100 text-red-800",
      Completed: "bg-gray-100 text-gray-800",
    };
    return (
      statusMap[status as keyof typeof statusMap] || "bg-gray-100 text-gray-800"
    );
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
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
                  <SelectItem value="On Hold">On Hold</SelectItem>
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {project.name}
                </h3>
                <Badge className={getStatusBadge(project.status)}>
                  {project.status}
                </Badge>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {project.description || "No description available"}
              </p>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} />

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Budget</span>
                  <span className="font-medium">
                    {formatCurrency(project.budget)}
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

              <div className="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full sm:flex-1"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                    <DialogHeader>
                      <DialogTitle>{project.name}</DialogTitle>
                      <DialogDescription>
                        Project details and information
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="aspect-video overflow-hidden rounded-lg">
                        <img
                          src={
                            project.imageUrl ||
                            "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
                          }
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Project Type
                          </label>
                          <p className="text-sm text-gray-900">
                            {project.type}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Status
                          </label>
                          <Badge className={getStatusBadge(project.status)}>
                            {project.status}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Budget
                          </label>
                          <p className="text-sm text-gray-900">
                            {formatCurrency(project.budget)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Progress
                          </label>
                          <p className="text-sm text-gray-900">
                            {project.progress}%
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Start Date
                          </label>
                          <p className="text-sm text-gray-900">
                            {project.startDate
                              ? new Date(project.startDate).toLocaleDateString()
                              : "Not set"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Due Date
                          </label>
                          <p className="text-sm text-gray-900">
                            {project.endDate
                              ? new Date(project.endDate).toLocaleDateString()
                              : "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="text-sm font-medium text-gray-500">
                          Description
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {project.description || "No description available"}
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <ProjectForm project={project} />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('🗑️ Frontend: Delete button clicked for project:', project.id, typeof project.id);
                      if (window.confirm(`Are you sure you want to delete project "${project.name}"?`)) {
                        deleteMutation.mutate(project.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                  <Trash2 className="mr-2 h-4 w-4 sm:mr-0" />
                  <span className="sm:hidden">Delete</span>
                </Button>
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
    </div>
  );
}
