const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

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
let invoices = [
  {
    id: 1,
    projectId: 1,
    invoiceNumber: 'INV-2024-001',
    clientName: 'John Doe',
    clientAddress: '123 King Fahd Road, Riyadh',
    items: [
      {
        description: 'Construction project mobilization',
        quantity: 1,
        unitPrice: 50000,
        total: 50000
      }
    ],
    subtotal: 50000,
    tax: 7500,
    total: 57500,
    totalAmount: 57500,
    issueDate: '2024-01-10',
    dueDate: '2024-01-20',
    status: 'paid',
    createdAt: '2024-01-10T00:00:00.000Z',
    updatedAt: '2024-01-10T00:00:00.000Z'
  }
];
let employeePaymentStatuses = [];
let generatedReports = [
  {
    id: 1,
    name: 'Quarterly Financial Summary',
    type: 'Financial',
    description: 'Revenue, expenses, and profitability overview for the latest quarter.',
    generatedAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Project Performance Report',
    type: 'Project',
    description: 'Project completion, status breakdown, and budget utilization.',
    generatedAt: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Workforce Utilization Report',
    type: 'Workforce',
    description: 'Employee allocation, staffing levels, and payroll snapshot.',
    generatedAt: new Date().toISOString()
  }
];

// Settings mock data
let users = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    username: 'admin',
    email: 'admin@company.com',
    phone: '+966501234567',
    avatar: null,
    role: 'administrator',
    password: 'admin', // In real app, this would be properly hashed
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    firstName: 'Demo',
    lastName: 'User',
    username: 'demo',
    email: 'demo@company.com',
    phone: '+966500000000',
    avatar: null,
    role: 'user',
    password: 'demo',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

let company = {
  id: 1,
  name: 'Diouf Al-Sharq Construction',
  logo: null,
  registrationId: 'REG123456789',
  email: 'info@dioufalsharq.com',
  phone: '+966112345678',
  website: 'https://dioufalsharq.com',
  address: {
    street: '123 King Fahd Road',
    city: 'Riyadh',
    state: 'Riyadh Province',
    zip: '12345',
    country: 'Saudi Arabia'
  },
  currency: 'SAR',
  timezone: 'Asia/Riyadh',
  fiscalYearStart: 'January',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

let userPreferences = {
  userId: 1,
  theme: 'system',
  primaryColor: 'blue',
  sidebarDensity: 'comfortable',
  cornerRadius: 'md',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

let systemSettings = {
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  numberFormat: 'en-US',
  timezone: 'Asia/Riyadh',
  notifications: {
    email: true,
    sms: false,
    push: true
  },
  updatedAt: '2024-01-01T00:00:00.000Z'
};

const getNumericId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeInvoiceStatus = (status) => {
  const allowed = new Set(['draft', 'sent', 'paid', 'overdue']);
  const normalized = String(status || 'draft').toLowerCase();
  return allowed.has(normalized) ? normalized : 'draft';
};

const buildEmployeePaymentSummary = (month, year) => {
  const now = new Date();
  const selectedDate = new Date(year, month - 1, 1);
  const defaultStatus = selectedDate < new Date(now.getFullYear(), now.getMonth(), 1)
    ? 'overdue'
    : 'pending';

  return employees.map((employee) => {
    const employeeId = String(employee.id);
    const override = employeePaymentStatuses.find((entry) =>
      entry.employeeId === employeeId &&
      entry.month === month &&
      entry.year === year
    );
    const amount = Number(override?.amount ?? employee.salary ?? 0);
    const status = override?.status || defaultStatus;

    return {
      employeeId,
      employeeName: employee.name,
      totalPayments: 1,
      paidPayments: status === 'paid' ? 1 : 0,
      pendingPayments: status === 'pending' ? 1 : 0,
      overduePayments: status === 'overdue' ? 1 : 0,
      totalAmount: amount,
      paidAmount: status === 'paid' ? amount : 0,
      pendingAmount: status === 'pending' ? amount : 0,
      overdueAmount: status === 'overdue' ? amount : 0
    };
  });
};

const buildMonthlyReport = (month, year) => {
  const summary = buildEmployeePaymentSummary(month, year);

  return {
    id: `${year}-${String(month).padStart(2, '0')}`,
    month,
    year,
    totalEmployees: summary.length,
    totalPayments: summary.length,
    totalAmount: summary.reduce((sum, item) => sum + item.totalAmount, 0),
    paidAmount: summary.reduce((sum, item) => sum + item.paidAmount, 0),
    pendingAmount: summary.reduce((sum, item) => sum + item.pendingAmount, 0),
    overdueAmount: summary.reduce((sum, item) => sum + item.overdueAmount, 0),
    createdAt: new Date().toISOString()
  };
};

const buildDataUrlSvg = (label, fill) => {
  const safeLabel = String(label || '').replace(/[&<>"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="100%" height="100%" fill="${fill}"/><text x="50%" y="50%" fill="#ffffff" font-family="Arial, sans-serif" font-size="72" font-weight="700" text-anchor="middle" dominant-baseline="middle">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

// Helper functions for authentication and validation
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    return 'Password must contain at least one letter and one number';
  }
  return null;
};

const validateUsername = (username, currentUserId = null) => {
  if (!username || username.length < 3 || username.length > 24) {
    return 'Username must be between 3 and 24 characters';
  }
  if (/\s/.test(username)) {
    return 'Username cannot contain spaces';
  }
  const existingUser = users.find(u => u.username === username && u.id !== currentUserId);
  if (existingUser) {
    return 'Username is already taken';
  }
  return null;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // Demo mode: allow requests without enforcing a real JWT exchange.
  if (authHeader && !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }
  
  // In a real app, we would extract the userId from the token
  // For this demo, we'll try to get it from a header or default to 1
  const userId = parseInt(req.headers['x-user-id'] || '1');
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({ code: 'USER_NOT_FOUND', message: 'User not found' });
  }
  
  req.user = user;
  req.userId = user.id;
  next();
};

const checkPermission = (permissionKey) => {
  return (req, res, next) => {
    const userRole = req.user.role?.toLowerCase() || '';
    const allowedRoles = {
      canChangeInvoiceDate: ['administrator', 'super_admin'],
      canEditInvoices: ['administrator', 'super_admin', 'user'],
      canDeleteInvoices: ['administrator', 'super_admin'],
      canEditSettings: ['administrator', 'super_admin'],
    };

    const rolesForPermission = allowedRoles[permissionKey];
    if (!rolesForPermission || !rolesForPermission.includes(userRole)) {
      return res.status(403).json({ 
        code: 'FORBIDDEN', 
        message: `You do not have permission to perform this action (${permissionKey})` 
      });
    }
    next();
  };
};

const requirePassword = (req, res, next) => {
  const { currentPassword } = req.body;
  if (!currentPassword) {
    return res.status(400).json({ 
      code: 'MISSING_PASSWORD', 
      message: 'Current password is required for this operation' 
    });
  }
  // In a real app, verify the password hash here
  if (currentPassword !== 'currentpassword123') {
    return res.status(401).json({ 
      code: 'INVALID_PASSWORD', 
      message: 'Current password is incorrect' 
    });
  }
  next();
};

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

// Invoices
app.get('/api/invoices', authenticateUser, (req, res) => {
  res.json(invoices);
});

app.post('/api/invoices', authenticateUser, (req, res) => {
  const timestamp = new Date().toISOString();
  const payload = req.body || {};
  
  // Permission check for invoiceDate if it's different from current date
  const isChangingDate = payload.invoiceDate && payload.invoiceDate !== timestamp.split('T')[0];
  if (isChangingDate) {
    const userRole = req.user.role?.toLowerCase() || '';
    if (!['administrator', 'super_admin'].includes(userRole)) {
      return res.status(403).json({ 
        code: 'FORBIDDEN', 
        message: 'You do not have permission to manually set the invoice date' 
      });
    }
  }

  const newInvoice = {
    id: invoices.length + 1,
    projectId: getNumericId(payload.projectId) ?? undefined,
    invoiceNumber: payload.invoiceNumber || `INV-${Date.now()}`,
    clientName: payload.clientName || 'Unnamed Client',
    clientEmail: payload.clientEmail || '',
    clientPhone: payload.clientPhone || '',
    clientAddress: payload.clientAddress || '',
    items: Array.isArray(payload.items) ? payload.items : [],
    subtotal: Number(payload.subtotal || 0),
    tax: Number(payload.tax || payload.vatAmount || 0),
    taxRate: Number(payload.taxRate || 15),
    total: Number(payload.total || payload.totalAmount || 0),
    totalAmount: Number(payload.totalAmount || payload.total || 0),
    issueDate: payload.issueDate || timestamp,
    dueDate: payload.dueDate || timestamp,
    invoiceDate: payload.invoiceDate || timestamp.split('T')[0],
    status: normalizeInvoiceStatus(payload.status),
    notes: payload.notes || '',
    createdAt: timestamp,
    updatedAt: timestamp
  };
  invoices.push(newInvoice);
  res.status(201).json(newInvoice);
});

app.put('/api/invoices/:id', authenticateUser, (req, res) => {
  const id = parseInt(req.params.id);
  const index = invoices.findIndex((invoice) => invoice.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const payload = req.body || {};
  
  // Permission check for invoiceDate change
  if (payload.invoiceDate && payload.invoiceDate !== invoices[index].invoiceDate) {
    const userRole = req.user.role?.toLowerCase() || '';
    if (!['administrator', 'super_admin'].includes(userRole)) {
      return res.status(403).json({ 
        code: 'FORBIDDEN', 
        message: 'You do not have permission to manually change the invoice date' 
      });
    }
  }

  invoices[index] = {
    ...invoices[index],
    ...payload,
    status: normalizeInvoiceStatus(payload.status || invoices[index].status),
    updatedAt: new Date().toISOString()
  };

  res.json(invoices[index]);
});

app.delete('/api/invoices/:id', authenticateUser, checkPermission('canDeleteInvoices'), (req, res) => {
  const id = parseInt(req.params.id);
  const index = invoices.findIndex((invoice) => invoice.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  invoices.splice(index, 1);
  res.status(204).send();
});

// Monthly payment analytics
app.get('/api/monthly-reports/:month/:year', (req, res) => {
  const month = parseInt(req.params.month, 10);
  const year = parseInt(req.params.year, 10);
  res.json(buildMonthlyReport(month, year));
});

app.get('/api/employee-payment-summary/:month/:year', (req, res) => {
  const month = parseInt(req.params.month, 10);
  const year = parseInt(req.params.year, 10);
  res.json(buildEmployeePaymentSummary(month, year));
});

app.post('/api/employee-payment-status', (req, res) => {
  const month = parseInt(req.body?.month, 10);
  const year = parseInt(req.body?.year, 10);
  const employeeId = String(req.body?.employeeId || '');
  const amount = Number(req.body?.amount ?? 0);
  const now = new Date();
  const selectedDate = new Date(year, month - 1, 1);
  const status = req.body?.isPaid
    ? 'paid'
    : (selectedDate < new Date(now.getFullYear(), now.getMonth(), 1) ? 'overdue' : 'pending');

  const existingIndex = employeePaymentStatuses.findIndex((entry) =>
    entry.employeeId === employeeId &&
    entry.month === month &&
    entry.year === year
  );

  const record = {
    employeeId,
    month,
    year,
    amount,
    paidDate: req.body?.paidDate || null,
    status,
    updatedAt: new Date().toISOString()
  };

  if (existingIndex === -1) {
    employeePaymentStatuses.push(record);
  } else {
    employeePaymentStatuses[existingIndex] = {
      ...employeePaymentStatuses[existingIndex],
      ...record
    };
  }

  res.json({ success: true, record });
});

// Settings API Routes

// User profile endpoints
app.get('/api/users/me', authenticateUser, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ code: 'USER_NOT_FOUND', message: 'User not found' });
  }
  
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.patch('/api/users/me', authenticateUser, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ code: 'USER_NOT_FOUND', message: 'User not found' });
  }
  
  const { fullName, phone, avatar } = req.body;
  const fieldErrors = {};
  
  // Validate phone if provided
  if (phone !== undefined) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (phone && !phoneRegex.test(phone)) {
      fieldErrors.phone = 'Please enter a valid phone number';
    }
  }
  
  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({ 
      code: 'VALIDATION_ERROR', 
      message: 'Validation failed', 
      fieldErrors 
    });
  }
  
  // Update user
  if (fullName !== undefined) {
    const [firstName, ...lastNameParts] = fullName.split(' ');
    user.firstName = firstName || '';
    user.lastName = lastNameParts.join(' ') || '';
  }
  if (phone !== undefined) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;
  user.updatedAt = new Date().toISOString();
  
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.patch('/api/users/me/username', authenticateUser, requirePassword, (req, res) => {
  const { newUsername } = req.body;
  const user = users.find(u => u.id === req.userId);
  
  if (!user) {
    return res.status(404).json({ code: 'USER_NOT_FOUND', message: 'User not found' });
  }
  
  const usernameError = validateUsername(newUsername, req.userId);
  if (usernameError) {
    return res.status(400).json({ 
      code: 'VALIDATION_ERROR', 
      message: usernameError,
      fieldErrors: { username: usernameError }
    });
  }
  
  user.username = newUsername;
  user.updatedAt = new Date().toISOString();
  
  // In a real app, generate new JWT token here
  const { password, ...userWithoutPassword } = user;
  res.json({ 
    user: userWithoutPassword, 
    token: 'new-jwt-token-here',
    message: 'Username updated successfully'
  });
});

app.patch('/api/users/me/password', authenticateUser, requirePassword, (req, res) => {
  const { newPassword } = req.body;
  const user = users.find(u => u.id === req.userId);
  
  if (!user) {
    return res.status(404).json({ code: 'USER_NOT_FOUND', message: 'User not found' });
  }
  
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return res.status(400).json({ 
      code: 'VALIDATION_ERROR', 
      message: passwordError,
      fieldErrors: { password: passwordError }
    });
  }
  
  // In a real app, hash the password here
  user.password = newPassword;
  user.updatedAt = new Date().toISOString();
  
  res.json({ message: 'Password updated successfully' });
});

app.post('/api/users/me/avatar', authenticateUser, (req, res) => {
  const user = users.find((entry) => entry.id === req.userId);
  if (!user) {
    return res.status(404).json({ code: 'USER_NOT_FOUND', message: 'User not found' });
  }

  const avatarUrl = buildDataUrlSvg(
    `${(user.firstName?.[0] || 'U')}${(user.lastName?.[0] || '')}`.toUpperCase(),
    '#2563eb'
  );
  user.avatar = avatarUrl;
  user.updatedAt = new Date().toISOString();
  res.json({ avatarUrl });
});

// Company endpoints
app.get('/api/company', authenticateUser, (req, res) => {
  res.json(company);
});

app.put('/api/company', authenticateUser, (req, res) => {
  const { name, registrationId, email, phone, website, address, currency, timezone, fiscalYearStart, logo } = req.body;
  const fieldErrors = {};
  
  // Validate required fields
  if (!name || name.trim().length < 2) {
    fieldErrors.name = 'Company name must be at least 2 characters long';
  }
  
  if (email) {
    const emailError = validateEmail(email);
    if (emailError) fieldErrors.email = emailError;
  }
  
  if (phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      fieldErrors.phone = 'Please enter a valid phone number';
    }
  }
  
  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({ 
      code: 'VALIDATION_ERROR', 
      message: 'Validation failed', 
      fieldErrors 
    });
  }
  
  // Update company
  Object.assign(company, {
    name: name || company.name,
    registrationId: registrationId || company.registrationId,
    email: email || company.email,
    phone: phone || company.phone,
    website: website || company.website,
    address: address || company.address,
    currency: currency || company.currency,
    timezone: timezone || company.timezone,
    fiscalYearStart: fiscalYearStart || company.fiscalYearStart,
    logo: logo !== undefined ? logo : company.logo,
    updatedAt: new Date().toISOString()
  });
  
  res.json(company);
});

app.post('/api/company/logo', authenticateUser, (req, res) => {
  const logoUrl = buildDataUrlSvg(
    (company.name || 'DS')
      .split(/\s+/)
      .map((part) => part[0] || '')
      .join('')
      .slice(0, 3)
      .toUpperCase(),
    '#16233f'
  );
  company.logo = logoUrl;
  company.updatedAt = new Date().toISOString();
  res.json({ logoUrl });
});

// User preferences endpoints
// GET endpoint to fetch user preferences
app.get('/api/user/preferences', authenticateUser, (req, res) => {
  res.json(userPreferences);
});

// PUT endpoint to update user preferences (expected by frontend)
app.put('/api/user/preferences', authenticateUser, (req, res) => {
  const { theme, primaryColor, sidebarDensity, cornerRadius } = req.body;
  
  // Validate theme
  if (theme && !['light', 'dark', 'system'].includes(theme)) {
    return res.status(400).json({ 
      code: 'VALIDATION_ERROR', 
      message: 'Invalid theme value',
      fieldErrors: { theme: 'Theme must be light, dark, or system' }
    });
  }
  
  // Validate primary color
  const validColors = ['blue', 'indigo', 'emerald', 'rose', 'orange', 'violet'];
  if (primaryColor && !validColors.includes(primaryColor)) {
    return res.status(400).json({ 
      code: 'VALIDATION_ERROR', 
      message: 'Invalid primary color',
      fieldErrors: { primaryColor: 'Invalid color selection' }
    });
  }
  
  // Update preferences
  Object.assign(userPreferences, {
    theme: theme || userPreferences.theme,
    primaryColor: primaryColor || userPreferences.primaryColor,
    sidebarDensity: sidebarDensity || userPreferences.sidebarDensity,
    cornerRadius: cornerRadius || userPreferences.cornerRadius,
    updatedAt: new Date().toISOString()
  });
  
  res.json(userPreferences);
});

// Legacy PATCH endpoint (keeping for backward compatibility)
app.patch('/api/users/me/preferences', authenticateUser, (req, res) => {
  const { theme, primaryColor, sidebarDensity, cornerRadius } = req.body;
  
  // Validate theme
  if (theme && !['light', 'dark', 'system'].includes(theme)) {
    return res.status(400).json({ 
      code: 'VALIDATION_ERROR', 
      message: 'Invalid theme value',
      fieldErrors: { theme: 'Theme must be light, dark, or system' }
    });
  }
  
  // Validate primary color
  const validColors = ['blue', 'indigo', 'emerald', 'rose', 'orange', 'violet'];
  if (primaryColor && !validColors.includes(primaryColor)) {
    return res.status(400).json({ 
      code: 'VALIDATION_ERROR', 
      message: 'Invalid primary color',
      fieldErrors: { primaryColor: 'Invalid color selection' }
    });
  }
  
  // Update preferences
  Object.assign(userPreferences, {
    theme: theme || userPreferences.theme,
    primaryColor: primaryColor || userPreferences.primaryColor,
    sidebarDensity: sidebarDensity || userPreferences.sidebarDensity,
    cornerRadius: cornerRadius || userPreferences.cornerRadius,
    updatedAt: new Date().toISOString()
  });
  
  res.json(userPreferences);
});

// System settings endpoints
app.get('/api/system/settings', authenticateUser, (req, res) => {
  res.json(systemSettings);
});

app.put('/api/system/settings', authenticateUser, (req, res) => {
  const { language, dateFormat, numberFormat, timezone, notifications } = req.body;
  
  // Update system settings
  Object.assign(systemSettings, {
    language: language || systemSettings.language,
    dateFormat: dateFormat || systemSettings.dateFormat,
    numberFormat: numberFormat || systemSettings.numberFormat,
    timezone: timezone || systemSettings.timezone,
    notifications: notifications || systemSettings.notifications,
    updatedAt: new Date().toISOString()
  });
  
  res.json(systemSettings);
});

app.post('/api/system/export', authenticateUser, (req, res) => {
  const { format } = req.body;
  
  if (!['csv', 'json'].includes(format)) {
    return res.status(400).json({ 
      code: 'INVALID_FORMAT', 
      message: 'Export format must be csv or json' 
    });
  }
  
  const exportData = {
    projects,
    suppliers,
    inventory,
    employees,
    purchases,
    transactions,
    exportedAt: new Date().toISOString()
  };
  
  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="data-export.json"');
    res.json(exportData);
  } else {
    // Simple CSV export (in a real app, use a proper CSV library)
    let csv = 'Type,ID,Name,Status,Created\n';
    projects.forEach(p => csv += `Project,${p.id},${p.name},${p.status},${p.createdAt}\n`);
    suppliers.forEach(s => csv += `Supplier,${s.id},${s.name},${s.status},${s.createdAt}\n`);
    employees.forEach(e => csv += `Employee,${e.id},${e.name},${e.status},${e.createdAt}\n`);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="data-export.csv"');
    res.send(csv);
  }
});

app.post('/api/system/cache/clear', authenticateUser, (req, res) => {
  // In a real app, clear actual cache here
  res.json({ message: 'Cache cleared successfully', clearedAt: new Date().toISOString() });
});

app.post('/api/system/backup', authenticateUser, (req, res) => {
  // In a real app, create actual backup here
  res.json({ 
    message: 'Backup created successfully', 
    backupId: `backup_${Date.now()}`,
    createdAt: new Date().toISOString() 
  });
});

app.post('/api/fix-fake-data', authenticateUser, (req, res) => {
  res.json({
    success: true,
    deletedRecords: {
      projects: 0,
      employees: 0,
      purchases: 0,
      transactions: 0,
      invoices: 0
    }
  });
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
  res.json(generatedReports);
});

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Readiness check
app.get('/api/readyz', (req, res) => {
  // Check if all dependencies are ready (database, external services, etc.)
  // For now, just return ready since we're using in-memory data
  res.status(200).json({ 
    status: 'ready', 
    message: 'Service is ready to accept requests',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'ok', // Would check actual DB connection in real app
      memory: 'ok'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Start server only when running directly. Vercel imports the app as a handler.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
