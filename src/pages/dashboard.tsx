import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import StatsCard from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  Users,
  DollarSign,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Eye,
  PieChart,
  TrendingUp,
  ShoppingCart,
  Calendar,
  FileText,
  Wrench,
  Plus,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import type {
  Project,
  Transaction,
  Employee,
  Purchase,
  Supplier,
} from "@/lib/schema";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardStats {
  projects: { active: number; total: number; completed: number };
  employees: { total: number; active: number; onLeave: number; absent: number };
  financial: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    pendingInvoices: number;
  };
  recentActivities: Array<{
    id: number;
    description: string;
    userName: string;
    timestamp: string;
  }>;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: purchases = [] } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace(/\s/g, " "); // Ensure single space for professional display
  };

  if (statsLoading || projectsLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
  };

  // Project Status Chart Data
  const projectStatusData = {
    labels: ["Planning", "Active", "Completed", "On Hold"],
    datasets: [
      {
        data: [
          (projects || []).filter(p => p.status === "planning").length,
          (projects || []).filter(p => p.status === "active").length,
          (projects || []).filter(p => p.status === "completed").length,
          (projects || []).filter(p => p.status === "cancelled").length,
        ],
        backgroundColor: [
          "#3B82F6", // Blue
          "#F59E0B", // Amber
          "#10B981", // Emerald
          "#EF4444", // Red
        ],
        borderWidth: 0,
      },
    ],
  };

  // Financial Trend Data (Last 4 months)
  const last4Months = Array.from({ length: 4 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (3 - i));
    return date.toLocaleDateString("en-US", { month: "short" });
  });

  const monthlyIncome = last4Months.map(month => {
    return transactions
      .filter(
        t =>
          t.type === "income" &&
          new Date(t.date).toLocaleDateString("en-US", { month: "short" }) ===
            month
      )
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  });

  const monthlyExpenses = last4Months.map(month => {
    return transactions
      .filter(
        t =>
          t.type === "expense" &&
          new Date(t.date).toLocaleDateString("en-US", { month: "short" }) ===
            month
      )
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  });

  const financialTrendData = {
    labels: last4Months,
    datasets: [
      {
        label: "Income",
        data: monthlyIncome,
        backgroundColor: "#10b981",
        borderColor: "#059669",
        borderWidth: 2,
      },
      {
        label: "Expenses",
        data: monthlyExpenses,
        backgroundColor: "#ef4444",
        borderColor: "#dc2626",
        borderWidth: 2,
      },
    ],
  };

  // Employee Department Distribution
  const departmentData = employees.reduce(
    (acc, emp) => {
      const dept = emp.department || "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const employeeDeptData = {
    labels: Object.keys(departmentData),
    datasets: [
      {
        data: Object.values(departmentData),
        backgroundColor: [
          "#3B82F6",
          "#8B5CF6",
          "#10B981",
          "#F59E0B",
          "#EF4444",
          "#06B6D4",
        ],
        borderWidth: 0,
      },
    ],
  };

  // Purchase Status Distribution
  const purchaseStatusData = purchases.reduce(
    (acc, purchase) => {
      const status = purchase.status || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const purchaseChartData = {
    labels: Object.keys(purchaseStatusData),
    datasets: [
      {
        data: Object.values(purchaseStatusData),
        backgroundColor: [
          "#8B5CF6",
          "#06B6D4",
          "#10B981",
          "#F59E0B",
          "#EF4444",
        ],
        borderWidth: 0,
      },
    ],
  };

  // Calculate totals for display
  const totalRevenue = transactions
    .filter(t => t.type === "Income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpenses = transactions
    .filter(t => t.type === "Expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalPurchases = purchases.reduce(
    (sum, p) => sum + parseFloat(p.totalAmount || "0"),
    0
  );
  const activeSuppliers = suppliers.filter(s => s.status === "Active").length;

  const getStatusBadge = (status: string) => {
    const statusMap = {
      Active: "bg-green-100 text-green-800",
      Planning: "bg-yellow-100 text-yellow-800",
      "On Hold": "bg-red-100 text-red-800",
      Completed: "bg-blue-100 text-blue-800",
    };
    return (
      statusMap[status as keyof typeof statusMap] || "bg-gray-100 text-gray-800"
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
          Overview of construction management system performance
        </p>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Active Projects"
          value={(projects || []).filter(p => p.status === "Active").length}
          icon={FolderOpen}
          trend={{ value: "12% from last month", isPositive: true }}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <StatsCard
          title="Total Employees"
          value={employees.length}
          icon={Users}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-50"
        />
        <StatsCard
          title="Purchase Orders"
          value={purchases.length}
          icon={ShoppingCart}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
        />
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p
                  className={`text-2xl font-bold ${totalRevenue - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(totalRevenue - totalExpenses)}
                </p>
              </div>
              <div
                className={`p-3 rounded-full ${totalRevenue - totalExpenses >= 0 ? "bg-green-50" : "bg-red-50"}`}
              >
                <TrendingUp
                  className={`h-6 w-6 ${totalRevenue - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Suppliers
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {activeSuppliers}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-full">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Completed Projects
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {
                    (projects || []).filter(p => p.status === "completed")
                      .length
                  }
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Financial Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Financial Trend (Last 4 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={financialTrendData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Project Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut data={projectStatusData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Employee Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Workforce by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {Object.keys(departmentData).length > 0 ? (
                <Pie data={employeeDeptData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No department data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Purchase Orders Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {Object.keys(purchaseStatusData).length > 0 ? (
                <Doughnut data={purchaseChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No purchase data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setLocation("/projects")}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Create New Project
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setLocation("/workforce")}
            >
              <Users className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setLocation("/purchases")}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setLocation("/reports")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(projects || []).slice(0, 5).map(project => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {project.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Budget:{" "}
                      {formatCurrency(parseFloat(project.budget || "0"))}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusBadge(project.status)}>
                      {project.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setLocation("/projects")}
                      title="View Project Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {(!projects || projects.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No projects found</p>
                  <Button
                    className="mt-2"
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/projects")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Project
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {(projects || []).length}
              </div>
              <div className="text-sm text-gray-600">Total Projects</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(projects || []).length > 0
                  ? Math.round(
                      ((projects || []).filter(p => p.status === "completed")
                        .length /
                        (projects || []).length) *
                        100
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalPurchases)}
              </div>
              <div className="text-sm text-gray-600">Total Purchases</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {suppliers.length}
              </div>
              <div className="text-sm text-gray-600">Total Suppliers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
