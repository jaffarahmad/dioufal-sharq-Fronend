import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  Download,
  Eye,
  FolderOpen,
  TrendingUp,
  Users,
  FileText,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  Construction,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Mail,
  Shield,
  Trash2,
  RefreshCw,
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
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type {
  Project,
  Transaction,
  Employee,
  Purchase,
} from "@/lib/schema";

// Simple Report interface for the reports functionality
interface Report {
  id: number;
  name: string;
  type: string;
  description: string;
  generatedAt: string;
}

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

// Helper function for professional currency formatting
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M SAR`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K SAR`;
  }
  return `${amount.toLocaleString("en-SA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} SAR`;
};

// Helper function for compact number formatting
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toString();
};

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("3months");
  const [activeTab, setActiveTab] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fix fake data mutation
  const fixFakeDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/fix-fake-data", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fix fake data");
      }
      return response.json();
    },
    onSuccess: data => {
      toast({
        title: "Success",
        description: `Fake data cleaned up successfully! Removed ${(Object.values(data.deletedRecords) as number[]).reduce((a: number, b: number) => a + b, 0)} fake records.`,
      });
      // Refresh all data
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clean up fake data",
        variant: "destructive",
      });
    },
  });

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
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

  // Chart configurations with smaller, professional formatting
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          fontSize: 10,
          padding: 8,
          usePointStyle: true,
          boxWidth: 6,
          boxHeight: 6,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        titleFont: { size: 11 },
        bodyFont: { size: 10 },
        padding: 6,
        callbacks: {
          label: function (context: any) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: { size: 9 },
          color: "#6B7280",
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          font: { size: 9 },
          color: "#6B7280",
          callback: function (value: any) {
            return formatNumber(value);
          },
        },
        grid: {
          color: "#F3F4F6",
          lineWidth: 0.5,
        },
      },
    },
  };

  // Pie chart specific options
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          fontSize: 9,
          padding: 6,
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          generateLabels: function (chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const total = dataset.data.reduce(
                  (sum: number, val: number) => sum + val,
                  0
                );
                const percentage =
                  total > 0 ? ((value / total) * 100).toFixed(0) : "0";
                return {
                  text: `${label}: ${percentage}%`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.backgroundColor[i],
                  lineWidth: 0,
                  pointStyle: "circle",
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        titleFont: { size: 10 },
        bodyFont: { size: 9 },
        padding: 6,
        callbacks: {
          label: function (context: any) {
            const total = context.dataset.data.reduce(
              (sum: number, val: number) => sum + val,
              0
            );
            const percentage =
              total > 0 ? ((context.parsed / total) * 100).toFixed(1) : "0";
            return `${context.label}: ${percentage}%`;
          },
        },
      },
    },
  };

  // Project Status Data
  const projectStatusData = {
    labels: ["Planning", "Active", "Completed", "On Hold"],
    datasets: [
      {
        data: [
          projects.filter(p => p.status === "planning").length,
          projects.filter(p => p.status === "active").length,
          projects.filter(p => p.status === "completed").length,
          projects.filter(p => p.status === "cancelled").length,
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

  // Financial Overview Data (Last 6 months)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  });

  const monthlyIncome = last6Months.map(month => {
    return transactions
      .filter(
        t =>
          t.type === "income" &&
          t.date &&
          new Date(t.date).toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          }) === month
      )
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  });

  const monthlyExpenses = last6Months.map(month => {
    return transactions
      .filter(
        t =>
          t.type === "expense" &&
          t.date &&
          new Date(t.date).toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          }) === month
      )
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  });

  const financialData = {
    labels: last6Months,
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

  // Purchase Categories Data
  const purchaseCategories = purchases.reduce(
    (acc, purchase) => {
      const category = purchase.status || "Unknown";
      acc[category] =
        (acc[category] || 0) + parseFloat(purchase.totalAmount || "0");
      return acc;
    },
    {} as Record<string, number>
  );

  const purchaseCategoryData = {
    labels: Object.keys(purchaseCategories),
    datasets: [
      {
        data: Object.values(purchaseCategories),
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

  // Employee Department Distribution
  const departmentData = employees.reduce(
    (acc, emp) => {
      const dept = "General"; // Department property doesn't exist on Employee type
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

  // Calculate key metrics
  const totalRevenue = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const netProfit = totalRevenue - totalExpenses;
  const activeProjects = projects.filter(
    p => p.status === "active"
  ).length;
  const completedProjects = projects.filter(
    p => p.status === "completed"
  ).length;
  const totalPurchaseValue = purchases.reduce(
    (sum, p) => sum + parseFloat(p.totalAmount || "0"),
    0
  );

  const getReportIcon = (type: string) => {
    switch (type) {
      case "Project":
        return FolderOpen;
      case "Financial":
        return TrendingUp;
      case "Workforce":
        return Users;
      default:
        return FileText;
    }
  };

  const getReportColor = (type: string) => {
    switch (type) {
      case "Project":
        return "bg-gray-50 text-gray-700 hover:bg-gray-100";
      case "Financial":
        return "bg-green-50 text-green-700 hover:bg-green-100";
      case "Workforce":
        return "bg-orange-50 text-orange-700 hover:bg-orange-100";
      default:
        return "bg-gray-50 text-gray-700 hover:bg-gray-100";
    }
  };

  const handleExportReport = async () => {
    setIsExporting(true);

    try {
      // Create a new PDF document
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Add company header
      pdf.setFontSize(20);
      pdf.setTextColor(40, 40, 40);
      pdf.text("DIOUF AL-SHARQ GENERAL CONTRACTING", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 10;

      pdf.setFontSize(16);
      pdf.text("Business Analytics Report", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 15;

      // Add manager/user information
      if (user) {
        pdf.setFontSize(12);
        pdf.setTextColor(60, 60, 60);
        pdf.text("REPORT PREPARED BY:", 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.text(`Name: ${user.firstName} ${user.lastName}`, 20, yPosition);
        pdf.text(`Role: ${user.role || "Manager"}`, 20, yPosition + 5);
        pdf.text(`Email: ${user.email}`, 20, yPosition + 10);
        pdf.text(`Username: ${user.username}`, 20, yPosition + 15);
        yPosition += 25;
      }

      // Add report date and period
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      const reportDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      pdf.text(`Generated on: ${reportDate}`, 20, yPosition);
      pdf.text(`Report Period: ${selectedPeriod}`, 20, yPosition + 5);
      yPosition += 20;

      // Add key metrics section
      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text("KEY PERFORMANCE METRICS", 20, yPosition);
      yPosition += 10;

      // Add metrics in a table format
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);

      // Financial metrics box
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(20, yPosition, 170, 35);
      pdf.setFontSize(12);
      pdf.setTextColor(40, 40, 40);
      pdf.text("FINANCIAL OVERVIEW", 25, yPosition + 8);

      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      pdf.text(
        `Total Revenue: ${totalRevenue.toLocaleString("en-US", { style: "currency", currency: "SAR" })}`,
        25,
        yPosition + 15
      );
      pdf.text(
        `Total Expenses: ${totalExpenses.toLocaleString("en-US", { style: "currency", currency: "SAR" })}`,
        25,
        yPosition + 22
      );
      pdf.text(
        `Net Profit: ${netProfit.toLocaleString("en-US", { style: "currency", currency: "SAR" })}`,
        25,
        yPosition + 29
      );
      yPosition += 45;

      // Project metrics box
      pdf.rect(20, yPosition, 85, 35);
      pdf.setFontSize(12);
      pdf.setTextColor(40, 40, 40);
      pdf.text("PROJECTS", 25, yPosition + 8);

      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`Total: ${projects.length}`, 25, yPosition + 15);
      pdf.text(`Active: ${activeProjects}`, 25, yPosition + 22);
      pdf.text(`Completed: ${completedProjects}`, 25, yPosition + 29);

      // Workforce metrics box
      pdf.rect(105, yPosition, 85, 35);
      pdf.setFontSize(12);
      pdf.setTextColor(40, 40, 40);
      pdf.text("WORKFORCE", 110, yPosition + 8);

      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`Total Employees: ${employees.length}`, 110, yPosition + 15);
      pdf.text(
        `Active: ${employees.length}`,
        110,
        yPosition + 22
      );
      pdf.text(
        `Departments: ${Object.keys(departmentData).length}`,
        110,
        yPosition + 29
      );
      yPosition += 50;

      // Add financial summary table
      pdf.setFontSize(12);
      pdf.setTextColor(40, 40, 40);
      pdf.text("FINANCIAL SUMMARY (Last 6 Months)", 20, yPosition);
      yPosition += 10;

      // Table with borders
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(245, 245, 245);

      // Header row
      pdf.rect(20, yPosition, 40, 8, "FD");
      pdf.rect(60, yPosition, 40, 8, "FD");
      pdf.rect(100, yPosition, 40, 8, "FD");
      pdf.rect(140, yPosition, 40, 8, "FD");

      pdf.setFontSize(9);
      pdf.setTextColor(40, 40, 40);
      pdf.text("Month", 22, yPosition + 5);
      pdf.text("Income", 62, yPosition + 5);
      pdf.text("Expenses", 102, yPosition + 5);
      pdf.text("Net Profit", 142, yPosition + 5);
      yPosition += 8;

      // Data rows
      pdf.setTextColor(60, 60, 60);
      last6Months.forEach((month, index) => {
        const income = monthlyIncome[index];
        const expenses = monthlyExpenses[index];
        const net = income - expenses;

        pdf.rect(20, yPosition, 40, 6, "S");
        pdf.rect(60, yPosition, 40, 6, "S");
        pdf.rect(100, yPosition, 40, 6, "S");
        pdf.rect(140, yPosition, 40, 6, "S");

        pdf.text(month, 22, yPosition + 4);
        pdf.text(`${(income / 1000).toFixed(0)}K`, 62, yPosition + 4);
        pdf.text(`${(expenses / 1000).toFixed(0)}K`, 102, yPosition + 4);
        pdf.text(`${(net / 1000).toFixed(0)}K`, 142, yPosition + 4);
        yPosition += 6;
      });

      yPosition += 15;

      // Add new page for detailed breakdown
      pdf.addPage();
      yPosition = 20;

      // Project status breakdown
      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text("PROJECT STATUS BREAKDOWN", 20, yPosition);
      yPosition += 15;

      const statusCounts = {
        Planning: projects.filter(p => p.status === "planning").length,
        Active: projects.filter(p => p.status === "active").length,
        Completed: projects.filter(p => p.status === "completed").length,
        "On Hold": projects.filter(p => p.status === "cancelled").length,
      };

      // Create visual bars for project status
      pdf.setFontSize(10);
      Object.entries(statusCounts).forEach(([status, count], index) => {
        const barWidth = Math.max(count * 20, 5); // Minimum 5mm width
        const colors = [
          [59, 130, 246], // Blue
          [245, 158, 11], // Amber
          [16, 185, 129], // Emerald
          [239, 68, 68], // Red
        ];

        const color = colors[index];
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(20, yPosition, barWidth, 8, "F");
        pdf.setTextColor(60, 60, 60);
        pdf.text(`${status}: ${count} projects`, 25 + barWidth, yPosition + 5);
        yPosition += 15;
      });

      yPosition += 15;

      // Add department breakdown if available
      if (Object.keys(departmentData).length > 0) {
        pdf.setFontSize(14);
        pdf.setTextColor(40, 40, 40);
        pdf.text("WORKFORCE DISTRIBUTION", 20, yPosition);
        yPosition += 15;

        pdf.setFontSize(10);
        Object.entries(departmentData).forEach(([dept, count], index) => {
          const barWidth = Math.max(count * 15, 5);
          const colors = [
            [59, 130, 246], // Blue
            [139, 92, 246], // Purple
            [16, 185, 129], // Emerald
            [245, 158, 11], // Amber
            [239, 68, 68], // Red
            [6, 182, 212], // Cyan
          ];

          const color = colors[index % colors.length];
          pdf.setFillColor(color[0], color[1], color[2]);
          pdf.rect(20, yPosition, barWidth, 8, "F");
          pdf.setTextColor(60, 60, 60);
          pdf.text(`${dept}: ${count} employees`, 25 + barWidth, yPosition + 5);
          yPosition += 15;
        });
      }

      // Add recommendations section
      yPosition += 20;
      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text("KEY INSIGHTS & RECOMMENDATIONS", 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);

      // Generate insights based on data
      const insights = [];

      if (netProfit > 0) {
        insights.push("✓ Company is showing positive profitability");
      } else {
        insights.push(
          "⚠ Consider reviewing expenses to improve profitability"
        );
      }

      if (activeProjects > 0) {
        insights.push(
          `✓ ${activeProjects} active projects maintaining business momentum`
        );
      }

      const completionRate =
        projects.length > 0 ? (completedProjects / projects.length) * 100 : 0;
      if (completionRate >= 70) {
        insights.push(
          "✓ Strong project completion rate indicates good project management"
        );
      } else if (completionRate > 0) {
        insights.push("⚠ Consider improving project completion processes");
      }

      if (employees.length > 0) {
        const activeEmployeeRate =
          (employees.length /
            employees.length) *
          100;
        if (activeEmployeeRate >= 90) {
          insights.push("✓ High employee retention rate");
        }
      }

      insights.forEach(insight => {
        pdf.text(`• ${insight}`, 25, yPosition);
        yPosition += 8;
      });

      // Add footer to both pages
      [1, 2].forEach(pageNum => {
        pdf.setPage(pageNum);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          "This report was generated automatically by the Construction Management System",
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
        pdf.text(`Page ${pageNum} of 2`, pageWidth - 20, pageHeight - 10, {
          align: "right",
        });
      });

      // Save the PDF
      const fileName = `Analytics_Report_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);

      console.log("Report exported successfully as:", fileName);
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Error generating report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Comprehensive business insights and performance metrics
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => fixFakeDataMutation.mutate()}
            disabled={fixFakeDataMutation.isPending}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 w-full sm:w-auto"
          >
            {fixFakeDataMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Fix Fake Data
          </Button>
          <Button
            onClick={handleExportReport}
            disabled={isExporting}
            className="bg-gray-600 hover:bg-gray-700 w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Generating..." : "Export Report"}
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="h-full">
          <CardContent className="p-3 sm:p-4 h-full">
            <div className="flex items-center justify-between h-full">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Total Revenue
                </p>
                <p className="text-sm sm:text-lg font-bold text-green-600 break-words">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-full flex-shrink-0 ml-2">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="p-3 sm:p-4 h-full">
            <div className="flex items-center justify-between h-full">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Net Profit
                </p>
                <p
                  className={`text-sm sm:text-lg font-bold break-words ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(netProfit)}
                </p>
              </div>
              <div
                className={`p-2 rounded-full flex-shrink-0 ml-2 ${netProfit >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}
              >
                <TrendingUp
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="p-3 sm:p-4 h-full">
            <div className="flex items-center justify-between h-full">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Active Projects
                </p>
                <p className="text-sm sm:text-lg font-bold text-blue-600">
                  {activeProjects}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/20 p-2 rounded-full flex-shrink-0 ml-2">
                <Construction className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent className="p-3 sm:p-4 h-full">
            <div className="flex items-center justify-between h-full">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Completed Projects
                </p>
                <p className="text-sm sm:text-lg font-bold text-emerald-600">
                  {completedProjects}
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-full flex-shrink-0 ml-2">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="workforce">Workforce</TabsTrigger>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Financial Overview (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64">
                  <Bar data={financialData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Project Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64">
                  <Doughnut
                    data={projectStatusData}
                    options={pieChartOptions}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses Trend</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64">
                  <Line data={financialData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders by Status</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64">
                  <Pie data={purchaseCategoryData} options={pieChartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Total Income</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Total Expenses</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(totalExpenses)}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Purchase Orders</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(totalPurchaseValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64">
                  <Bar data={projectStatusData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Total Projects</span>
                    <Badge variant="secondary" className="text-xs">
                      {projects.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Completed</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {completedProjects}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-amber-50 rounded-lg">
                    <span className="text-sm font-medium">Active</span>
                    <Badge className="bg-amber-100 text-amber-800 text-xs">
                      {activeProjects}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Success Rate</span>
                    <Badge variant="outline" className="text-xs">
                      {projects.length > 0
                        ? Math.round(
                            (completedProjects / projects.length) * 100
                          )
                        : 0}
                      %
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workforce" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Distribution by Department</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64">
                  <Doughnut data={employeeDeptData} options={pieChartOptions} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workforce Statistics</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Total Employees</span>
                    <Badge variant="secondary" className="text-xs">
                      {employees.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Active</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {employees.length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Departments</span>
                    <Badge variant="outline" className="text-xs">
                      {Object.keys(departmentData).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Manager Profile Information
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This information will be included in exported reports
              </p>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Full Name
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Mail className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Email Address
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <Shield className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Role
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {user.role || "Manager"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <User className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Username
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {user.username}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 mt-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Export Information
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        When you export reports, this personal information will
                        be included to identify the report author. This helps
                        maintain accountability and provides contact information
                        for stakeholders who may have questions about the report
                        content.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No user information available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generated Reports Section */}
      {reports && reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map(report => {
                const IconComponent = getReportIcon(report.type);
                return (
                  <div
                    key={report.id}
                    className={`p-4 rounded-lg border ${getReportColor(report.type)}`}
                  >
                    <div className="flex items-center mb-3">
                      <IconComponent className="h-6 w-6 mr-2" />
                      <div>
                        <h3 className="font-medium">{report.name}</h3>
                        <p className="text-sm opacity-75">{report.type}</p>
                      </div>
                    </div>
                    <p className="text-sm mb-3 opacity-90">
                      {report.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs opacity-75">
                        {report.generatedAt
                          ? new Date(report.generatedAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
