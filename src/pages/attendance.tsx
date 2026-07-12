import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Clock,
  UserCheck,
  Calendar,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { type Attendance, type Employee, type Project } from "@/lib/schema";
import AttendanceForm from "@/components/forms/attendance-form";
import StatsCard from "@/components/ui/stats-card";

export default function AttendancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  const {
    data: attendanceData,
    isLoading,
    error,
  } = useQuery<Attendance[]>({
    queryKey: ["attendance-records"],
    queryFn: () => {
      const stored = localStorage.getItem("attendance-records");
      return stored ? JSON.parse(stored) : [];
    },
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["employees-records"],
    queryFn: () => {
      const stored = localStorage.getItem("employees-records");
      return stored ? JSON.parse(stored) : [];
    },
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["projects-records"],
    queryFn: () => {
      const stored = localStorage.getItem("projects-records");
      return stored ? JSON.parse(stored) : [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      const stored = localStorage.getItem("attendance-records");
      const records = stored ? JSON.parse(stored) : [];
      const updatedRecords = records.filter((record: Attendance) => record.id !== Number(id));
      localStorage.setItem("attendance-records", JSON.stringify(updatedRecords));
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      notifications.success("Success", "Attendance record deleted successfully");
    },
    onError: (error: any) => {
      notifications.error("Error", error.message || "Failed to delete attendance record");
    },
  });

  const handleDelete = (id: string | number) => {
    if (
      window.confirm("Are you sure you want to delete this attendance record?")
    ) {
      deleteMutation.mutate(id.toString());
    }
  };

  const attendance = attendanceData || [];

  // Helper functions to get names
  const getEmployeeName = (employeeId: number | string | null) => {
    const employee = employees?.find(emp => emp.id === Number(employeeId));
    return employee ? employee.name : "Unknown Employee";
  };

  const getProjectName = (projectId: number | string | null) => {
    if (!projectId) return "No Project";
    const project = projects?.find(proj => proj.id === String(projectId));
    return project ? project.name : "Unknown Project";
  };

  // Filter attendance records
  const today = new Date().toDateString();
  const filteredAttendance = attendance.filter(record => {
    const employeeName = getEmployeeName(record.employeeId);
    const projectName = getProjectName(record.projectId);
    const recordDate = new Date(record.date).toDateString();

    const matchesSearch =
      employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.status || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter;

    let matchesDate = true;
    if (dateFilter === "today") {
      matchesDate = recordDate === today;
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(record.date) >= weekAgo;
    } else if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = new Date(record.date) >= monthAgo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      late: "bg-yellow-100 text-yellow-800",
      "half-day": "bg-gray-100 text-foreground",
      // Keep capitalized versions for backward compatibility
      Present: "bg-green-100 text-green-800",
      Absent: "bg-red-100 text-red-800",
      Late: "bg-yellow-100 text-yellow-800",
      "Half-Day": "bg-gray-100 text-foreground",
    };
    return (
      statusMap[status as keyof typeof statusMap] || "bg-gray-100 text-foreground"
    );
  };

  const formatTime = (timestamp: Date | string | null | undefined) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate stats
  const totalRecords = attendance.length;
  const todayRecords = attendance.filter(
    record => new Date(record.date).toDateString() === today
  );
  const presentToday = todayRecords.filter(
    record => record.status === "present"
  ).length;
  const absentToday = todayRecords.filter(
    record => record.status === "absent"
  ).length;
  const lateToday = todayRecords.filter(
    record => record.status === "late"
  ).length;

  if (isLoading) {
    return <div className="p-6">Loading attendance records...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">Error loading attendance records</div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          Employee Attendance
        </h2>
        <AttendanceForm />
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatsCard
          title="Today's Present"
          value={presentToday}
          icon={UserCheck}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <StatsCard
          title="Today's Absent"
          value={absentToday}
          icon={Calendar}
          iconColor="text-red-600"
          iconBgColor="bg-red-50"
        />
        <StatsCard
          title="Today's Late"
          value={lateToday}
          icon={Clock}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-50"
        />
        <StatsCard
          title="Total Records"
          value={totalRecords}
          icon={Clock}
          iconColor="text-blue-600"
          iconBgColor="bg-muted/50"
        />
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <CardTitle>Attendance Records</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search attendance..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="half-day">Half-Day</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Check-In</TableHead>
                  <TableHead>Check-Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.map(record => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {getEmployeeName(record.employeeId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {getProjectName(record.projectId)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(record.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTime(record.checkIn)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTime(record.checkOut)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.hoursWorked ? `${record.hoursWorked}h` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(record.status || "")}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <AttendanceForm
                          attendance={record}
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
                          onClick={() => handleDelete(record.id)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
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
            {filteredAttendance.map(record => (
              <Card key={record.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-foreground">
                        {getEmployeeName(record.employeeId)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getProjectName(record.projectId)}
                      </div>
                    </div>
                    <Badge className={getStatusBadge(record.status || "")}>
                      {record.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <div className="font-medium">
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hours:</span>
                      <div className="font-medium">
                        {record.hoursWorked ? `${record.hoursWorked}h` : "-"}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-In:</span>
                      <div className="font-medium">
                        {formatTime(record.checkIn)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-Out:</span>
                      <div className="font-medium">
                        {formatTime(record.checkOut)}
                      </div>
                    </div>
                  </div>

                  {record.notes && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Notes:</span>
                      <div className="font-medium">{record.notes}</div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <AttendanceForm
                      attendance={record}
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
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredAttendance.length === 0 && (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="text-muted-foreground mb-4">
                No attendance records found
              </div>
              <AttendanceForm />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
