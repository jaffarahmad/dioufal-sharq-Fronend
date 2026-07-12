import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Download,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Edit,
  Save,
  X,
  CheckCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { Employee } from "@/lib/schema";

interface MonthlyReport {
  id: string;
  month: number;
  year: number;
  totalEmployees: number;
  totalPayments: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  createdAt: string;
}

interface EmployeePaymentSummary {
  employeeId: string;
  employeeName: string;
  totalPayments: number;
  paidPayments: number;
  pendingPayments: number;
  overduePayments: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
}

export default function MonthlyReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: monthlyReport } = useQuery<MonthlyReport>({
    queryKey: ["/api/monthly-reports", selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await fetch(
        `/api/monthly-reports/${selectedMonth}/${selectedYear}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch monthly report");
      }
      return response.json();
    },
  });

  const { data: employeePaymentSummary = [] } = useQuery<
    EmployeePaymentSummary[]
  >({
    queryKey: ["/api/employee-payment-summary", selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await fetch(
        `/api/employee-payment-summary/${selectedMonth}/${selectedYear}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch employee payment summary");
      }
      return response.json();
    },
  });

  // Update employee payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({
      employeeId,
      isPaid,
      amount,
    }: {
      employeeId: string;
      isPaid: boolean;
      amount?: number;
    }) => {
      const response = await fetch("/api/employee-payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          month: selectedMonth,
          year: selectedYear,
          isPaid,
          amount: isPaid ? amount : undefined,
          paidDate: isPaid ? new Date().toISOString() : null,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update payment status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "/api/employee-payment-summary",
          selectedMonth,
          selectedYear,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/monthly-reports", selectedMonth, selectedYear],
      });
      setEditingEmployee(null);
      setEditAmount("");
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment status",
        variant: "destructive",
      });
    },
  });

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const paymentStatusData = monthlyReport
    ? [
        { name: "Paid", value: monthlyReport.paidAmount, color: "#10b981" },
        {
          name: "Pending",
          value: monthlyReport.pendingAmount,
          color: "#f59e0b",
        },
        {
          name: "Overdue",
          value: monthlyReport.overdueAmount,
          color: "#ef4444",
        },
      ]
    : [];

  const handleEditEmployee = (employeeId: string, currentAmount: number) => {
    setEditingEmployee(employeeId);
    setEditAmount(currentAmount.toString());
  };

  const handleSavePaymentStatus = (employeeId: string, isPaid: boolean) => {
    const amount = isPaid ? parseFloat(editAmount) : undefined;
    if (isPaid && (!amount || amount <= 0)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount for paid status",
        variant: "destructive",
      });
      return;
    }
    updatePaymentStatusMutation.mutate({ employeeId, isPaid, amount });
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
    setEditAmount("");
  };

  const exportToCSV = () => {
    if (!employeePaymentSummary.length) return;

    const headers = [
      "Employee Name",
      "Total Payments",
      "Paid Payments",
      "Pending Payments",
      "Overdue Payments",
      "Total Amount (SAR)",
      "Paid Amount (SAR)",
      "Pending Amount (SAR)",
      "Overdue Amount (SAR)",
    ];

    const csvContent = [
      headers.join(","),
      ...employeePaymentSummary.map(emp =>
        [
          emp.employeeName,
          emp.totalPayments,
          emp.paidPayments,
          emp.pendingPayments,
          emp.overduePayments,
          emp.totalAmount,
          emp.paidAmount,
          emp.pendingAmount,
          emp.overdueAmount,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly-report-${monthNames[selectedMonth - 1]}-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Reports</h1>
          <p className="text-muted-foreground">
            Employee payment reports and analytics
          </p>
        </div>
        <Button onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={value => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={value => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {monthlyReport && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {monthlyReport.totalEmployees}
              </div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                SAR {monthlyReport.totalAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Monthly payment total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                SAR {monthlyReport.paidAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {(
                  (monthlyReport.paidAmount / monthlyReport.totalAmount) *
                  100
                ).toFixed(1)}
                % of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Amount
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                SAR {monthlyReport.pendingAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {(
                  (monthlyReport.pendingAmount / monthlyReport.totalAmount) *
                  100
                ).toFixed(1)}
                % of total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Status Chart */}
      {paymentStatusData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Status Distribution</CardTitle>
            <CardDescription>
              {monthNames[selectedMonth - 1]} {selectedYear} payment status
              breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={value => [`SAR ${value}`, "Amount"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Payment Summary</CardTitle>
          <CardDescription>
            Detailed payment breakdown for {monthNames[selectedMonth - 1]}{" "}
            {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employeePaymentSummary.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No data available
              </h3>
              <p className="text-muted-foreground">
                No payment data found for the selected period
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-center">Total Payments</TableHead>
                  <TableHead className="text-center">Paid</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-center">Overdue</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Paid Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeePaymentSummary.map(emp => (
                  <TableRow key={emp.employeeId}>
                    <TableCell className="font-medium">
                      {emp.employeeName}
                    </TableCell>
                    <TableCell className="text-center">
                      {emp.totalPayments}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-green-600 font-medium">
                        {emp.paidPayments}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-orange-600 font-medium">
                        {emp.pendingPayments}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-red-600 font-medium">
                        {emp.overduePayments}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {editingEmployee === emp.employeeId ? (
                        <Input
                          type="number"
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                          className="w-24 text-right"
                          placeholder="Amount"
                        />
                      ) : (
                        `SAR ${emp.totalAmount.toFixed(2)}`
                      )}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      SAR {emp.paidAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span
                        className={
                          emp.pendingAmount + emp.overdueAmount > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        SAR {(emp.pendingAmount + emp.overdueAmount).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {editingEmployee === emp.employeeId ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleSavePaymentStatus(emp.employeeId, true)
                            }
                            disabled={updatePaymentStatusMutation.isPending}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleSavePaymentStatus(emp.employeeId, false)
                            }
                            disabled={updatePaymentStatusMutation.isPending}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            disabled={updatePaymentStatusMutation.isPending}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleEditEmployee(emp.employeeId, emp.totalAmount)
                          }
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
