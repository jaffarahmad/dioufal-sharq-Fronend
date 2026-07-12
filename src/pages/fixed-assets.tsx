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
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import StatsCard from "@/components/ui/stats-card";
import FixedAssetForm from "@/components/forms/fixed-asset-form";
import { queryClient } from "@/lib/queryClient";
import type { FixedAsset, Category } from "@/lib/schema";

export default function FixedAssets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);

  const { data: assets = [], isLoading: assetsLoading } = useQuery<
    FixedAsset[]
  >({
    queryKey: ["fixed-assets-records"],
    queryFn: () => {
      const stored = localStorage.getItem("fixed-assets-records");
      return stored ? JSON.parse(stored) : [];
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories-records"],
    queryFn: () => {
      const stored = localStorage.getItem("categories-records");
      return stored ? JSON.parse(stored) : [];
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("[FRONTEND] Sending fixed asset data:", JSON.stringify(data, null, 2));
      
      const assetData = {
        id: Date.now(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const existingRecords = JSON.parse(localStorage.getItem("fixed-assets-records") || "[]");
      const updatedRecords = [...existingRecords, assetData];
      localStorage.setItem("fixed-assets-records", JSON.stringify(updatedRecords));
      
      console.log("[FRONTEND] Asset saved to localStorage:", assetData);
      return assetData;
    },
    onSuccess: (data) => {
      console.log("[FRONTEND] Asset created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["fixed-assets-records"] });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      console.error("[FRONTEND] Error creating asset:", error);
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const existingRecords = JSON.parse(localStorage.getItem("fixed-assets-records") || "[]");
      const recordIndex = existingRecords.findIndex((record: any) => record.id === parseInt(id));
      
      if (recordIndex !== -1) {
        const updatedAsset = {
          ...existingRecords[recordIndex],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        existingRecords[recordIndex] = updatedAsset;
        localStorage.setItem("fixed-assets-records", JSON.stringify(existingRecords));
        return updatedAsset;
      }
      
      throw new Error("Asset not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-assets-records"] });
      setEditingAsset(null);
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: string) => {
      const existingRecords = JSON.parse(localStorage.getItem("fixed-assets-records") || "[]");
      const filteredRecords = existingRecords.filter((record: any) => record.id !== parseInt(id));
      localStorage.setItem("fixed-assets-records", JSON.stringify(filteredRecords));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-assets-records"] });
    },
  });

  const handleCreateAsset = (data: any) => {
    createAssetMutation.mutate(data);
  };

  const handleUpdateAsset = (data: any) => {
    if (editingAsset) {
      updateAssetMutation.mutate({ id: String(editingAsset.id), data });
    }
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      deleteAssetMutation.mutate(id);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.assetCode && asset.assetCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (asset.location &&
        asset.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || asset.status === statusFilter;
    const matchesCondition =
      conditionFilter === "all" || asset.condition === conditionFilter;

    return matchesSearch && matchesStatus && matchesCondition;
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      Active: "bg-green-100 text-green-800",
      Disposed: "bg-red-100 text-red-800",
      Maintenance: "bg-yellow-100 text-yellow-800",
    };
    return (
      statusMap[status as keyof typeof statusMap] || "bg-gray-100 text-foreground"
    );
  };

  const getConditionBadge = (condition: string) => {
    const conditionMap = {
      Excellent: "bg-green-100 text-green-800",
      Good: "bg-gray-100 text-foreground",
      Fair: "bg-yellow-100 text-yellow-800",
      Poor: "bg-red-100 text-red-800",
    };
    return (
      conditionMap[condition as keyof typeof conditionMap] ||
      "bg-gray-100 text-foreground"
    );
  };

  // Calculate stats
  const totalAssets = assets.length;
  const activeAssets = assets.filter(a => a.status === "Active").length;
  const totalValue = assets
    .filter(a => a.status === "Active")
    .reduce((sum, a) => sum + parseFloat(String(a.currentValue || "0")), 0);
  const totalPurchaseValue = assets.reduce(
    (sum, a) => sum + parseFloat(String(a.purchasePrice || "0")),
    0
  );
  const totalDepreciation = totalPurchaseValue - totalValue;

  if (assetsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Fixed Assets
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage company equipment, machinery, and valuable assets
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="primary">
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Add New Fixed Asset</DialogTitle>
              <DialogDescription>
                Register a new fixed asset for tracking and depreciation
                management
              </DialogDescription>
            </DialogHeader>
            <FixedAssetForm
              categories={categories}
              onSubmit={handleCreateAsset}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createAssetMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Assets"
          value={totalAssets}
          icon={Package}
          iconColor="text-blue-600"
          iconBgColor="bg-muted/50"
        />
        <StatsCard
          title="Active Assets"
          value={activeAssets}
          icon={Package}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <StatsCard
          title="Current Value"
          value={totalValue.toLocaleString("en-US", {
            style: "currency",
            currency: "SAR",
          })}
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-50"
        />
        <StatsCard
          title="Total Depreciation"
          value={totalDepreciation.toLocaleString("en-US", {
            style: "currency",
            currency: "SAR",
          })}
          icon={TrendingDown}
          iconColor="text-red-600"
          iconBgColor="bg-red-50"
        />
      </div>

      {/* Assets List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Fixed Assets</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search assets..."
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
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Disposed">Disposed</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={conditionFilter}
                onValueChange={setConditionFilter}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Poor">Poor</SelectItem>
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
                  <TableHead>Asset</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map(asset => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {asset.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {asset.purchaseDate
                          ? new Date(asset.purchaseDate).toLocaleDateString()
                          : "No date"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono font-medium">
                        {asset.assetCode}
                      </div>
                    </TableCell>
                    <TableCell>{asset.location || "Not specified"}</TableCell>
                    <TableCell className="font-medium">
                      {parseFloat(String(asset.purchasePrice || "0")).toLocaleString(
                        "en-US",
                        { style: "currency", currency: "SAR" }
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {parseFloat(String(asset.currentValue || "0")).toLocaleString(
                        "en-US",
                        { style: "currency", currency: "SAR" }
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getConditionBadge(asset.condition)}>
                        {asset.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(asset.status || "")}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingAsset(asset)}
                          title="Edit Asset"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAsset(String(asset.id))}
                          className="text-red-600 hover:text-red-700"
                          title="Delete Asset"
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

          {filteredAssets.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="text-muted-foreground mb-4">No fixed assets found</div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Asset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Asset Dialog */}
      <Dialog open={!!editingAsset} onOpenChange={() => setEditingAsset(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Edit Fixed Asset</DialogTitle>
            <DialogDescription>
              Update fixed asset information and modify depreciation details
            </DialogDescription>
          </DialogHeader>
          {editingAsset && (
            <FixedAssetForm
              categories={categories}
              onSubmit={handleUpdateAsset}
              onCancel={() => setEditingAsset(null)}
              initialData={{
                name: editingAsset.name,
                description: editingAsset.description || "",
                categoryId: editingAsset.categoryId || undefined,
                assetCode: editingAsset.assetCode,
                purchaseDate: editingAsset.purchaseDate
                  ? new Date(editingAsset.purchaseDate)
                  : undefined,
                purchasePrice: parseFloat(String(editingAsset.purchasePrice || "0")),
                currentValue: parseFloat(String(editingAsset.currentValue || "0")),
                depreciationRate: parseFloat(
                  String(editingAsset.depreciationRate || "0")
                ),
                location: editingAsset.location || "",
                condition: editingAsset.condition,
                status: editingAsset.status,
              }}
              isLoading={updateAssetMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
