import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { AliAlYamny, InsertAliAlYamny } from "@/lib/schema";

// Ali Al Yamny form schema
const aliAlYamnyFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  iqmasNo: z.string().min(1, "Iqama number is required"),
  companyName: z.string().min(1, "Company number is required"),
  contact: z.string().min(1, "Contact number is required"),
  agreement: z.string().min(1, "Agreement details are required"),
  aliAlYamny: z.string().min(1, "Ali Al Yamny information is required"),
  expireDate: z.string().optional(),
});

type AliAlYamnyFormData = z.infer<typeof aliAlYamnyFormSchema>;

// Type alias for consistency with existing code
type AliAlYamnyRecord = AliAlYamny;

interface AliAlYamnyFormProps {
  record?: AliAlYamnyRecord;
  trigger?: React.ReactNode;
}

function AliAlYamnyForm({ record, trigger }: AliAlYamnyFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AliAlYamnyFormData>({
    resolver: zodResolver(aliAlYamnyFormSchema),
    defaultValues: {
      name: record?.name || "",
      iqmasNo: record?.iqmasNo || "",
      companyName: record?.companyName || "",
      contact: record?.contact || "",
      agreement: record?.agreement || "",
      aliAlYamny: record?.aliAlYamny || "",
      expireDate: record?.expireDate ? new Date(record.expireDate).toISOString().split('T')[0] : "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AliAlYamnyFormData) => {
      // Get existing records from localStorage
      const storedData = localStorage.getItem('ali-al-yamny-records');
      const existingRecords = storedData ? JSON.parse(storedData) : [];
      
      // Create new record with ID and timestamps
      const newRecord = {
        ...data,
        id: Date.now().toString(), // Simple ID generation
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Add to existing records
      const updatedRecords = [...existingRecords, newRecord];
      
      // Save back to localStorage
      localStorage.setItem('ali-al-yamny-records', JSON.stringify(updatedRecords));
      
      return newRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ali-al-yamny"] });
      toast({
        title: "Success",
        description: "Ali Al Yamny record created successfully",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create record",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AliAlYamnyFormData) => {
      // Get existing records from localStorage
      const storedData = localStorage.getItem('ali-al-yamny-records');
      const existingRecords = storedData ? JSON.parse(storedData) : [];
      
      // Find and update the record
      const updatedRecords = existingRecords.map((r: any) => 
        r.id === record?.id 
          ? { ...r, ...data, updatedAt: new Date().toISOString() }
          : r
      );
      
      // Save back to localStorage
      localStorage.setItem('ali-al-yamny-records', JSON.stringify(updatedRecords));
      
      return { ...record, ...data, updatedAt: new Date().toISOString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ali-al-yamny"] });
      toast({
        title: "Success",
        description: "Ali Al Yamny record updated successfully",
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update record",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AliAlYamnyFormData) => {
    if (record) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Record
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {record
              ? "Edit Ali Al Yamny Record"
              : "Add New Ali Al Yamny Record"}
          </DialogTitle>
          <DialogDescription>
            {record
              ? "Update the Ali Al Yamny record details."
              : "Fill in the details to create a new Ali Al Yamny record."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iqmasNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Iqama No</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Iqama number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company No</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact No</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter contact number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agreement</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter agreement details" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="aliAlYamny"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ali Al Yamny</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Ali Al Yamny information"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expireDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expire Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      placeholder="Select expire date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : record
                    ? "Update Record"
                    : "Add Record"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function AliAlYamny() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Temporary mock data until backend endpoint is implemented
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["/api/ali-al-yamny"],
    queryFn: async () => {
      // Try to get data from localStorage first
      const storedData = localStorage.getItem('ali-al-yamny-records');
      if (storedData) {
        return JSON.parse(storedData);
      }
      // Return empty array if no stored data
      return [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get existing records from localStorage
      const storedData = localStorage.getItem('ali-al-yamny-records');
      const existingRecords = storedData ? JSON.parse(storedData) : [];
      
      // Filter out the record to delete
      const updatedRecords = existingRecords.filter((r: any) => r.id !== id);
      
      // Save back to localStorage
      localStorage.setItem('ali-al-yamny-records', JSON.stringify(updatedRecords));
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ali-al-yamny"] });
      toast({
        title: "Success",
        description: "Ali Al Yamny record deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete record",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      deleteMutation.mutate(id);
    }
  };

  const exportToCSV = () => {
    if (filteredRecords.length === 0) {
      toast({
        title: "No Data",
        description: "No records available to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Name",
      "Iqama No",
      "Company No",
      "Contact No",
      "Agreement",
      "Ali Al Yamny",
      "Expire Date",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredRecords.map((record: AliAlYamnyRecord) =>
        [
          `"${record.name || 'N/A'}"`,
          `"${record.iqmasNo || 'N/A'}"`,
          `"${record.companyName || 'N/A'}"`,
          `"${record.contact || 'N/A'}"`,
          `"${record.agreement?.replace(/"/g, '""') || 'N/A'}"`,
          `"${record.aliAlYamny?.replace(/"/g, '""') || 'N/A'}"`,
          `"${record.expireDate ? new Date(record.expireDate).toLocaleDateString() : 'Not set'}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `ali-al-yamny-records-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: `Exported ${filteredRecords.length} records to CSV`,
    });
  };

  const filteredRecords = records.filter((record: AliAlYamnyRecord) =>
    Object.values(record).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ali Al Yamny</h1>
          <p className="text-muted-foreground">
            Manage Ali Al Yamny records and information
          </p>
        </div>
        <AliAlYamnyForm />
      </div>



      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Companies
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(records.map((r: AliAlYamnyRecord) => r.companyName)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Agreements
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter((r: AliAlYamnyRecord) => r.agreement).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contact Records
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter((r: AliAlYamnyRecord) => r.contact).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Ali Al Yamny Records</CardTitle>
              <div className="text-sm text-gray-500 mt-1">
                Total: {filteredRecords.length} records
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={exportToCSV}
                disabled={isLoading || filteredRecords.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Iqama No</TableHead>
                  <TableHead>Company No</TableHead>
                  <TableHead>Contact No</TableHead>
                  <TableHead>Agreement</TableHead>
                  <TableHead>Ali Al Yamny</TableHead>
                  <TableHead>Expire Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading records...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="text-gray-500 mb-4">
                        {searchTerm
                          ? "No records found matching your search"
                          : "No Ali Al Yamny records found"}
                      </div>
                      <AliAlYamnyForm />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record: AliAlYamnyRecord) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.name || 'N/A'}
                      </TableCell>
                      <TableCell>{record.iqmasNo || 'N/A'}</TableCell>
                      <TableCell>{record.companyName || 'N/A'}</TableCell>
                      <TableCell>{record.contact || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {record.agreement || 'N/A'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {record.aliAlYamny || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {record.expireDate ? (
                          <Badge variant="outline">
                            {new Date(record.expireDate).toLocaleDateString()}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <AliAlYamnyForm
                            record={record}
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
                            onClick={() => handleDelete(String(record.id))}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
