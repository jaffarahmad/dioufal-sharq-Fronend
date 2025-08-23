import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Download,
  Calendar,
  BarChart3,
} from "lucide-react";
import StatsCard from "@/components/ui/stats-card";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import type { Invoice, Project } from "@/lib/schema";

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  outstandingInvoices: number;
  paidInvoices: number;
}

export default function FinancialReports() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [reportType, setReportType] = useState("summary");

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Calculate financial summary
  const calculateFinancialSummary = (): FinancialSummary => {
    const filteredInvoices = invoices.filter(invoice => {
      if (!dateRange?.from || !dateRange?.to) return true;
      const invoiceDate = new Date(invoice.createdAt);
      return invoiceDate >= dateRange.from && invoiceDate <= dateRange.to;
    });

    const totalRevenue = filteredInvoices
      .filter(inv => inv.status === "paid")
      .reduce((sum, inv) => sum + parseFloat(inv.total?.toString() || "0"), 0);

    const outstandingAmount = filteredInvoices
      .filter(inv => inv.status !== "paid")
      .reduce((sum, inv) => sum + parseFloat(inv.total?.toString() || "0"), 0);

    const totalExpenses = projects.reduce((sum, project) => {
      // Using budget as fallback since actualCost doesn't exist on Project type
      const cost = typeof project.budget === "string" ? parseFloat(project.budget) : Number(project.budget);
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      outstandingInvoices: filteredInvoices.filter(inv => inv.status !== "paid")
        .length,
      paidInvoices: filteredInvoices.filter(inv => inv.status === "paid")
        .length,
    };
  };

  const financialSummary = calculateFinancialSummary();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const exportReport = () => {
    // Implementation for exporting reports
    console.log("Exporting financial report...");
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Financial Reports</h2>
        <div className="flex gap-4">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Financial Summary</SelectItem>
              <SelectItem value="revenue">Revenue Report</SelectItem>
              <SelectItem value="expenses">Expense Report</SelectItem>
              <SelectItem value="profit">Profit & Loss</SelectItem>
            </SelectContent>
          </Select>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          <Button onClick={exportReport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(financialSummary.totalRevenue)}
          icon={DollarSign}
        />
        <StatsCard
          title="Total Expenses"
          value={formatCurrency(financialSummary.totalExpenses)}
          icon={TrendingDown}
        />
        <StatsCard
          title="Net Profit"
          value={formatCurrency(financialSummary.netProfit)}
          icon={TrendingUp}
        />
        <StatsCard
          title="Outstanding Invoices"
          value={financialSummary.outstandingInvoices}
          icon={FileText}
        />
      </div>

      {/* Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Paid Invoices</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {financialSummary.paidInvoices}
                  </Badge>
                  <span className="font-semibold">
                    {formatCurrency(financialSummary.totalRevenue)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Outstanding</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {financialSummary.outstandingInvoices}
                  </Badge>
                  <span className="font-semibold text-orange-600">
                    {formatCurrency(
                      invoices
                        .filter(inv => inv.status !== "paid")
                        .reduce(
                          (sum, inv) =>
                            sum + parseFloat(inv.total?.toString() || "0"),
                          0
                        )
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.slice(0, 5).map(invoice => (
                <div
                  key={invoice.id}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{invoice.clientName}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(invoice.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(
                        parseFloat(invoice.total?.toString() || "0")
                      )}
                    </p>
                    <Badge
                      variant={
                        invoice.status === "paid" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Detailed Financial Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Project</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.slice(0, 10).map(invoice => {
                const project = projects.find(
                  p => p.id.toString() === invoice.projectId?.toString()
                );
                return (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {format(new Date(invoice.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {invoice.clientName}
                    </TableCell>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(
                        parseFloat(invoice.total?.toString() || "0")
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.status === "paid" ? "default" : "secondary"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{project?.name || "N/A"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
