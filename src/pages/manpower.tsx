import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  UserCheck,
  Plus,
  Search,
  Calendar,
  Users,
  Edit,
  Trash2,
} from "lucide-react";
import StatsCard from "@/components/ui/stats-card";
import ManpowerForm from "@/components/forms/manpower-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Manpower, type Employee, type Project } from "@/lib/schema";

// Real data from API instead of mock data

export default function Manpower() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: manpowerData,
    isLoading,
    error,
  } = useQuery<Manpower[]>({
    queryKey: ["/api/manpower"],
    queryFn: async () => {
      // Try to get data from localStorage first
      const storedData = localStorage.getItem('manpower-records');
      if (storedData) {
        return JSON.parse(storedData);
      }
      // Return empty array if no stored data
      return [];
    },
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get existing records from localStorage
      const storedData = localStorage.getItem('manpower-records');
      const existingRecords = storedData ? JSON.parse(storedData) : [];
      
      // Filter out the record to delete
      const updatedRecords = existingRecords.filter((r: any) => r.id !== id);
      
      // Save back to localStorage
      localStorage.setItem('manpower-records', JSON.stringify(updatedRecords));
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manpower"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      const { dismiss } = toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });
      setTimeout(() => dismiss(), 3000);
    },
    onError: (error: any) => {
      const { dismiss } = toast({
        title: "Error",
        description: error.message || "Failed to delete assignment",
        variant: "destructive",
      });
      setTimeout(() => dismiss(), 5000);
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      deleteMutation.mutate(id);
    }
  };

  const manpower = manpowerData || [];

  // Helper functions to get names
  const getEmployeeName = (employeeId: string | number | null) => {
    const employee = employees?.find(emp => emp.id.toString() === employeeId?.toString());
    return employee ? employee.name : "Unknown Employee";
  };

  const getProjectName = (projectId: string | number | null) => {
    const project = projects?.find(proj => proj.id.toString() === projectId?.toString());
    return project ? project.name : "Unknown Project";
  };

  const filteredManpower = manpower.filter(item => {
    const employeeName = getEmployeeName(item.employeeId);
    const projectName = getProjectName(item.projectId);

    const matchesSearch =
      employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      terminated: "bg-yellow-100 text-yellow-800",
    };
    return (
      statusMap[status as keyof typeof statusMap] || "bg-gray-100 text-gray-800"
    );
  };

  // Calculate stats
  const totalAssignments = manpower.length;
  const activeAssignments = manpower.filter(
    item => item.status === "active"
  ).length;
  const completedAssignments = manpower.filter(
    item => item.status === "completed"
  ).length;
  const terminatedAssignments = manpower.filter(
    item => item.status === "terminated"
  ).length;

  if (isLoading) {
    return <div className="p-6">Loading manpower assignments...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">Error loading manpower assignments</div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Manpower Allocation
        </h2>
        <ManpowerForm />
      </div>

      {/* Manpower Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatsCard
          title="Total Assignments"
          value={totalAssignments}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-gray-50"
        />
        <StatsCard
          title="Active Assignments"
          value={activeAssignments}
          icon={UserCheck}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <StatsCard
          title="Completed"
          value={completedAssignments}
          icon={Calendar}
          iconColor="text-blue-600"
          iconBgColor="bg-gray-50"
        />
        <StatsCard
          title="Terminated"
          value={terminatedAssignments}
          icon={UserCheck}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-50"
        />
      </div>

      {/* Manpower Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <CardTitle>Manpower Assignments</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search assignments..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredManpower.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {getEmployeeName(item.employeeId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {getProjectName(item.projectId)}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">{item.role}</TableCell>
                    <TableCell className="text-gray-500">
                      {item.assignedDate
                        ? new Date(item.assignedDate).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {item.endDate
                        ? new Date(item.endDate).toLocaleDateString()
                        : "Ongoing"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <ManpowerForm
                          manpower={item}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Edit className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(item.id.toString())}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredManpower.map(item => (
              <Card key={item.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {getEmployeeName(item.employeeId)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {getProjectName(item.projectId)}
                      </div>
                    </div>
                    <Badge className={getStatusBadge(item.status)}>
                      {item.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Role:</span>
                      <div className="font-medium">{item.role}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Assigned:</span>
                      <div className="font-medium">
                        {item.assignedDate
                          ? new Date(item.assignedDate).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">End Date:</span>
                      <div className="font-medium">
                        {item.endDate
                          ? new Date(item.endDate).toLocaleDateString()
                          : "Ongoing"}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <ManpowerForm
                      manpower={item}
                      trigger={
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 flex-1"
                      onClick={() => handleDelete(item.id.toString())}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredManpower.length === 0 && (
            <div className="text-center py-8">
              <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
              <div className="text-gray-500 mb-4">
                No manpower assignments found
              </div>
              <ManpowerForm />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
