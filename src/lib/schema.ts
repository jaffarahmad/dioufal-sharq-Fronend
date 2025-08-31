import { z } from "zod";

// Employee schemas
export const insertEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  position: z.string().min(1, "Position is required"),
  salary: z.number().min(0, "Salary must be positive"),
  hireDate: z.string(),
  projectId: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export interface Employee extends InsertEmployee {
  id: number;
  createdAt: string;
  updatedAt: string;
  department?: string;
}

// Project schemas
export const insertProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  budget: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val),
  status: z.enum(["planning", "active", "completed", "cancelled"]).default("planning"),
  clientName: z.string().optional(),
  clientContact: z.string().optional(),
  clientEmail: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  type: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;

export interface Project extends InsertProject {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Category schemas
export const insertCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  type: z.enum(["inventory", "expense", "asset"]).default("inventory"),
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;

export interface Category extends InsertCategory {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// Supplier schemas
export const insertSupplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export interface Supplier extends InsertSupplier {
  id: number;
  createdAt: string;
  updatedAt: string;
  status?: string;
}

// Inventory schemas
export const insertInventorySchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  categoryId: z.number(),
  supplierId: z.number().optional(),
  minStock: z.number().min(0).default(0),
  totalValue: z.number().min(0, "Total value must be non-negative"),
  minStockLevel: z.number().min(0).optional(),
  status: z.enum(["available", "sold", "damaged", "reserved"]).default("available"),
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;

export interface Inventory extends InsertInventory {
  id: number;
  createdAt: string;
  updatedAt: string;
  supplier?: string;
  location?: string;
}

// Purchase schemas
export const insertPurchaseSchema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  itemName: z.string().min(1, "Item name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  totalAmount: z.union([z.number(), z.string()]).transform(val => {
    if (typeof val === 'string') return val;
    return val.toString();
  }),
  purchaseDate: z.string(),
  expectedDelivery: z.string().optional(),
  status: z.enum(["Pending", "Delivered", "Cancelled"]).default("Pending"),
  description: z.string().optional(),
  purchaseNumber: z.string().optional(),
  supplierId: z.union([z.number(), z.string()]).optional(),
});

export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

export interface Purchase extends InsertPurchase {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// Attendance schemas
export const insertAttendanceSchema = z.object({
  employeeId: z.string(),
  projectId: z.string(),
  date: z.string(),
  hoursWorked: z.number().min(0).max(24),
  overtime: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export interface Attendance extends InsertAttendance {
  id: number;
  createdAt: string;
  updatedAt: string;
  checkIn?: string;
  checkOut?: string;
  status?: string;
}

// Wage schemas
export const insertWageSchema = z.object({
  employeeId: z.number(),
  amount: z.number().min(0),
  paymentDate: z.string(),
  period: z.string(),
  hoursWorked: z.number().min(0).optional(),
  overtime: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  bonuses: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export type InsertWage = z.infer<typeof insertWageSchema>;

export interface Wage extends InsertWage {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// Fixed Asset schemas
export const insertFixedAssetSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  description: z.string().optional(),
  categoryId: z.number(),
  purchasePrice: z.number().min(0),
  purchaseDate: z.string(),
  depreciationRate: z.number().min(0).max(100).default(0),
  currentValue: z.number().min(0),
  condition: z.enum(["excellent", "good", "fair", "poor"]).default("good"),
  location: z.string().optional(),
});

export type InsertFixedAsset = z.infer<typeof insertFixedAssetSchema>;

export interface FixedAsset extends InsertFixedAsset {
  id: number;
  createdAt: string;
  updatedAt: string;
  status?: string;
  assetCode?: string;
}

// Transaction schemas
export const insertTransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number(),
  description: z.string().min(1, "Description is required"),
  date: z.string(),
  projectId: z.number().optional(),
  categoryId: z.number().optional(),
  reference: z.string().optional(),
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export interface Transaction extends InsertTransaction {
  id: number;
  createdAt: string;
  updatedAt: string;
  status?: string;
  category?: string;
}

// Invoice schemas
export const insertInvoiceSchema = z.object({
  projectId: z.union([z.number(), z.string()]).optional(),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientAddress: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    total: z.number().min(0),
  })),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  issueDate: z.string(),
  dueDate: z.string(),
  status: z.enum(["draft", "sent", "paid", "overdue"]).default("draft"),
  notes: z.string().optional(),
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export interface Invoice extends InsertInvoice {
  id: number;
  createdAt: string;
  updatedAt: string;
  paidDate?: string;
  poNumber?: string;
  clientEmail?: string;
  clientPhone?: string;
  description?: string;
  quotationId?: number;
  totalAmount?: number;
  taxAmount?: string;
}

// Quotation schemas
export interface QuotationItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export const insertQuotationSchema = z.object({
  projectId: z.string(),
  quotationNumber: z.string().min(1, "Quotation number is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientAddress: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    total: z.number().min(0),
  })),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  validUntil: z.string(),
  status: z.enum(["draft", "sent", "accepted", "rejected"]).default("draft"),
  notes: z.string().optional(),
});

export type InsertQuotation = z.infer<typeof insertQuotationSchema>;

export interface Quotation extends InsertQuotation {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// Manpower schemas
export const insertManpowerSchema = z.object({
  projectId: z.string(),
  employeeId: z.string(),
  role: z.string(),
  assignedDate: z.string(),
  endDate: z.string().optional(),
  dailyRate: z.number(),
  status: z.enum(["active", "completed", "terminated"]).default("active"),
});

export type InsertManpower = z.infer<typeof insertManpowerSchema>;

export interface Manpower extends InsertManpower {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// Payment schemas
export const insertPaymentSchema = z.object({
  iqamaNo: z.string().min(1, "Iqama No is required"),
  name: z.string().min(1, "Name is required"),
  companyNo: z.string().optional(),
  phone: z.string().optional(),
  month: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  status: z.enum(["paid", "not_paid"]).default("not_paid"),
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export interface PaymentRecord extends InsertPayment {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Ali Al Yamny schemas
export const insertAliAlYamnySchema = z.object({
  date: z.string(),
  description: z.string().min(1, "Description is required"),
  amount: z.number(),
  type: z.enum(["income", "expense"]),
  category: z.string().optional(),
  reference: z.string().optional(),
});

export type InsertAliAlYamny = z.infer<typeof insertAliAlYamnySchema>;

export interface AliAlYamny extends InsertAliAlYamny {
  id: number;
  createdAt: string;
  updatedAt: string;
  iqmasNo?: string;
  companyName?: string;
  contact?: string;
  agreement?: string;
  aliAlYamny?: string;
  expireDate?: string;
}