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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Download,
  Users,
  Filter,
  Plus,
  UserPlus,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
  FileDown,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PaymentRecord {
  id: string;
  iqamaNo: string;
  name: string;
  companyNo: string;
  phone: string;
  month: string;
  amount: number;
  status: "paid" | "not_paid";
  createdAt: string;
  updatedAt: string;
}

export default function MonthlyPaymentsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">(
    "all"
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [newPaymentData, setNewPaymentData] = useState({
    iqamaNo: "",
    name: "",
    companyNo: "",
    phone: "",
    amount: "",
    status: "not_paid",
  });
  const [showImportDialog, setShowImportDialog] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payments for selected month/year
  const {
    data: payments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["payments-records", selectedMonth, selectedYear],
    queryFn: async () => {
      try {
        const allPayments = JSON.parse(localStorage.getItem("payments-records") || "[]");
        const monthStr = `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}`;
        return allPayments.filter((payment: PaymentRecord) => payment.month === monthStr);
      } catch (error) {
        console.error("Error fetching payments from localStorage:", error);
        return [];
      }
    },
  });

  // Add new payment mutation
  const addPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      console.log("Adding payment:", paymentData);
      const existingPayments = JSON.parse(localStorage.getItem("payments-records") || "[]");
      const newPayment = {
        ...paymentData,
        id: Date.now().toString(),
        month: `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedPayments = [...existingPayments, newPayment];
      localStorage.setItem("payments-records", JSON.stringify(updatedPayments));
      console.log("Payment added successfully:", newPayment);
      return newPayment;
    },
    onSuccess: () => {
      console.log("Payment creation successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["payments-records"] });
      setShowAddForm(false);
      setNewPaymentData({
        iqamaNo: "",
        name: "",
        companyNo: "",
        phone: "",
        amount: "",
        status: "not_paid",
      });
      toast({
        title: "Success",
        description: "Payment record added successfully",
      });
    },
    onError: (error: any) => {
      console.error("Payment creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add payment record",
        variant: "destructive",
      });
    },
  });

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      console.log("Updating payment:", id, data);
      const existingPayments = JSON.parse(localStorage.getItem("payments-records") || "[]");
      const updatedPayments = existingPayments.map((payment: PaymentRecord) =>
        payment.id === id
          ? { ...payment, ...data, updatedAt: new Date().toISOString() }
          : payment
      );
      localStorage.setItem("payments-records", JSON.stringify(updatedPayments));
      console.log("Payment updated successfully:", data);
      return data;
    },
    onSuccess: () => {
      console.log("Payment update successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["payments-records"] });
      setEditingPayment(null);
      setEditFormData({});
      toast({
        title: "Success",
        description: "Payment record updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Payment update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update payment record",
        variant: "destructive",
      });
    },
  });

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting payment:", id);
      const existingPayments = JSON.parse(localStorage.getItem("payments-records") || "[]");
      const updatedPayments = existingPayments.filter((payment: PaymentRecord) => payment.id !== id);
      localStorage.setItem("payments-records", JSON.stringify(updatedPayments));
      console.log("Payment deleted successfully");
    },
    onSuccess: () => {
      console.log("Payment deletion successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["payments-records"] });
      toast({
        title: "Success",
        description: "Payment record deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Payment deletion error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete payment record",
        variant: "destructive",
      });
    },
  });

  // Generate monthly payments mutation
  const generatePaymentsMutation = useMutation({
    mutationFn: async (month: string) => {
      console.log("Generating payments for month:", month);
      // Simulate payment generation from localStorage employees data
      const employees = JSON.parse(localStorage.getItem("employees-records") || "[]");
      const existingPayments = JSON.parse(localStorage.getItem("payments-records") || "[]");
      
      let created = 0;
      let skipped = 0;
      const newPayments = [];
      
      for (const employee of employees) {
        const existingPayment = existingPayments.find((p: PaymentRecord) => 
          p.iqamaNo === employee.id?.toString() && p.month === month
        );
        
        if (!existingPayment) {
          const newPayment = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            iqamaNo: employee.id?.toString() || "",
            name: employee.name || "",
            companyNo: "",
            phone: employee.phone || "",
            month: month,
            amount: employee.salary || 0,
            status: "not_paid" as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          newPayments.push(newPayment);
          created++;
        } else {
          skipped++;
        }
      }
      
      if (newPayments.length > 0) {
        const updatedPayments = [...existingPayments, ...newPayments];
        localStorage.setItem("payments-records", JSON.stringify(updatedPayments));
      }
      
      return { created, skipped, errors: [] };
    },
    onSuccess: data => {
      console.log("Payment generation successful:", data);
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "Success",
        description: `Generated ${data.created} payment records. ${data.skipped} already existed.`,
      });
      if (data.errors && data.errors.length > 0) {
        console.warn("Generation errors:", data.errors);
        toast({
          title: "Warning",
          description: `Some payments had errors: ${data.errors.length} issues`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Payment generation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate payment records",
        variant: "destructive",
      });
    },
  });

  // Filter payments based on status
  const filteredPayments = (payments || []).filter((payment: any) => {
    if (paymentFilter === "paid") return payment.status === "paid";
    if (paymentFilter === "unpaid") return payment.status === "not_paid";
    return true;
  });

  // Handle form submissions
  const handleAddPayment = () => {
    console.log("Form submission started:", newPaymentData);

    // Validation
    if (
      !newPaymentData.iqamaNo ||
      !newPaymentData.name ||
      !newPaymentData.amount
    ) {
      console.log("Validation failed: Missing required fields");
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields (Iqama No, Name, Amount)",
        variant: "destructive",
      });
      return;
    }

    const paymentData = {
      iqamaNo: newPaymentData.iqamaNo,
      name: newPaymentData.name,
      companyNo: newPaymentData.companyNo,
      phone: newPaymentData.phone,
      amount: parseFloat(newPaymentData.amount),
      status: newPaymentData.status,
    };

    console.log("Prepared payment data:", paymentData);
    addPaymentMutation.mutate(paymentData);
  };

  const handleUpdatePayment = (id: string) => {
    console.log("Update payment started:", id, editFormData);

    const updateData = {
      iqamaNo: editFormData.iqamaNo,
      name: editFormData.name,
      companyNo: editFormData.companyNo,
      phone: editFormData.phone,
      amount: parseFloat(editFormData.amount),
      status: editFormData.status,
    };

    console.log("Prepared update data:", updateData);
    updatePaymentMutation.mutate({ id, data: updateData });
  };

  const handleDeletePayment = (id: string) => {
    if (confirm("Are you sure you want to delete this payment record?")) {
      console.log("Delete payment confirmed:", id);
      deletePaymentMutation.mutate(id);
    }
  };

  const handleEditPayment = (payment: PaymentRecord) => {
    setEditingPayment(payment.id);
    setEditFormData({
      iqamaNo: payment.iqamaNo,
      name: payment.name,
      companyNo: payment.companyNo,
      phone: payment.phone,
      amount: payment.amount.toString(),
      status: payment.status,
    });
  };

  const handleNewPaymentInputChange = (field: string, value: string) => {
    setNewPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleGeneratePayments = () => {
    const currentMonth = `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}`;
    if (
      confirm(
        `Generate payment records for ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })} based on previous month's data?`
      )
    ) {
      generatePaymentsMutation.mutate(currentMonth);
    }
  };

  // Calculate statistics
  const totalPayments = filteredPayments.length;
  const paidPayments = filteredPayments.filter((p: any) => p.status === "paid").length;
  const unpaidPayments = filteredPayments.filter(
    (p: any) => p.status === "not_paid"
  ).length;
  const totalAmount = filteredPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const paidAmount = filteredPayments
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + p.amount, 0);
  const unpaidAmount = filteredPayments
    .filter((p: any) => p.status === "not_paid")
    .reduce((sum: number, p: any) => sum + p.amount, 0);

  // CSV Export Function
  const exportToCSV = () => {
    const csvHeaders = [
      "Iqama No",
      "Name",
      "Company No",
      "Phone",
      "Amount (SAR)",
      "Status",
      "Created Date",
    ];
    const csvData = filteredPayments.map((payment: any) => [
      payment.iqamaNo,
      payment.name,
      payment.companyNo,
      payment.phone,
      payment.amount.toString(),
      payment.status === "paid" ? "Paid" : "Not Paid",
      new Date(payment.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map((row: any[]) => row.map((field: any) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `monthly-payments-${selectedYear}-${selectedMonth.toString().padStart(2, "0")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Payment data exported to CSV successfully",
    });
  };

  // CSV Import Function
  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());

      // Validate headers
      const expectedHeaders = [
        "Iqama No",
        "Name",
        "Company No",
        "Phone",
        "Amount (SAR)",
        "Status",
      ];
      const hasValidHeaders = expectedHeaders.every(header =>
        headers.some(h =>
          h.toLowerCase().includes(header.toLowerCase().replace(" (SAR)", ""))
        )
      );

      if (!hasValidHeaders) {
        toast({
          title: "Error",
          description:
            "Invalid CSV format. Please ensure headers match: Iqama No, Name, Company No, Phone, Amount (SAR), Status",
          variant: "destructive",
        });
        return;
      }

      const importedPayments = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(",").map(v => v.replace(/"/g, "").trim());
        if (values.length >= 6) {
          const payment = {
            iqamaNo: values[0],
            name: values[1],
            companyNo: values[2],
            phone: values[3],
            amount: parseFloat(values[4]) || 0,
            status: values[5].toLowerCase().includes("paid")
              ? "paid"
              : "not_paid",
          };
          importedPayments.push(payment);
        }
      }

      // Import each payment
      importedPayments.forEach(payment => {
        addPaymentMutation.mutate(payment);
      });

      setShowImportDialog(false);
      toast({
        title: "Success",
        description: `Imported ${importedPayments.length} payment records successfully`,
      });
    };

    reader.readAsText(file);
    event.target.value = ""; // Reset file input
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>
                Error loading payments:{" "}
                {(error as any)?.message || "Unknown error"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Monthly Employee Payment Tracking
          </h1>
          <p className="text-muted-foreground">
            Manage and track employee payments for{" "}
            {new Date(selectedYear, selectedMonth - 1).toLocaleDateString(
              "en-US",
              { month: "long", year: "numeric" }
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleGeneratePayments}
            variant="outline"
            className="flex items-center gap-2"
            disabled={generatePaymentsMutation.isPending}
          >
            <RefreshCw
              className={`h-4 w-4 ${generatePaymentsMutation.isPending ? "animate-spin" : ""}`}
            />
            {generatePaymentsMutation.isPending
              ? "Generating..."
              : "Generate from Previous Month"}
          </Button>
          <Button
            onClick={() => exportToCSV()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => setShowImportDialog(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Payment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={value => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2024, i).toLocaleDateString("en-US", {
                        month: "long",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={value => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Payment Status</Label>
              <Select
                value={paymentFilter}
                onValueChange={(value: "all" | "paid" | "unpaid") =>
                  setPaymentFilter(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid Only</SelectItem>
                  <SelectItem value="unpaid">Unpaid Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
            <p className="text-xs text-muted-foreground">Payment records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {paidPayments}
            </div>
            <p className="text-xs text-muted-foreground">
              SAR {paidAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {unpaidPayments}
            </div>
            <p className="text-xs text-muted-foreground">
              SAR {unpaidAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              SAR {totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Payment Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iqamaNo">Iqama No *</Label>
                <Input
                  id="iqamaNo"
                  value={newPaymentData.iqamaNo}
                  onChange={e =>
                    handleNewPaymentInputChange("iqamaNo", e.target.value)
                  }
                  placeholder="Enter Iqama number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newPaymentData.name}
                  onChange={e =>
                    handleNewPaymentInputChange("name", e.target.value)
                  }
                  placeholder="Enter employee name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyNo">Company No</Label>
                <Input
                  id="companyNo"
                  value={newPaymentData.companyNo}
                  onChange={e =>
                    handleNewPaymentInputChange("companyNo", e.target.value)
                  }
                  placeholder="Enter company number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newPaymentData.phone}
                  onChange={e =>
                    handleNewPaymentInputChange("phone", e.target.value)
                  }
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newPaymentData.amount}
                  onChange={e =>
                    handleNewPaymentInputChange("amount", e.target.value)
                  }
                  placeholder="Enter amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newPaymentData.status}
                  onValueChange={value =>
                    handleNewPaymentInputChange("status", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="not_paid">Not Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleAddPayment}
                disabled={addPaymentMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {addPaymentMutation.isPending ? "Adding..." : "Add Payment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading payments..."
              : `Showing ${filteredPayments.length} payment records`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No payment records found for the selected criteria.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Iqama No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company No</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {editingPayment === payment.id ? (
                        <Input
                          value={editFormData.iqamaNo}
                          onChange={e =>
                            handleEditInputChange("iqamaNo", e.target.value)
                          }
                          className="w-full"
                        />
                      ) : (
                        payment.iqamaNo
                      )}
                    </TableCell>
                    <TableCell>
                      {editingPayment === payment.id ? (
                        <Input
                          value={editFormData.name}
                          onChange={e =>
                            handleEditInputChange("name", e.target.value)
                          }
                          className="w-full"
                        />
                      ) : (
                        payment.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingPayment === payment.id ? (
                        <Input
                          value={editFormData.companyNo}
                          onChange={e =>
                            handleEditInputChange("companyNo", e.target.value)
                          }
                          className="w-full"
                        />
                      ) : (
                        payment.companyNo
                      )}
                    </TableCell>
                    <TableCell>
                      {editingPayment === payment.id ? (
                        <Input
                          value={editFormData.phone}
                          onChange={e =>
                            handleEditInputChange("phone", e.target.value)
                          }
                          className="w-full"
                        />
                      ) : (
                        payment.phone
                      )}
                    </TableCell>
                    <TableCell>
                      {editingPayment === payment.id ? (
                        <Input
                          type="number"
                          value={editFormData.amount}
                          onChange={e =>
                            handleEditInputChange("amount", e.target.value)
                          }
                          className="w-full"
                        />
                      ) : (
                        `SAR ${payment.amount.toLocaleString()}`
                      )}
                    </TableCell>
                    <TableCell>
                      {editingPayment === payment.id ? (
                        <Select
                          value={editFormData.status}
                          onValueChange={value =>
                            handleEditInputChange("status", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="not_paid">Not Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          variant={
                            payment.status === "paid" ? "default" : "secondary"
                          }
                          className="flex items-center gap-1"
                        >
                          {payment.status === "paid" ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {payment.status === "paid" ? "Paid" : "Not Paid"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingPayment === payment.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdatePayment(payment.id)}
                              disabled={updatePaymentMutation.isPending}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingPayment(null);
                                setEditFormData({});
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPayment(payment)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeletePayment(payment.id)}
                              disabled={deletePaymentMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CSV Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Payment Data from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with payment data. The file should contain
              columns: Iqama No, Name, Company No, Phone, Amount (SAR), Status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                className="cursor-pointer"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>CSV Format Example:</strong>
              </p>
              <p>Iqama No,Name,Company No,Phone,Amount (SAR),Status</p>
              <p>1234567890,John Doe,EMP001,+966501234567,5000,Paid</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
