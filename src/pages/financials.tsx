import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import StatsCard from "@/components/ui/stats-card";
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
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Clock,
  Plus,
  FileText,
  BarChart3,
  PieChart,
} from "lucide-react";
import type { Transaction, Project } from "@/lib/schema";

interface DashboardStats {
  financial: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    pendingInvoices: number;
  };
}

export default function Financials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<
    Transaction[]
  >({
    queryKey: ["/api/transactions"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      Paid: "bg-green-100 text-green-800",
      Received: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Overdue: "bg-red-100 text-red-800",
    };
    return (
      statusMap[status as keyof typeof statusMap] || "bg-gray-100 text-gray-800"
    );
  };

  const getProjectName = (projectId: number | null) => {
    if (!projectId) return "General";
    const project = projects?.find(p => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  const getAmountColor = (amount: string, type: string) => {
    const numAmount = parseFloat(amount);
    if (type === "Income" || numAmount > 0) {
      return "text-green-600 font-medium";
    }
    return "text-red-600 font-medium";
  };

  const formatAmountDisplay = (amount: string, type: string) => {
    const numAmount = parseFloat(amount);
    const absAmount = Math.abs(numAmount);
    return type === "Income" || numAmount > 0
      ? `+${formatCurrency(absAmount)}`
      : `-${formatCurrency(absAmount)}`;
  };

  if (statsLoading || transactionsLoading) {
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

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Financial Management
        </h2>
        <div className="flex space-x-3">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats?.financial.totalRevenue || 0)}
          icon={DollarSign}
          trend={{ value: "15% from last month", isPositive: true }}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <StatsCard
          title="Total Expenses"
          value={formatCurrency(stats?.financial.totalExpenses || 0)}
          icon={CreditCard}
          trend={{ value: "8% from last month", isPositive: false }}
          iconColor="text-red-600"
          iconBgColor="bg-red-50"
        />
        <StatsCard
          title="Net Profit"
          value={formatCurrency(stats?.financial.netProfit || 0)}
          icon={TrendingUp}
          trend={{ value: "25% from last month", isPositive: true }}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <StatsCard
          title="Pending Invoices"
          value={stats?.financial.pendingInvoices || 0}
          icon={Clock}
          trend={{ value: "2 from last week", isPositive: false }}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-50"
        />
      </div>

      {/* Financial Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Revenue vs Expenses Chart</p>
                <p className="text-sm text-gray-400">
                  Chart integration coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Budget Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Budget Allocation Chart</p>
                <p className="text-sm text-gray-400">
                  Chart integration coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Transactions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Transactions</CardTitle>
            <div className="text-sm text-gray-500">
              Total: {transactions?.length || 0} transactions
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.date
                        ? new Date(transaction.date).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="text-gray-500">
                      {getProjectName(transaction.projectId)}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {transaction.category}
                    </TableCell>
                    <TableCell
                      className={getAmountColor(
                        transaction.amount,
                        transaction.type
                      )}
                    >
                      {formatAmountDisplay(
                        transaction.amount,
                        transaction.type
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {transactions?.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No transactions found</div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
