import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Star,
  Phone,
  Mail,
  MapPin,
  Users,
  TrendingUp,
} from "lucide-react";
import StatsCard from "@/components/ui/stats-card";
import SupplierForm from "@/components/forms/supplier-form";
import { queryClient } from "@/lib/queryClient";
import type { Supplier } from "@/lib/schema";

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<
    Supplier[]
  >({
    queryKey: ["suppliers-records"],
    queryFn: () => {
      const stored = localStorage.getItem('suppliers-records');
      return stored ? JSON.parse(stored) : [];
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data: any) => {
      const stored = localStorage.getItem('suppliers-records');
      const suppliers = stored ? JSON.parse(stored) : [];
      
      const newSupplier = {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      suppliers.push(newSupplier);
      localStorage.setItem('suppliers-records', JSON.stringify(suppliers));
      return newSupplier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers-records"] });
      setIsCreateDialogOpen(false);
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const stored = localStorage.getItem('suppliers-records');
      const suppliers = stored ? JSON.parse(stored) : [];
      
      const index = suppliers.findIndex((supplier: any) => supplier.id === id);
      if (index !== -1) {
        suppliers[index] = {
          ...suppliers[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('suppliers-records', JSON.stringify(suppliers));
        return suppliers[index];
      }
      throw new Error('Supplier not found');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers-records"] });
      setEditingSupplier(null);
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: number) => {
      const stored = localStorage.getItem('suppliers-records');
      const suppliers = stored ? JSON.parse(stored) : [];
      const filtered = suppliers.filter((supplier: any) => supplier.id !== id);
      localStorage.setItem('suppliers-records', JSON.stringify(filtered));
      return filtered;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers-records"] });
    },
  });

  const handleCreateSupplier = (data: any) => {
    createSupplierMutation.mutate(data);
  };

  const handleUpdateSupplier = (data: any) => {
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data });
    }
  };

  const handleDeleteSupplier = (id: number) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      deleteSupplierMutation.mutate(id);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.contactPerson || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (supplier.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || true; // Supplier doesn't have category property
    const matchesStatus =
      statusFilter === "all" || true; // Supplier doesn't have status property

    return matchesSearch && matchesCategory && matchesStatus;
  });



  // Calculate stats
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.length; // All suppliers are considered active
  const averageRating = 0; // Rating not available in Supplier interface
  const topRatedSuppliers = 0; // Rating not available in Supplier interface

  if (suppliersLoading) {
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
            Suppliers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Manage vendor relationships and supplier information
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gray-600 hover:bg-gray-700 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add New Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl mx-4 sm:mx-0 max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Create a new supplier record with contact information and rating
              </DialogDescription>
            </DialogHeader>
            <SupplierForm
              onSubmit={handleCreateSupplier}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createSupplierMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Suppliers"
          value={totalSuppliers}
          icon={Building2}
          iconColor="text-blue-600"
          iconBgColor="bg-gray-50"
        />
        <StatsCard
          title="Active Suppliers"
          value={activeSuppliers}
          icon={Users}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <StatsCard
          title="Average Rating"
          value={averageRating.toFixed(1)}
          icon={Star}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-50"
        />
        <StatsCard
          title="Top Rated (4+ Stars)"
          value={topRatedSuppliers}
          icon={TrendingUp}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
        />
      </div>

      {/* Suppliers List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Supplier Directory</CardTitle>
              <div className="text-sm text-gray-500 mt-1">
                Total: {filteredSuppliers.length} suppliers
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Materials">Materials</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Services">Services</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier Details</TableHead>
                  <TableHead>Contact Information</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map(supplier => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {supplier.name}
                        </div>
                        {supplier.contactPerson && (
                          <div className="text-sm text-gray-500">
                            Contact: {supplier.contactPerson}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {supplier.phone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.address && (
                          <div className="flex items-start text-sm text-gray-600">
                            <MapPin className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">
                              {supplier.address}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        General
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          No rating
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSupplier(supplier)}
                          title="Edit Supplier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete Supplier"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <div className="text-gray-500 mb-4">No suppliers found</div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Supplier
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Supplier Dialog */}
      <Dialog
        open={!!editingSupplier}
        onOpenChange={() => setEditingSupplier(null)}
      >
        <DialogContent className="max-w-3xl mx-4 sm:mx-0 max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update supplier information, contact details, and rating
            </DialogDescription>
          </DialogHeader>
          {editingSupplier && (
            <SupplierForm
              onSubmit={handleUpdateSupplier}
              onCancel={() => setEditingSupplier(null)}
              initialData={{
                name: editingSupplier.name,
                contactPerson: editingSupplier.contactPerson || "",
                email: editingSupplier.email || "",
                phone: editingSupplier.phone || "",
                address: editingSupplier.address || "",
                category: "General",
                status: "Active",
                rating: 5,
                notes: "",
              }}
              isLoading={updateSupplierMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
