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
import { Label } from "@/components/ui/label";
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
  ShoppingCart,
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Clock,
  CheckCircle,
  Package,
  Eye,
} from "lucide-react";
import StatsCard from "@/components/ui/stats-card";
import PurchaseForm from "@/components/forms/purchase-form";
import { queryClient } from "@/lib/queryClient";
import type { Purchase, Supplier, Category } from "@/lib/schema";

export default function Purchases() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery<
    Purchase[]
  >({
    queryKey: ["purchases-records"],
    queryFn: () => {
      const stored = localStorage.getItem('purchases-records');
      return stored ? JSON.parse(stored) : [];
    },
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["suppliers-records"],
    queryFn: () => {
      const stored = localStorage.getItem('suppliers-records');
      return stored ? JSON.parse(stored) : [];
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories-records"],
    queryFn: () => {
      const stored = localStorage.getItem('categories-records');
      return stored ? JSON.parse(stored) : [];
    },
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Frontend: Saving purchase data to localStorage:', data);
      
      const stored = localStorage.getItem('purchases-records');
      const purchases = stored ? JSON.parse(stored) : [];
      
      const newPurchase = {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      purchases.push(newPurchase);
      localStorage.setItem('purchases-records', JSON.stringify(purchases));
      
      console.log('Frontend: Purchase saved successfully:', newPurchase);
      return newPurchase;
    },
    onSuccess: (data) => {
      console.log('Frontend: Purchase created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ["purchases-records"] });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      console.error('Frontend: Purchase creation failed:', error);
    },
  });

  const updatePurchaseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const stored = localStorage.getItem('purchases-records');
      const purchases = stored ? JSON.parse(stored) : [];
      
      const index = purchases.findIndex((purchase: any) => purchase.id === id);
      if (index !== -1) {
        purchases[index] = {
          ...purchases[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('purchases-records', JSON.stringify(purchases));
        return purchases[index];
      }
      throw new Error('Purchase not found');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases-records"] });
      setEditingPurchase(null);
    },
  });

  const deletePurchaseMutation = useMutation({
    mutationFn: async (id: number) => {
      const stored = localStorage.getItem('purchases-records');
      const purchases = stored ? JSON.parse(stored) : [];
      const filtered = purchases.filter((purchase: any) => purchase.id !== id);
      localStorage.setItem('purchases-records', JSON.stringify(filtered));
      return filtered;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases-records"] });
    },
  });

  const handleCreatePurchase = async (data: any) => {
    console.log('Frontend: Form data received:', data);
    
    // Find or create supplier
    let supplierId = suppliers.find(s => s.name === data.supplierName)?.id;
    console.log('Frontend: Found supplier ID:', supplierId);

    // If supplier doesn't exist, create one first
    if (!supplierId) {
      console.log('Frontend: Supplier not found, creating new supplier');
      try {
        const supplierData = {
          id: Date.now(),
          name: data.supplierName,
          phone: data.supplierPhone,
          email: data.supplierEmail || '',
          category: 'General',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const storedSuppliers = localStorage.getItem('suppliers-records');
        const suppliers = storedSuppliers ? JSON.parse(storedSuppliers) : [];
        suppliers.push(supplierData);
        localStorage.setItem('suppliers-records', JSON.stringify(suppliers));
        
        supplierId = supplierData.id;
        console.log('Frontend: Created new supplier with ID:', supplierId);
        // Refresh suppliers list
        queryClient.invalidateQueries({ queryKey: ['suppliers-records'] });
      } catch (error) {
        console.error('Frontend: Error creating supplier:', error);
        alert('Error creating supplier. Please try again.');
        return;
      }
    }

    // Calculate totals
    const subtotal = calculateTotalAmount(data.items) / 1.15; // Remove VAT to get subtotal
    const vatAmount = subtotal * 0.15;
    const totalAmount = subtotal + vatAmount;

    const formattedData = {
      supplierId: supplierId,
      purchaseOrderNumber: `PO-${Date.now()}`,
      items: data.items,
      subtotal: subtotal,
      vatAmount: vatAmount,
      totalAmount: totalAmount,
      orderDate: new Date(data.orderDate),
      expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : undefined,
      status: data.status,
      paymentStatus: "unpaid",
      notes: data.notes || "",
    };
    
    console.log('Frontend: Formatted data to send:', formattedData);
    createPurchaseMutation.mutate(formattedData);
  };

  const handleUpdatePurchase = (data: any) => {
    if (editingPurchase) {
      let supplierId = suppliers.find(s => s.name === data.supplierName)?.id;

      const formattedData = {
        supplierId: supplierId || editingPurchase.supplierId,
        description: data.description,
        totalAmount: calculateTotalAmount(data.items).toString(),
        purchaseDate: data.orderDate.toISOString(),
        expectedDelivery: data.expectedDelivery?.toISOString() || null,
        status: data.status,
      };
      updatePurchaseMutation.mutate({
        id: editingPurchase.id,
        data: formattedData,
      });
    }
  };

  const handleDeletePurchase = (id: number) => {
    if (confirm("Are you sure you want to delete this purchase order?")) {
      deletePurchaseMutation.mutate(id);
    }
  };

  const calculateTotalAmount = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const vatAmount = subtotal * 0.15; // 15% VAT
    return subtotal + vatAmount;
  };

  const filteredPurchases = purchases.filter(purchase => {
    // Get supplier info from suppliers array
    const supplier = suppliers.find(s => s.id === purchase.supplierId);
    const supplierName = supplier?.name || "Unknown Supplier";

    const matchesSearch =
      supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (purchase.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || purchase.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      Pending: "bg-yellow-100 text-yellow-800",
      Approved: "bg-gray-100 text-gray-800",
      Ordered: "bg-purple-100 text-purple-800",
      Delivered: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return (
      statusMap[status as keyof typeof statusMap] || "bg-gray-100 text-gray-800"
    );
  };

  // Calculate stats
  const totalPurchases = purchases.length;
  const pendingPurchases = purchases.filter(p => p.status === "Pending").length;
  const totalValue = purchases.reduce(
    (sum, p) => sum + parseFloat(p.totalAmount || "0"),
    0
  );
  const thisMonthPurchases = purchases.filter(p => {
    const purchaseDate = p.purchaseDate ? new Date(p.purchaseDate) : null;
    if (!purchaseDate) return false;
    const now = new Date();
    return (
      purchaseDate.getMonth() === now.getMonth() &&
      purchaseDate.getFullYear() === now.getFullYear()
    );
  }).length;

  if (purchasesLoading) {
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
            Purchases
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Manage purchase orders and supplier procurement
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gray-600 hover:bg-gray-700 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl mx-4 sm:mx-0 max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Create New Purchase Order</DialogTitle>
              <DialogDescription>
                Create a new purchase order to manage supplier procurement and
                inventory acquisition
              </DialogDescription>
            </DialogHeader>
            <PurchaseForm
              suppliers={suppliers}
              categories={categories}
              onSubmit={handleCreatePurchase}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createPurchaseMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Orders"
          value={totalPurchases}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          iconBgColor="bg-gray-50"
        />
        <StatsCard
          title="Pending Approval"
          value={pendingPurchases}
          icon={Clock}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-50"
        />
        <StatsCard
          title="Total Value"
          value={totalValue.toLocaleString("en-US", {
            style: "currency",
            currency: "SAR",
          })}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <StatsCard
          title="This Month"
          value={thisMonthPurchases}
          icon={Package}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
        />
      </div>

      {/* Purchases List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Purchase Orders</CardTitle>
              <div className="text-sm text-gray-500 mt-1">
                Total: {filteredPurchases.length} orders
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search purchases..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Ordered">Ordered</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                  <TableHead>Order Details</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map(purchase => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        # {purchase.purchaseNumber}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2">
                        {purchase.description || "No description"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const supplier = suppliers.find(
                          s => s.id === purchase.supplierId
                        );
                        return (
                          <div>
                            <div className="font-medium">
                              {supplier?.name || "Unknown Supplier"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {supplier?.phone || "N/A"}
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {purchase.purchaseDate
                        ? new Date(purchase.purchaseDate).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {parseFloat(purchase.totalAmount || "0").toLocaleString(
                        "en-US",
                        { style: "currency", currency: "SAR" }
                      )}
                    </TableCell>
                    <TableCell>
                      {purchase.expectedDelivery ? (
                        new Date(purchase.expectedDelivery).toLocaleDateString()
                      ) : (
                        <span className="text-gray-400">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(purchase.status)}>
                        {purchase.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingPurchase(purchase)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPurchase(purchase)}
                          title="Edit Purchase"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePurchase(purchase.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete Purchase"
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

          {filteredPurchases.length === 0 && (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <div className="text-gray-500 mb-4">No purchase orders found</div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Purchase Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Purchase Details Dialog */}
      <Dialog open={!!viewingPurchase} onOpenChange={() => setViewingPurchase(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
            <DialogDescription>
              Comprehensive information for the selected purchase order
            </DialogDescription>
          </DialogHeader>
          {viewingPurchase && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                <div className="p-3 bg-green-100 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{viewingPurchase.itemName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Purchase Order #{viewingPurchase.id}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Supplier</Label>
                  <p className="text-sm font-semibold">
                    {(() => {
                      const supplier = suppliers.find(s => s.id === viewingPurchase.supplierId);
                      return supplier?.name || viewingPurchase.supplierName || "Unknown Supplier";
                    })()}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Item Name</Label>
                  <p className="text-sm">{viewingPurchase.itemName}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Quantity</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {viewingPurchase.quantity} units
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Unit Price</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    SAR {parseFloat(viewingPurchase.unitPrice?.toString() || "0").toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Total Amount</Label>
                  <p className="text-lg font-bold text-green-600">
                    SAR {parseFloat(viewingPurchase.totalAmount?.toString() || "0").toLocaleString()}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Purchase Date</Label>
                  <p className="text-sm">
                    {viewingPurchase.purchaseDate 
                      ? new Date(viewingPurchase.purchaseDate).toLocaleDateString()
                      : "Not specified"
                    }
                  </p>
                </div>
              </div>
              
              {viewingPurchase.expectedDelivery && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Expected Delivery</Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">
                      {new Date(viewingPurchase.expectedDelivery).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              
              {viewingPurchase.notes && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="text-sm bg-muted p-3 rounded">{viewingPurchase.notes}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(viewingPurchase.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(viewingPurchase.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingPurchase(null);
                    setEditingPurchase(viewingPurchase);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Purchase
                </Button>
                <Button onClick={() => setViewingPurchase(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Purchase Dialog */}
      <Dialog
        open={!!editingPurchase}
        onOpenChange={() => setEditingPurchase(null)}
      >
        <DialogContent className="max-w-4xl mx-4 sm:mx-0 max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Edit Purchase Order</DialogTitle>
            <DialogDescription>
              Update purchase order details and modify supplier procurement
              information
            </DialogDescription>
          </DialogHeader>
          {editingPurchase && (
            <PurchaseForm
              suppliers={suppliers}
              categories={categories}
              onSubmit={handleUpdatePurchase}
              onCancel={() => setEditingPurchase(null)}
              initialData={{
                supplierName:
                  suppliers.find(s => s.id === editingPurchase.supplierId)
                    ?.name || "",
                supplierEmail:
                  suppliers.find(s => s.id === editingPurchase.supplierId)
                    ?.email || "",
                supplierPhone:
                  suppliers.find(s => s.id === editingPurchase.supplierId)
                    ?.phone || "",
                orderDate: editingPurchase.purchaseDate
                  ? new Date(editingPurchase.purchaseDate)
                  : new Date(),
                expectedDelivery: editingPurchase.expectedDelivery
                  ? new Date(editingPurchase.expectedDelivery)
                  : undefined,
                categoryId: undefined,
                description: editingPurchase.description || "",
                items: [
                  {
                    description: "Items from purchase",
                    quantity: 1,
                    unitPrice: parseFloat(editingPurchase.totalAmount) / 1.15,
                    total: parseFloat(editingPurchase.totalAmount) / 1.15,
                  },
                ],
                notes: "",
                status: editingPurchase.status,
              }}
              isLoading={updatePurchaseMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
