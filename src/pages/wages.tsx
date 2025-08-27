import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import WageForm from "@/components/forms/wage-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Wage, Employee } from "@/lib/schema";

export default function WagesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWage, setSelectedWage] = useState<Wage | undefined>();

  const { data: wagesData = [], isLoading: wagesLoading, error } = useQuery<Wage[]>({
    queryKey: ["/api/wages"],
    queryFn: async (): Promise<Wage[]> => {
      const response = await apiRequest("/api/wages");
      if (!response.ok) {
        throw new Error("Failed to fetch wages");
      }
      return response.json();
    },
  });

  // Handle success and error states
  if (wagesData && wagesData.length > 0) {
    console.log("Frontend: Received wages data:", wagesData.length, "records");
    console.log("Frontend: Sample wage record:", wagesData[0] || "No records found");
  }
  if (error) {
    console.error("Frontend: Failed to fetch wages:", error);
  }

  const wages: Wage[] = wagesData as Wage[];

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const createWageMutation = useMutation({
    mutationFn: (data: any) => {
      console.log("Frontend: Sending wage creation request:", data);
      return apiRequest("/api/wages", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (response) => {
      console.log("Frontend: Wage creation successful:", response);
      queryClient.invalidateQueries({ queryKey: ["/api/wages"] });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      console.error("Frontend: Wage creation failed:", error);
    },
  });

  const updateWageStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      paidDate,
    }: {
      id: number;
      status: string;
      paidDate?: string;
    }) =>
      apiRequest(`/api/wages/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status, paidDate }),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wages"] });
    },
  });

  const deleteWageMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/wages/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wages"] });
    },
  });

  const updateWageMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/wages/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wages"] });
      setIsEditDialogOpen(false);
      setSelectedWage(undefined);
    },
    onError: (error) => {
      console.error("Frontend: Wage update failed:", error);
    },
  });

  const handleCreateWage = (data: any) => {
    createWageMutation.mutate(data);
  };

  const handleEditWage = (wage: Wage) => {
    setSelectedWage(wage);
    setIsEditDialogOpen(true);
  };

  const handleDeleteWage = (wage: Wage) => {
    if (window.confirm(`Are you sure you want to delete the wage entry for ${getEmployeeName(wage.employeeId)}?`)) {
      deleteWageMutation.mutate(wage.id);
    }
  };

  const handleMarkAsPaid = (wage: Wage) => {
    updateWageStatusMutation.mutate({
        id: wage.id,
        status: "paid",
        paidDate: new Date().toISOString(),
      });
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.name || `Employee ${employeeId}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const totalPendingWages = 0; // Status not available in Wage interface

  const totalPaidWages = wages
    .reduce((sum, wage) => sum + (wage.amount + wage.overtime + wage.bonuses - wage.deductions), 0);

  if (wagesLoading) {
    return (
      <div className="p-6">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Wages Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage employee wages and payroll
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gray-600 hover:bg-gray-700 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Wage Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl mx-4 sm:mx-0 max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Create Wage Entry</DialogTitle>
              <DialogDescription>
                Record employee wage information and payroll details
              </DialogDescription>
            </DialogHeader>
            <WageForm
              employees={employees}
              onSubmit={handleCreateWage}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createWageMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl mx-4 sm:mx-0 max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Edit Wage Entry</DialogTitle>
              <DialogDescription>
                Update employee wage information and payroll details
              </DialogDescription>
            </DialogHeader>
            <WageForm
               employees={employees}
               initialData={selectedWage}
               onSubmit={(data) => {
                 if (selectedWage) {
                   updateWageMutation.mutate({ id: selectedWage.id, data });
                 }
               }}
               onCancel={() => {
                 setIsEditDialogOpen(false);
                 setSelectedWage(undefined);
               }}
               isLoading={updateWageMutation.isPending}
             />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {totalPendingWages.toLocaleString("en-US", {
                style: "currency",
                currency: "SAR",
              })}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              0 entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalPaidWages.toLocaleString("en-US", {
                style: "currency",
                currency: "SAR",
              })}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {wages.length} entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wages</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalPendingWages + totalPaidWages).toLocaleString("en-US", {
                style: "currency",
                currency: "SAR",
              })}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {wages.length} total entries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wages List */}
      <Card>
        <CardHeader>
          <CardTitle>Wage Entries</CardTitle>
          <CardDescription>
            All wage calculations and payment records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {wages.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No wage entries found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Create your first wage entry to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {wages.map(wage => (
                <div
                  key={wage.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {getEmployeeName(wage.employeeId)}
                        </span>
                        <Badge className="bg-green-100 text-green-800">
                          Paid
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Period:
                          </span>
                          <p className="font-medium">{wage.period}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Period:
                          </span>
                          <p className="font-medium">
                            {wage.period}
                            {wage.notes && wage.notes.includes('Start:') && wage.notes.includes('End:') && (
                              <span className="text-sm text-gray-500 block">
                                {wage.notes.split(', Start: ')[1]?.split(', End:')[0]} - {wage.notes.split(', End: ')[1]}
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Base Amount:
                          </span>
                          <p className="font-medium">
                            {wage.amount.toLocaleString(
                              "en-US",
                              { style: "currency", currency: "SAR" }
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Total Amount:
                          </span>
                          <p className="font-medium text-green-600">
                            {(wage.amount + wage.overtime + wage.bonuses - wage.deductions).toLocaleString(
                              "en-US",
                              { style: "currency", currency: "SAR" }
                            )}
                          </p>
                        </div>
                      </div>

                      {(wage.overtime && wage.overtime > 0) ||
                      (wage.bonuses && wage.bonuses > 0) ||
                      (wage.deductions && wage.deductions > 0) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs pt-2 border-t">
                          {wage.overtime && wage.overtime > 0 && (
                              <div>
                                <span className="text-gray-500">Overtime:</span>
                                <p className="text-blue-600">
                                  +
                                  {wage.overtime.toLocaleString(
                                    "en-US",
                                    { style: "currency", currency: "SAR" }
                                  )}
                                </p>
                              </div>
                            )}
                          {wage.bonuses && wage.bonuses > 0 && (
                            <div>
                              <span className="text-gray-500">Bonuses:</span>
                              <p className="text-green-600">
                                +
                                {wage.bonuses.toLocaleString(
                                  "en-US",
                                  { style: "currency", currency: "SAR" }
                                )}
                              </p>
                            </div>
                          )}
                          {wage.deductions && wage.deductions > 0 && (
                              <div>
                                <span className="text-gray-500">
                                  Deductions:
                                </span>
                                <p className="text-red-600">
                                  -
                                  {wage.deductions.toLocaleString(
                                    "en-US",
                                    { style: "currency", currency: "SAR" }
                                  )}
                                </p>
                              </div>
                            )}
                        </div>
                      ) : null}

                      <div className="text-xs text-gray-500">
                        Payment Date: {format(new Date(wage.paymentDate), "MMM dd, yyyy")}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <Button
                        onClick={() => handleEditWage(wage)}
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto text-xs sm:text-sm"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteWage(wage)}
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Delete
                      </Button>
                      <Button
                        onClick={() => handleMarkAsPaid(wage)}
                        disabled={updateWageStatusMutation.isPending}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-xs sm:text-sm"
                      >
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Mark as </span>Paid
                        </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
