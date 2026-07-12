import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Package,
  Plus,
  Search,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import StatsCard from "@/components/ui/stats-card";
import InventoryForm from "@/components/forms/inventory-form";
import { useToast } from "@/hooks/use-toast";
import { type Inventory } from "@/lib/schema";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: inventoryData,
    isLoading,
    error,
  } = useQuery<Inventory[]>({
    queryKey: ["inventory-records"],
    queryFn: () => {
      const stored = localStorage.getItem("inventory-records");
      return stored ? JSON.parse(stored) : [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      const stored = localStorage.getItem("inventory-records");
      const inventory = stored ? JSON.parse(stored) : [];
      const updatedInventory = inventory.filter((item: any) => item.id !== id);
      localStorage.setItem("inventory-records", JSON.stringify(updatedInventory));
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-records"] });
      const { dismiss } = toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
      setTimeout(() => dismiss(), 3000);
    },
    onError: (error: any) => {
      const { dismiss } = toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
      setTimeout(() => dismiss(), 5000);
    },
  });

  const handleDelete = (id: number) => {
    if (
      window.confirm("Are you sure you want to delete this inventory item?")
    ) {
      deleteMutation.mutate(id);
    }
  };

  const inventory = inventoryData || [];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (item.supplier || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all"; // Will need category data for proper filtering
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStockStatus = (
    quantity: number,
    minLevel: number,
    status?: string
  ) => {
    // Check if item is sold first
    if (status === "sold") {
      return {
        status: "Sold",
        color: "bg-transparent text-muted-foreground border border-border",
      };
    }

    if (quantity <= minLevel) {
      return { status: "Low Stock", color: "bg-red-100 text-red-800" };
    } else if (quantity <= minLevel * 1.5) {
      return { status: "Medium Stock", color: "bg-yellow-100 text-yellow-800" };
    }
    return { status: "In Stock", color: "bg-green-100 text-green-800" };
  };

  // Calculate stats
  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum, item) => {
    const value =
      typeof item.totalValue === "string"
        ? parseFloat(item.totalValue)
        : Number(item.totalValue);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
  const lowStockItems = inventory.filter(
    item => item.quantity <= (item.minStockLevel || 0)
  ).length;
  const outOfStockItems = inventory.filter(item => item.quantity === 0).length;

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">
          Inventory Management
        </h2>
        <InventoryForm />
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Total Items" value={totalItems} icon={Package} />
        <StatsCard
          title="Total Value"
          value={formatCurrency(totalValue)}
          icon={TrendingUp}
        />
        <StatsCard
          title="Low Stock Items"
          value={lowStockItems}
          icon={AlertTriangle}
        />
        <StatsCard
          title="Out of Stock"
          value={outOfStockItems}
          icon={TrendingDown}
        />
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                Total: {filteredInventory.length} items
              </div>
            </div>
            <div className="flex space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search items, supplier, location..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Materials">Materials</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
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
                  <TableHead>Item Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading inventory...
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map(item => {
                    const stockInfo = getStockStatus(
                      item.quantity,
                      item.minStockLevel || 5,
                      item.status
                    );
                    return (
                      <TableRow
                        key={item.id}
                        className={
                          item.status === "sold" ? "opacity-50 bg-muted/50" : ""
                        }
                      >
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(item.totalValue || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge className={stockInfo.color}>
                            {stockInfo.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <InventoryForm
                              inventory={item}
                              trigger={
                                <Button variant="outline" size="sm">
                                  <Edit className="mr-1 h-3 w-3" />
                                  Edit
                                </Button>
                              }
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="text-muted-foreground mb-4">No inventory items found</div>
              <InventoryForm />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
