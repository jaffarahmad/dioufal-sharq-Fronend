import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Eye,
  Trash2,
  Edit,
} from "lucide-react";
import EmployeeForm from "@/components/forms/employee-form";
import { Employee, Project } from "@/lib/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import StatsCard from "@/components/ui/stats-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";

interface DashboardStats {
  employees: { total: number; active: number; onLeave: number; absent: number };
}

function Workforce() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/employees/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      notifications.success(
        "Employee Deleted",
        "Employee deleted successfully"
      );
    },
    onError: () => {
      notifications.error("Delete Failed", "Failed to delete employee");
    },
  });

  const handleViewEmployee = (employee: Employee) => {
    setViewingEmployee(employee);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
  };

  const handleDeleteEmployee = (id: number) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      departmentFilter === "all" || employee.position === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      Active: "bg-green-100 text-green-800",
      "On Leave": "bg-yellow-100 text-yellow-800",
      Absent: "bg-red-100 text-red-800",
    };
    return (
      statusMap[status as keyof typeof statusMap] || "bg-gray-100 text-gray-800"
    );
  };

  const getProjectName = (projectId: number | null) => {
    if (!projectId) return "No Project";
    const project = projects?.find(p => p.id === projectId?.toString());
    return project?.name || "Unknown Project";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow p-6 animate-pulse"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="ml-4">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
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
        <h2 className="text-2xl font-bold text-gray-900">
          WorkForce Management
        </h2>
        <EmployeeForm />
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Employees"
          value={stats?.employees?.total || employees?.length || 0}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <StatsCard
          title="Active"
          value={
            stats?.employees?.active ||
            employees?.length ||
            0
          }
          icon={UserCheck}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <StatsCard
          title="On Leave"
          value={
            stats?.employees?.onLeave ||
            0 ||
            0
          }
          icon={Clock}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-50"
        />
        <StatsCard
          title="Absent"
          value={
            stats?.employees?.absent ||
            0 ||
            0
          }
          icon={UserX}
          iconColor="text-red-600"
          iconBgColor="bg-red-50"
        />
      </div>

      {/* Search and Filter Controls */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <CardTitle>Employee List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Employee Cards Grid */}
          {filteredEmployees && filteredEmployees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map(employee => (
                <Card
                  key={employee.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {employee.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {employee.position}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={getStatusBadge("active")}
                      >
                        {"Active"}
                      </Badge>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Department:</span>
                        <span className="font-medium">
                          {employee.position}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Project:</span>
                        <span className="font-medium">
                          {getProjectName(employee.projectId || null)}
                        </span>
                      </div>
                      {employee.salary && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Salary:</span>
                          <span className="font-medium">
                            ${employee.salary.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewEmployee(employee)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEmployee(employee)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No employees found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || departmentFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by adding your first employee."}
              </p>
              <EmployeeForm />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Count */}
      {filteredEmployees && filteredEmployees.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {filteredEmployees.length} of {employees?.length || 0}{" "}
          employees
        </div>
      )}

      {/* Employee Edit Dialog */}
      <Dialog
        open={!!editingEmployee}
        onOpenChange={() => setEditingEmployee(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <EmployeeForm
              employee={editingEmployee}
              onSuccess={() => setEditingEmployee(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Employee View Dialog */}
      <Dialog
        open={!!viewingEmployee}
        onOpenChange={() => setViewingEmployee(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {viewingEmployee && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Name
                  </label>
                  <p className="text-sm">{viewingEmployee.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Position
                  </label>
                  <p className="text-sm">{viewingEmployee.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="text-sm">{viewingEmployee.email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <p className="text-sm">{viewingEmployee.phone || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Salary
                  </label>
                  <p className="text-sm">
                    ${viewingEmployee.salary?.toLocaleString() || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <p className="text-sm capitalize">
                    {"Active"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Nationality
                  </label>
                  <p className="text-sm">
                    {"N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    ID Number
                  </label>
                  <p className="text-sm">{"N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Hire Date
                  </label>
                  <p className="text-sm">
                    {viewingEmployee.hireDate
                      ? new Date(viewingEmployee.hireDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Project
                  </label>
                  <p className="text-sm">
                    {projects?.find(p => p.id === viewingEmployee.projectId?.toString())
                      ?.name || "Not Assigned"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Workforce;
