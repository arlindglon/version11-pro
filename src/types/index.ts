// ============================================
// CORE INTERFACES
// ============================================

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  subCategory?: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice?: number;
  stock: number;
  minStock: number;
  reorderLevel: number;
  maxStock?: number;
  batchNumber?: string;
  expiryDate?: Date | string;
  manufactureDate?: Date | string;
  brand?: string;
  description?: string;
  image?: string;
  imageUrl?: string; // URL for product image from external source
  isActive: boolean;
  isFeatured: boolean;
  taxable: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProductBatch {
  id: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  expiryDate?: Date | string;
  manufactureDate?: Date | string;
  supplierId?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  creditLimit: number;
  due: number;
  totalPurchase: number;
  loyaltyPoints: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Supplier {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  balance: number;
  creditLimit: number;
  totalPurchase: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================
// SALES INTERFACES
// ============================================

export interface SaleItem {
  id?: string;
  saleId?: string;
  productId: string;
  productName?: string;
  name?: string; // For backward compatibility
  sku?: string;
  quantity: number;
  unitPrice?: number;
  price?: number; // For backward compatibility
  discount?: number;
  taxAmount?: number;
  totalPrice?: number;
  total?: number; // For backward compatibility
  batchNumber?: string;
  expiryDate?: Date | string;
  isReturned?: boolean;
  returnedQty?: number;
}

export interface SalePayment {
  id?: string;
  saleId?: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  createdAt?: Date | string;
}

// History entry for tracking changes
export interface HistoryEntry {
  id: string;
  action: 'create' | 'update' | 'payment' | 'return' | 'delete' | 'status_change';
  description: string;
  amount?: number;
  paymentMethod?: string;
  notes?: string;
  userId?: string;
  userName?: string;
  createdAt: Date | string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: Date | string;
  customerId?: string;
  customerName: string;
  subtotal: number;
  itemDiscount: number;
  cartDiscount: number;
  taxAmount: number;
  shippingCost: number;
  total: number;
  paid: number;
  due: number;
  changeAmount: number;
  paymentMethod: string;
  paymentStatus: 'Pending' | 'Partial' | 'Paid';
  status: 'Draft' | 'Hold' | 'Completed' | 'Returned' | 'Cancelled';
  notes?: string;
  branchId?: string;
  createdBy?: string;
  items: SaleItem[];
  payments?: SalePayment[];
  history?: HistoryEntry[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ReturnSaleItem {
  id?: string;
  returnSaleId?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason?: string;
}

export interface ReturnSale {
  id: string;
  originalSaleId: string;
  returnNumber: string;
  date: Date | string;
  subtotal: number;
  taxAmount: number;
  total: number;
  reason?: string;
  notes?: string;
  items: ReturnSaleItem[];
  createdAt: Date | string;
}

// ============================================
// PURCHASE INTERFACES
// ============================================

export interface PurchaseItem {
  id?: string;
  purchaseId?: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  batchNumber?: string;
  expiryDate?: Date | string;
  manufactureDate?: Date | string;
  salePrice?: number;
}

export interface PurchasePayment {
  id?: string;
  purchaseId?: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  createdAt?: Date | string;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  date: Date | string;
  supplierId?: string;
  supplierName: string;
  subtotal: number;
  discount: number;
  taxAmount: number;
  shippingCost: number;
  total: number;
  paid: number;
  balance: number;
  paymentStatus: 'Pending' | 'Partial' | 'Paid';
  status: 'Draft' | 'Ordered' | 'Received' | 'Partial' | 'Cancelled';
  notes?: string;
  branchId?: string;
  createdBy?: string;
  items: PurchaseItem[];
  payments?: PurchasePayment[];
  history?: HistoryEntry[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================
// INVENTORY INTERFACES
// ============================================

export interface StockAdjustment {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  type: 'increase' | 'decrease' | 'damage' | 'theft' | 'correction' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string;
  branchId?: string;
  userName?: string;
  createdBy?: string;
  createdAt: Date | string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromBranchId?: string;
  toBranchId?: string;
  date: Date | string;
  status: 'Pending' | 'InTransit' | 'Completed' | 'Cancelled';
  notes?: string;
  createdBy?: string;
  items: StockTransferItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StockTransferItem {
  id?: string;
  transferId?: string;
  productId: string;
  productName: string;
  quantity: number;
  status: string;
}

// ============================================
// ACCOUNTING INTERFACES
// ============================================

export interface Expense {
  id: string;
  date: Date | string;
  category: string;
  subCategory?: string;
  amount: number;
  description?: string;
  paymentMethod: string;
  reference?: string;
  attachment?: string;
  branchId?: string;
  createdBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Income {
  id: string;
  date: Date | string;
  category: string;
  amount: number;
  description?: string;
  paymentMethod: string;
  reference?: string;
  branchId?: string;
  createdBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CashBook {
  id: string;
  date: Date | string;
  type: 'cash_in' | 'cash_out';
  amount: number;
  balance: number;
  description?: string;
  reference?: string;
  referenceType?: string;
  referenceId?: string;
  branchId?: string;
  createdBy?: string;
  createdAt: Date | string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchName?: string;
  balance: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  transactions?: BankTransaction[];
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  date: Date | string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  balance: number;
  description?: string;
  reference?: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: Date | string;
}

// ============================================
// LEDGER INTERFACES
// ============================================

export interface CustomerLedger {
  id: string;
  customerId: string;
  date: Date | string;
  type: 'sale' | 'payment' | 'adjustment';
  amount: number;
  balance: number;
  reference?: string;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  createdAt: Date | string;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  date: Date | string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  createdAt: Date | string;
}

export interface SupplierLedger {
  id: string;
  supplierId: string;
  date: Date | string;
  type: 'purchase' | 'payment' | 'adjustment';
  amount: number;
  balance: number;
  reference?: string;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  createdAt: Date | string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  date: Date | string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  createdAt: Date | string;
}

// ============================================
// USER & BRANCH INTERFACES
// ============================================

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  username: string;
  password?: string;
  role: 'Master Admin' | 'Admin' | 'Manager' | 'Staff' | 'Seller' | 'Viewer' | string;
  branchId?: string;
  isActive: boolean;
  permissions?: Record<string, boolean>;
  lastLogin?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================
// SETTINGS INTERFACES
// ============================================

export interface AppSettings {
  id: string;
  shopName: string;
  shopLogo?: string;
  shopBannerImage?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopEmail?: string;
  shopWebsite?: string;
  shopBio?: string;
  shopServices?: string;
  taxId?: string;
  registrationNo?: string;
  loadingText?: string; // Custom loading screen text
  currency: string;
  currencySymbol: string;
  taxRate: number;
  taxEnabled: boolean;
  // Social Media Links
  facebookUrl?: string;
  instagramUrl?: string;
  whatsappNumber?: string;
  youtubeUrl?: string;
  // Business Hours
  openingHours?: string;
  // Bank Details
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  // Receipt Settings
  receiptHeader?: string;
  receiptFooter?: string;
  receiptWidth: number;
  showLogoOnReceipt: boolean;
  // Auto Print Settings
  autoPrintOnSale: boolean;
  autoPrintOnPurchase: boolean;
  autoPrintType: 'thermal' | 'full' | 'both';
  autoPrintPaperSize: 'thermal-58' | 'thermal-80' | 'a4';
  // POS Settings
  allowWalkInCustomer: boolean; // If false, customer selection is mandatory
  // Inventory Settings
  lowStockAlert: number;
  expiryAlertDays: number;
  // Payment Settings
  defaultPaymentMethod: string;
  multiBranch: boolean;
  // SMS Settings
  smsEnabled: boolean;
  smsApiKey?: string;
  smsSenderId?: string;
  // Email Settings
  emailEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  // System Settings
  theme: 'light' | 'dark';
  language: 'en' | 'bn';
  autoBackup: boolean;
  backupFrequency: string;
  lastBackup?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'mobile' | 'bank';
  icon?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================
// AUDIT LOG INTERFACE
// ============================================

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'void' | 'return';
  oldData?: string;
  newData?: string;
  userId?: string;
  userName?: string;
  branchId?: string;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
  createdAt: Date | string;
}

// ============================================
// ACTIVITY LOG INTERFACE (Enhanced Version Control)
// ============================================

export interface ActivityLog {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'restore' | 'void';
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  changes?: Record<string, { old: unknown; new: unknown; type: string }>;
  versionNumber: number;
  userId?: string;
  userName?: string;
  userRole?: string;
  branchId?: string;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  notes?: string;
  restoredFromId?: string;
  restoredById?: string;
  restoredByName?: string;
  restoredAt?: Date | string;
  createdAt: Date | string;
}

// ============================================
// HELD/DRAFT INTERFACES
// ============================================

export interface HeldSale {
  id: string;
  holdNumber: string;
  data: string;
  branchId?: string;
  createdBy?: string;
  createdAt: Date | string;
}

export interface DraftPurchase {
  id: string;
  draftNumber: string;
  data: string;
  branchId?: string;
  createdBy?: string;
  createdAt: Date | string;
}

// ============================================
// NOTIFICATION INTERFACE
// ============================================

export interface Notification {
  id: string;
  type: 'low_stock' | 'expiry' | 'payment_due' | 'system';
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  branchId?: string;
  createdAt: Date | string;
}

// ============================================
// VIEW TYPES
// ============================================

export type View = 
  | 'dashboard' 
  | 'inventory' 
  | 'pos' 
  | 'pos-scanner' 
  | 'sales' 
  | 'purchases' 
  | 'customers' 
  | 'suppliers' 
  | 'reports' 
  | 'accounting' 
  | 'settings'
  | 'activity-logs'
  | 'cash-register'
  | 'sales-return'
  | 'party-ledger'
  | 'support';

// ============================================
// DEFAULT DATA
// ============================================

export const DEFAULT_SETTINGS: Partial<AppSettings> = {
  shopName: 'Dokan Enterprise',
  shopAddress: '123 Business Avenue, Suite 100, City Center',
  shopPhone: '+880 1234 567890',
  shopEmail: 'info@dokan.com',
  currency: 'BDT',
  currencySymbol: '৳',
  taxRate: 5,
  taxEnabled: false,
  receiptFooter: 'Thank you for shopping with us!',
  lowStockAlert: 10,
  expiryAlertDays: 30,
  defaultPaymentMethod: 'Cash',
  allowWalkInCustomer: true, // By default, walk-in customer is allowed
  theme: 'light',
  language: 'en',
};

export const DEFAULT_CATEGORIES = [
  'Electronics',
  'Grocery',
  'Beverages',
  'Fashion',
  'Medicine',
  'Cosmetics',
  'Stationery',
  'Household',
  'Other'
];

export const EXPENSE_CATEGORIES = [
  'Rent',
  'Utilities',
  'Salaries',
  'Transport',
  'Marketing',
  'Maintenance',
  'Office Supplies',
  'Insurance',
  'Taxes',
  'Other'
];

export const INCOME_CATEGORIES = [
  'Sales',
  'Service',
  'Interest',
  'Rental',
  'Commission',
  'Other Income'
];

export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', type: 'cash', icon: '💵' },
  { id: 'card', name: 'Card', type: 'card', icon: '💳' },
  { id: 'bkash', name: 'bKash', type: 'mobile', icon: '📱' },
  { id: 'nagad', name: 'Nagad', type: 'mobile', icon: '📱' },
  { id: 'bank', name: 'Bank Transfer', type: 'bank', icon: '🏦' },
];

// ============================================
// PRINT TEMPLATE INTERFACES
// ============================================

export type PrintTemplateType = 'invoice' | 'purchase' | 'quotation' | 'receipt' | 'challan';
export type PrintPaperSize = 'thermal-58' | 'thermal-80' | 'a4' | 'a5' | 'letter';

export interface PrintTemplateElement {
  id: string;
  type: 'text' | 'image' | 'line' | 'spacer' | 'table' | 'barcode' | 'qrcode' | 'html';
  content?: string;
  style?: {
    fontSize?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    border?: string;
    width?: string;
    height?: string;
  };
  visible?: boolean;
  condition?: string; // Show/hide based on condition
}

export interface PrintTemplate {
  id: string;
  name: string;
  type: PrintTemplateType;
  paperSize: PrintPaperSize;
  isDefault: boolean;
  isActive: boolean;
  elements: PrintTemplateElement[];
  customCSS?: string;
  header?: string; // Custom header HTML
  footer?: string; // Custom footer HTML
  width: number; // in mm
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PrintTemplateVariable {
  key: string;
  label: string;
  description: string;
  example: string;
  category: 'shop' | 'invoice' | 'customer' | 'items' | 'payment' | 'other';
}

// Available template variables
export const TEMPLATE_VARIABLES: PrintTemplateVariable[] = [
  // Shop info
  { key: '{{shop_name}}', label: 'Shop Name', description: 'Your shop name', example: 'Dokan Enterprise', category: 'shop' },
  { key: '{{shop_address}}', label: 'Shop Address', description: 'Full shop address', example: '123 Business St, City', category: 'shop' },
  { key: '{{shop_phone}}', label: 'Shop Phone', description: 'Shop phone number', example: '+880 1234 567890', category: 'shop' },
  { key: '{{shop_email}}', label: 'Shop Email', description: 'Shop email address', example: 'info@dokan.com', category: 'shop' },
  { key: '{{shop_logo}}', label: 'Shop Logo', description: 'Shop logo image URL', example: '/logo.svg', category: 'shop' },
  { key: '{{tax_id}}', label: 'Tax ID', description: 'Tax identification number', example: 'TIN-123456', category: 'shop' },
  
  // Invoice info
  { key: '{{invoice_number}}', label: 'Invoice Number', description: 'Invoice/Receipt number', example: 'INV-0001', category: 'invoice' },
  { key: '{{invoice_date}}', label: 'Invoice Date', description: 'Date of invoice', example: '15/01/2025', category: 'invoice' },
  { key: '{{invoice_time}}', label: 'Invoice Time', description: 'Time of invoice', example: '14:30:25', category: 'invoice' },
  { key: '{{invoice_datetime}}', label: 'Date & Time', description: 'Full date and time', example: '15/01/2025 14:30', category: 'invoice' },
  
  // Customer info
  { key: '{{customer_name}}', label: 'Customer Name', description: 'Customer name', example: 'John Doe', category: 'customer' },
  { key: '{{customer_phone}}', label: 'Customer Phone', description: 'Customer phone', example: '+880 1712345678', category: 'customer' },
  { key: '{{customer_address}}', label: 'Customer Address', description: 'Customer address', example: '456 Customer Rd', category: 'customer' },
  
  // Items
  { key: '{{items_table}}', label: 'Items Table', description: 'Full items table', example: 'Product | Qty | Price | Total', category: 'items' },
  { key: '{{items_count}}', label: 'Items Count', description: 'Total number of items', example: '5', category: 'items' },
  { key: '{{total_quantity}}', label: 'Total Quantity', description: 'Total quantity', example: '12', category: 'items' },
  
  // Payment info
  { key: '{{subtotal}}', label: 'Subtotal', description: 'Subtotal amount', example: '৳1,500.00', category: 'payment' },
  { key: '{{discount}}', label: 'Discount', description: 'Discount amount', example: '৳100.00', category: 'payment' },
  { key: '{{tax}}', label: 'Tax', description: 'Tax amount', example: '৳75.00', category: 'payment' },
  { key: '{{total}}', label: 'Total', description: 'Grand total', example: '৳1,475.00', category: 'payment' },
  { key: '{{paid}}', label: 'Paid', description: 'Amount paid', example: '৳1,500.00', category: 'payment' },
  { key: '{{due}}', label: 'Due', description: 'Amount due', example: '৳0.00', category: 'payment' },
  { key: '{{change}}', label: 'Change', description: 'Change amount', example: '৳25.00', category: 'payment' },
  { key: '{{payment_method}}', label: 'Payment Method', description: 'Payment method used', example: 'Cash', category: 'payment' },
  { key: '{{payment_status}}', label: 'Payment Status', description: 'Paid/Pending/Partial', example: 'Paid', category: 'payment' },
  
  // Other
  { key: '{{notes}}', label: 'Notes', description: 'Invoice notes', example: 'Thank you!', category: 'other' },
  { key: '{{footer_text}}', label: 'Footer Text', description: 'Custom footer message', example: 'Visit again!', category: 'other' },
  { key: '{{barcode}}', label: 'Barcode', description: 'Invoice barcode', example: '| | | | |', category: 'other' },
  { key: '{{qrcode}}', label: 'QR Code', description: 'Invoice QR code', example: '[QR]', category: 'other' },
  { key: '{{served_by}}', label: 'Served By', description: 'Salesman name', example: 'Admin', category: 'other' },
];

// Default thermal template (58mm)
export const DEFAULT_THERMAL_TEMPLATE: Partial<PrintTemplate> = {
  name: 'Thermal Receipt (58mm)',
  type: 'invoice',
  paperSize: 'thermal-58',
  width: 58,
  isDefault: true,
  isActive: true,
  margin: { top: 2, right: 2, bottom: 2, left: 2 },
  elements: [
    { id: '1', type: 'text', content: '{{shop_name}}', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'center' } },
    { id: '2', type: 'text', content: '{{shop_address}}', style: { fontSize: '10px', textAlign: 'center' } },
    { id: '3', type: 'text', content: '{{shop_phone}}', style: { fontSize: '10px', textAlign: 'center' } },
    { id: '4', type: 'line', style: { padding: '5px 0' } },
    { id: '5', type: 'text', content: 'Invoice: {{invoice_number}}', style: { fontSize: '10px', textAlign: 'left' } },
    { id: '6', type: 'text', content: 'Date: {{invoice_datetime}}', style: { fontSize: '10px', textAlign: 'left' } },
    { id: '7', type: 'text', content: 'Customer: {{customer_name}}', style: { fontSize: '10px', textAlign: 'left' } },
    { id: '8', type: 'line', style: { padding: '5px 0' } },
    { id: '9', type: 'table', content: '{{items_table}}' },
    { id: '10', type: 'line', style: { padding: '5px 0' } },
    { id: '11', type: 'text', content: 'Subtotal: {{subtotal}}', style: { fontSize: '10px', textAlign: 'right' } },
    { id: '12', type: 'text', content: 'Discount: {{discount}}', style: { fontSize: '10px', textAlign: 'right' } },
    { id: '13', type: 'text', content: 'Tax: {{tax}}', style: { fontSize: '10px', textAlign: 'right' } },
    { id: '14', type: 'text', content: 'TOTAL: {{total}}', style: { fontSize: '12px', fontWeight: 'bold', textAlign: 'right' } },
    { id: '15', type: 'line', style: { padding: '5px 0' } },
    { id: '16', type: 'text', content: 'Paid: {{paid}}', style: { fontSize: '10px', textAlign: 'right' } },
    { id: '17', type: 'text', content: 'Change: {{change}}', style: { fontSize: '10px', textAlign: 'right' } },
    { id: '18', type: 'spacer', style: { height: '10px' } },
    { id: '19', type: 'text', content: '{{footer_text}}', style: { fontSize: '10px', textAlign: 'center' } },
    { id: '20', type: 'text', content: 'Served by: {{served_by}}', style: { fontSize: '9px', textAlign: 'center' } },
  ],
};

// Default A4 template
export const DEFAULT_A4_TEMPLATE: Partial<PrintTemplate> = {
  name: 'Invoice (A4)',
  type: 'invoice',
  paperSize: 'a4',
  width: 210,
  isDefault: false,
  isActive: true,
  margin: { top: 10, right: 10, bottom: 10, left: 10 },
};
