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
  Eye,
  PieChart,
  TrendingUp,
  ShoppingCart,
  FileText,
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
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import type {
  Project,
  Transaction,
  Employee,
  Purchase,
  Supplier,
  Manpower,
  Invoice,
  Inventory,
} from "@/lib/schema";

// Register Chart.js components with error handling
try {
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
} catch (error) {
  console.warn('Failed to register Chart.js components:', error);
}


export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["projects-records"],
    queryFn: () => {
      try {
        const stored = localStorage.getItem("projects-records");
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error("Error fetching projects from localStorage:", error);
        return [];
      }
    },
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["transactions-records"],
    queryFn: () => {
      try {
        const stored = localStorage.getItem("transactions-records");
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error("Error fetching transactions from localStorage:", error);
        return [];
      }
    },
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees-records"],
    queryFn: () => {
      try {
        const stored = localStorage.getItem("employees-records");
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error("Error fetching employees from localStorage:", error);
        return [];
      }
    },
  });

  const { data: purchases = [] } = useQuery<Purchase[]>({
    queryKey: ["purchases-records"],
    queryFn: () => {
      try {
        const stored = localStorage.getItem("purchases-records");
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error("Error fetching purchases from localStorage:", error);
        return [];
      }
    },
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["suppliers-records"],
    queryFn: () => {
      try {
        const stored = localStorage.getItem("suppliers-records");
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error("Error fetching suppliers from localStorage:", error);
        return [];
      }
    },
  });

  const { data: manpower = [] } = useQuery<Manpower[]>({
    queryKey: ["manpower-records"],
    queryFn: () => {
      try {
        const stored = localStorage.getItem("manpower-records");
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error("Error fetching manpower from localStorage:", error);
        return [];
      }
    },
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["invoices-records"],
    queryFn: () => {
      try {
        const stored = localStorage.getItem("invoices-records");
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error("Error fetching invoices from localStorage:", error);
        return [];
      }
    },
  });

  const { data: inventory = [] } = useQuery<Inventory[]>({
    queryKey: ["inventory-records"],
    queryFn: () => {
      try {
        const stored = localStorage.getItem("inventory-records");
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error("Error fetching inventory from localStorage:", error);
        return [];
      }
    },
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

  if (projectsLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="space-y-2">
          <div className="skeleton h-8 w-56" />
          <div className="skeleton h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="skeleton h-3 w-24" />
                  <div className="skeleton h-7 w-32" />
                </div>
                <div className="skeleton h-11 w-11 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="skeleton h-72 rounded-xl border border-border"
            />
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
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          padding: 16,
          font: { family: "Inter, system-ui, sans-serif", size: 12 },
        },
      },
      title: { display: false },
      tooltip: {
        backgroundColor: "#16233f",
        titleFont: { family: "Inter, system-ui, sans-serif", weight: 600 },
        bodyFont: { family: "Inter, system-ui, sans-serif" },
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "Inter, system-ui, sans-serif", size: 11 } },
      },
      y: {
        grid: { color: "rgba(148, 163, 184, 0.15)" },
        border: { display: false },
        ticks: { font: { family: "Inter, system-ui, sans-serif", size: 11 } },
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
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  });

  const monthlyExpenses = last4Months.map(month => {
    return transactions
      .filter(
        t =>
          t.type === "expense" &&
          new Date(t.date).toLocaleDateString("en-US", { month: "short" }) ===
            month
      )
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  });

  const financialTrendData = {
    labels: last4Months,
    datasets: [
      {
        label: "Income",
        data: monthlyIncome,
        backgroundColor: "#059669",
        borderRadius: 6,
        maxBarThickness: 36,
      },
      {
        label: "Expenses",
        data: monthlyExpenses,
        backgroundColor: "#dc2626",
        borderRadius: 6,
        maxBarThickness: 36,
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

  // Manpower calculations
  const totalManpower = manpower.length;
  const activeManpower = manpower.filter((m: any) => m.status === "active").length;
  const completedManpower = manpower.filter((m: any) => m.status === "completed").length;
  const terminatedManpower = manpower.filter((m: any) => m.status === "terminated").length;

  // Manpower Status Distribution
  const manpowerStatusData = {
    labels: ["Active", "Completed", "Terminated"],
    datasets: [
      {
        data: [activeManpower, completedManpower, terminatedManpower],
        backgroundColor: [
          "#10B981", // Green for active
          "#3B82F6", // Blue for completed
          "#F59E0B", // Orange for terminated
        ],
        borderWidth: 0,
      },
    ],
  };



  // Calculate totals for display
  const totalRevenue = transactions
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount.toString()), 0);
  const totalExpenses = transactions
    .filter((t: any) => t.type === "expense")
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount.toString()), 0);
  const totalPurchases = purchases.reduce(
    (sum: number, p: any) => sum + parseFloat(p.totalAmount || "0"),
    0
  );
  const pendingInvoicesCount = invoices.filter(
    (inv: any) => inv.status === "sent" || inv.status === "overdue" || inv.status === "draft"
  ).length;
  const inventoryValue = inventory.reduce(
    (sum: number, item: any) =>
      sum +
      (parseFloat(item.quantity?.toString() || "0") || 0) *
        (parseFloat(item.unitPrice?.toString() || "0") || 0),
    0
  );
  const netProfit = totalRevenue - totalExpenses;

  const getStatusVariant = (
    status: string
  ): "success" | "warning" | "danger" | "info" | "neutral" => {
    const normalized = status?.toLowerCase();
    if (normalized === "active") return "success";
    if (normalized === "planning") return "warning";
    if (normalized === "cancelled" || normalized === "on hold") return "danger";
    if (normalized === "completed") return "info";
    return "neutral";
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="page-header !border-0 !pb-0">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description mt-1">
            Company-wide overview of projects, workforce, and financial
            performance
          </p>
        </div>
        <Button variant="primary" onClick={() => setLocation("/projects")}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Projects"
          value={(projects || []).length}
          icon={FolderOpen}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
          hint={`${(projects || []).filter((p: any) => p.status === "completed").length} completed`}
        />
        <StatsCard
          title="Active Projects"
          value={(projects || []).filter((p: any) => p.status === "active").length}
          icon={BarChart3}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBgColor="bg-amber-500/10"
          hint={`${(projects || []).filter((p: any) => p.status === "planning").length} in planning`}
        />
        <StatsCard
          title="Employees"
          value={employees.length}
          icon={Users}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBgColor="bg-blue-500/10"
          hint={`${activeManpower} active manpower`}
        />
        <StatsCard
          title="Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBgColor="bg-emerald-500/10"
          hint="All recorded income"
        />
        <StatsCard
          title="Expenses"
          value={formatCurrency(totalExpenses)}
          icon={AlertTriangle}
          iconColor="text-red-600 dark:text-red-400"
          iconBgColor="bg-red-500/10"
          hint="All recorded expenses"
        />
        <StatsCard
          title="Profit"
          value={formatCurrency(netProfit)}
          icon={TrendingUp}
          iconColor={
            netProfit >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }
          iconBgColor={netProfit >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
          hint="Revenue minus expenses"
        />
        <StatsCard
          title="Pending Invoices"
          value={pendingInvoicesCount}
          icon={FileText}
          iconColor="text-orange-600 dark:text-orange-400"
          iconBgColor="bg-orange-500/10"
          hint={`${invoices.length} invoices total`}
        />
        <StatsCard
          title="Inventory Value"
          value={formatCurrency(inventoryValue)}
          icon={ShoppingCart}
          iconColor="text-violet-600 dark:text-violet-400"
          iconBgColor="bg-violet-500/10"
          hint={`${inventory.length} stock items`}
        />
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
              <Bar data={financialTrendData} options={barChartOptions} />
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
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="mx-auto mb-2 h-12 w-12 text-muted-foreground/40" />
                    <p>No department data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Manpower Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Manpower Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {totalManpower > 0 ? (
                <Doughnut data={manpowerStatusData} options={chartOptions} />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="mx-auto mb-2 h-12 w-12 text-muted-foreground/40" />
                    <p>No manpower data available</p>
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
              variant="primary"
              onClick={() => setLocation("/projects")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Project
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setLocation("/transactions")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Transaction
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setLocation("/manpower")}
            >
              <Users className="h-4 w-4 mr-2" />
              Assign Manpower
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setLocation("/employees")}
            >
              <Plus className="h-4 w-4 mr-2" />
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
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3 transition-colors hover:bg-muted"
                >
                  <div className="min-w-0">
                    <h4 className="truncate font-semibold text-foreground">
                      {project.name}
                    </h4>
                    <p className="text-sm tabular-nums text-muted-foreground">
                      Budget:{" "}
                      {formatCurrency(project.budget || 0)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusVariant(project.status)} className="capitalize">
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
                <div className="py-8 text-center text-muted-foreground">
                  <FolderOpen className="mx-auto mb-2 h-12 w-12 text-muted-foreground/40" />
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
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
              <div className="text-2xl font-bold tabular-nums text-foreground">
                {(projects || []).length}
              </div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-900 dark:bg-emerald-950">
              <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
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
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-center dark:border-violet-900 dark:bg-violet-950">
              <div className="text-2xl font-bold tabular-nums text-violet-600 dark:text-violet-400">
                {formatCurrency(totalPurchases)}
              </div>
              <div className="text-sm text-muted-foreground">Total Purchases</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-900 dark:bg-amber-950">
              <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {suppliers.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Suppliers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
