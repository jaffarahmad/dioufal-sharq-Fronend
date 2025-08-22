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
import { Badge } from "@/components/ui/badge";
import { Tag, Search, Edit, Trash2, Plus } from "lucide-react";
import StatsCard from "@/components/ui/stats-card";
import CategoryForm from "@/components/forms/category-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Category } from "@/lib/schema";

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: categoriesData,
    isLoading,
    error,
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      const { dismiss } = toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      setTimeout(() => dismiss(), 3000);
    },
    onError: (error: any) => {
      const { dismiss } = toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
      setTimeout(() => dismiss(), 5000);
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      deleteMutation.mutate(id);
    }
  };

  const categories = categoriesData || [];

  const filteredCategories = categories.filter(category => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      category.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate stats
  const totalCategories = categories.length;
  const inventoryCategories = categories.filter(
    cat => cat.type === "Inventory"
  ).length;
  const projectCategories = categories.filter(
    cat => cat.type === "Project"
  ).length;
  const otherCategories = categories.filter(
    cat => !["Inventory", "Project"].includes(cat.type)
  ).length;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Inventory":
        return "bg-blue-100 text-blue-800";
      case "Project":
        return "bg-green-100 text-green-800";
      case "Financial":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading categories...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error loading categories</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Category Management
        </h2>
        <CategoryForm />
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Categories"
          value={totalCategories}
          icon={Tag}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <StatsCard
          title="Inventory Categories"
          value={inventoryCategories}
          icon={Tag}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <StatsCard
          title="Project Categories"
          value={projectCategories}
          icon={Tag}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
        />
        <StatsCard
          title="Other Categories"
          value={otherCategories}
          icon={Tag}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-50"
        />
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search categories..."
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categories ({filteredCategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map(category => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {category.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(category.type)}>
                        {category.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-sm text-gray-600 truncate">
                        {category.description || "No description"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {category.createdAt
                        ? new Date(category.createdAt).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <CategoryForm
                          category={category}
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
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-8">
              <Tag className="mx-auto h-12 w-12 text-gray-400" />
              <div className="text-gray-500 mb-4">No categories found</div>
              <CategoryForm />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
