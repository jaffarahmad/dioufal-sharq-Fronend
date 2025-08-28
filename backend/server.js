const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Mock data
let projects = [
  {
    id: 1,
    name: 'Sample Project',
    description: 'A sample construction project',
    status: 'active',
    budget: 50000,
    startDate: '2024-01-01',
    clientName: 'John Doe',
    clientContact: '+966501234567',
    clientEmail: 'john@example.com',
    progress: 25
  }
];

let suppliers = [
  {
    id: 1,
    name: 'ABC Construction Materials',
    contactPerson: 'Ahmed Ali',
    phone: '+966501234567',
    email: 'ahmed@abc.com',
    category: 'Materials',
    status: 'Active',
    rating: 5
  }
];

let categories = [
  {
    id: 1,
    name: 'Construction Materials',
    description: 'Materials for construction',
    type: 'inventory'
  },
  {
    id: 2,
    name: 'Equipment',
    description: 'Construction equipment',
    type: 'inventory'
  }
];

let inventory = [
  {
    id: 1,
    name: 'Cement Bags',
    description: 'High quality cement',
    quantity: 100,
    unit: 'bags',
    unitPrice: 25.50,
    categoryId: 1,
    supplierId: 1,
    minStock: 10,
    status: 'available'
  }
];

let employees = [
  {
    id: 1,
    name: 'Mohammed Ahmed',
    position: 'Site Manager',
    department: 'Construction',
    salary: 8000,
    phone: '+966501234567',
    email: 'mohammed@company.com',
    status: 'active'
  }
];

let purchases = [];
let transactions = [];

// API Routes

// Projects
app.get('/api/projects', (req, res) => {
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const newProject = {
    id: projects.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  projects.push(newProject);
  res.status(201).json(newProject);
});

app.put('/api/projects/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...req.body, updatedAt: new Date().toISOString() };
    res.json(projects[index]);
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) {
    projects.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Project not found' });
  }
});

// Suppliers
app.get('/api/suppliers', (req, res) => {
  res.json(suppliers);
});

app.post('/api/suppliers', (req, res) => {
  const newSupplier = {
    id: suppliers.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  suppliers.push(newSupplier);
  res.status(201).json(newSupplier);
});

app.put('/api/suppliers/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = suppliers.findIndex(s => s.id === id);
  if (index !== -1) {
    suppliers[index] = { ...suppliers[index], ...req.body, updatedAt: new Date().toISOString() };
    res.json(suppliers[index]);
  } else {
    res.status(404).json({ error: 'Supplier not found' });
  }
});

app.delete('/api/suppliers/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = suppliers.findIndex(s => s.id === id);
  if (index !== -1) {
    suppliers.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Supplier not found' });
  }
});

// Categories
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const newCategory = {
    id: categories.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  categories.push(newCategory);
  res.status(201).json(newCategory);
});

// Inventory
app.get('/api/inventory', (req, res) => {
  res.json(inventory);
});

app.post('/api/inventory', (req, res) => {
  const newItem = {
    id: inventory.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  inventory.push(newItem);
  res.status(201).json(newItem);
});

// Employees
app.get('/api/employees', (req, res) => {
  res.json(employees);
});

app.post('/api/employees', (req, res) => {
  const newEmployee = {
    id: employees.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  employees.push(newEmployee);
  res.status(201).json(newEmployee);
});

// Purchases
app.get('/api/purchases', (req, res) => {
  res.json(purchases);
});

app.post('/api/purchases', (req, res) => {
  const newPurchase = {
    id: purchases.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  purchases.push(newPurchase);
  res.status(201).json(newPurchase);
});

// Transactions
app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

app.post('/api/transactions', (req, res) => {
  const newTransaction = {
    id: transactions.length + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  transactions.push(newTransaction);
  res.status(201).json(newTransaction);
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalSuppliers: suppliers.length,
    totalInventoryItems: inventory.length,
    totalEmployees: employees.length,
    totalRevenue: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    totalExpenses: purchases.reduce((sum, p) => sum + (p.total || 0), 0)
  });
});

// Reports
app.get('/api/reports', (req, res) => {
  res.json({
    projects,
    suppliers,
    inventory,
    employees,
    purchases,
    transactions
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;