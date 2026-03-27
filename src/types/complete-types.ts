// ============================================
// COMPLETE PRODUCTION TYPES
// All 469+ Features Type Definitions
// ============================================

// ============================================
// 1. MULTI-BRANCH TYPES
// ============================================

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  logoUrl?: string;
  isActive: boolean;
  isDefault: boolean;
  openingTime?: string;
  closingTime?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BranchSettings {
  id: string;
  branchId: string;
  settingKey: string;
  settingValue: Record<string, unknown>;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromBranchId: string;
  toBranchId: string;
  status: 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled' | 'rejected';
  requestedBy?: string;
  approvedBy?: string;
  notes?: string;
  items: StockTransferItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
  completedAt?: Date | string;
}

export interface StockTransferItem {
  id: string;
  transferId: string;
  productId: string;
  productName?: string;
  quantity: number;
  receivedQuantity: number;
  notes?: string;
}

// ============================================
// 2. AUTHENTICATION TYPES
// ============================================

export interface LoginHistory {
  id: string;
  userId: string;
  loginAt: Date | string;
  logoutAt?: Date | string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, unknown>;
  location?: string;
  status: 'success' | 'failed' | 'blocked';
  failureReason?: string;
  sessionId?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  deviceInfo?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: Date | string;
  expiresAt?: Date | string;
  lastActivityAt: Date | string;
}

export interface UserBranchAccess {
  id: string;
  userId: string;
  branchId: string;
  canAccess: boolean;
  createdAt: Date | string;
}

// ============================================
// 3. INVENTORY TYPES
// ============================================

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  isExternalUrl: boolean;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date | string;
}

export interface ProductBatch {
  id: string;
  productId: string;
  branchId?: string;
  batchNumber: string;
  quantity: number;
  availableQuantity: number;
  purchasePrice: number;
  salePrice?: number;
  manufactureDate?: Date | string;
  expiryDate?: Date | string;
  supplierId?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  productId: string;
  branchId?: string;
  adjustmentType: 'increase' | 'decrease' | 'damage' | 'theft' | 'correction' | 'stocktake';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  approvedBy?: string;
  approvedAt?: Date | string;
  createdBy?: string;
  createdAt: Date | string;
}

export interface StockAlert {
  id: string;
  productId: string;
  branchId?: string;
  alertType: 'low_stock' | 'over_stock' | 'negative_stock' | 'expiry_warning' | 'expired';
  message: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date | string;
  createdAt: Date | string;
}

export interface StocktakeSession {
  id: string;
  sessionNumber: string;
  branchId?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  startedAt?: Date | string;
  completedAt?: Date | string;
  createdBy?: string;
  notes?: string;
  items?: StocktakeItem[];
  createdAt: Date | string;
}

export interface StocktakeItem {
  id: string;
  sessionId: string;
  productId: string;
  productName?: string;
  systemQuantity: number;
  countedQuantity?: number;
  variance?: number;
  varianceValue?: number;
  notes?: string;
  countedBy?: string;
  countedAt?: Date | string;
}

export interface ProductBundle {
  id: string;
  name: string;
  description?: string;
  bundlePrice: number;
  discountPercentage?: number;
  isActive: boolean;
  items?: BundleItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BundleItem {
  id: string;
  bundleId: string;
  productId: string;
  productName?: string;
  quantity: number;
  createdAt: Date | string;
}

// ============================================
// 4. SALES TYPES
// ============================================

export interface SalesReturn {
  id: string;
  returnNumber: string;
  originalSaleId?: string;
  branchId?: string;
  returnDate: Date | string;
  subtotal: number;
  taxAmount?: number;
  total: number;
  refundMethod?: string;
  refundStatus: 'pending' | 'processed' | 'completed';
  reason?: string;
  notes?: string;
  items?: SalesReturnItem[];
  processedBy?: string;
  createdAt: Date | string;
}

export interface SalesReturnItem {
  id: string;
  returnId: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  reason?: string;
}

export interface HeldSale {
  id: string;
  holdNumber: string;
  branchId?: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  discount?: number;
  notes?: string;
  heldBy?: string;
  expiresAt?: Date | string;
  createdAt: Date | string;
}

export interface SalesQuotation {
  id: string;
  quotationNumber: string;
  branchId?: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  discount?: number;
  taxAmount?: number;
  total: number;
  validUntil?: Date | string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'converted';
  convertedToSaleId?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================
// 5. PURCHASE TYPES
// ============================================

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  branchId?: string;
  supplierId?: string;
  supplierName?: string;
  orderDate: Date | string;
  expectedDeliveryDate?: Date | string;
  status: 'draft' | 'submitted' | 'approved' | 'partial' | 'received' | 'cancelled';
  subtotal: number;
  discount?: number;
  taxAmount?: number;
  shippingCost?: number;
  total: number;
  termsConditions?: string;
  notes?: string;
  items?: PurchaseOrderItem[];
  approvedBy?: string;
  approvedAt?: Date | string;
  createdBy?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PurchaseOrderItem {
  id: string;
  poId: string;
  productId: string;
  productName?: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
  notes?: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  poId?: string;
  branchId?: string;
  supplierId?: string;
  receiptDate: Date | string;
  status: 'pending' | 'verified' | 'approved';
  notes?: string;
  items?: GRNItem[];
  receivedBy?: string;
  verifiedBy?: string;
  createdAt: Date | string;
}

export interface GRNItem {
  id: string;
  grnId: string;
  productId: string;
  productName?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  damagedQuantity?: number;
  unitPrice: number;
  batchNumber?: string;
  expiryDate?: Date | string;
  notes?: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  purchaseId?: string;
  supplierId?: string;
  branchId?: string;
  returnDate: Date | string;
  subtotal: number;
  total: number;
  reason?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date | string;
}

// ============================================
// 6. CASH & BANK TYPES
// ============================================

export interface CashRegister {
  id: string;
  branchId?: string;
  name: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: Date | string;
}

export interface CashRegisterTransaction {
  id: string;
  registerId: string;
  transactionType: 'open' | 'close' | 'sale' | 'refund' | 'cash_in' | 'cash_out' | 'adjustment';
  amount: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date | string;
}

export interface CashShift {
  id: string;
  registerId: string;
  userId?: string;
  openingAmount: number;
  closingAmount?: number;
  expectedClosing?: number;
  variance?: number;
  openedAt: Date | string;
  closedAt?: Date | string;
  status: 'open' | 'closed';
  notes?: string;
}

export interface BankAccount {
  id: string;
  branchId?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType: 'current' | 'savings';
  branchName?: string;
  ifscCode?: string;
  swiftCode?: string;
  currentBalance: number;
  isActive: boolean;
  createdAt: Date | string;
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  transactionType: 'deposit' | 'withdrawal' | 'transfer' | 'cheque_deposit' | 'cheque_issue';
  amount: number;
  balanceAfter: number;
  referenceNumber?: string;
  chequeNumber?: string;
  chequeDate?: Date | string;
  chequeStatus?: 'pending' | 'cleared' | 'bounced';
  description?: string;
  referenceType?: string;
  referenceId?: string;
  createdBy?: string;
  createdAt: Date | string;
}

export interface Cheque {
  id: string;
  chequeNumber: string;
  chequeType: 'received' | 'issued';
  bankName?: string;
  branchName?: string;
  amount: number;
  chequeDate: Date | string;
  status: 'pending' | 'deposited' | 'cleared' | 'bounced' | 'cancelled';
  partyType?: 'customer' | 'supplier';
  partyId?: string;
  partyName?: string;
  depositedAt?: Date | string;
  clearedAt?: Date | string;
  bouncedAt?: Date | string;
  bounceReason?: string;
  bankAccountId?: string;
  notes?: string;
  createdAt: Date | string;
}

export interface FundTransfer {
  id: string;
  transferNumber: string;
  fromType: 'cash' | 'bank';
  fromId?: string;
  toType: 'cash' | 'bank';
  toId?: string;
  amount: number;
  transferDate: Date | string;
  notes?: string;
  createdBy?: string;
  createdAt: Date | string;
}

// ============================================
// 7. ACCOUNTING TYPES
// ============================================

export interface ChartOfAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  parentId?: string;
  isGroup: boolean;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  branchId?: string;
  createdAt: Date | string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: Date | string;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  totalDebit: number;
  totalCredit: number;
  status: 'draft' | 'posted' | 'reversed';
  branchId?: string;
  lines?: JournalEntryLine[];
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: Date | string;
  createdAt: Date | string;
}

export interface JournalEntryLine {
  id: string;
  entryId: string;
  accountId: string;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
  createdAt: Date | string;
}

export interface FiscalYear {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  isClosed: boolean;
  closedAt?: Date | string;
  closedBy?: string;
  createdAt: Date | string;
}

export interface Budget {
  id: string;
  name: string;
  fiscalYearId?: string;
  branchId?: string;
  totalAmount: number;
  periodType: 'monthly' | 'quarterly' | 'yearly';
  status: 'draft' | 'approved' | 'active' | 'closed';
  lines?: BudgetLine[];
  createdBy?: string;
  createdAt: Date | string;
}

export interface BudgetLine {
  id: string;
  budgetId: string;
  accountId: string;
  accountName?: string;
  period: string;
  budgetedAmount: number;
  actualAmount: number;
  variance?: number;
  createdAt: Date | string;
}

// ============================================
// 8. CUSTOMER ENHANCED TYPES
// ============================================

export interface CustomerAddress {
  id: string;
  customerId: string;
  addressType: 'billing' | 'shipping' | 'both';
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault: boolean;
  createdAt: Date | string;
}

export interface CustomerContact {
  id: string;
  customerId: string;
  name: string;
  designation?: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
  createdAt: Date | string;
}

export interface LoyaltyPointsHistory {
  id: string;
  customerId: string;
  points: number;
  transactionType: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  referenceType?: string;
  referenceId?: string;
  balanceAfter: number;
  description?: string;
  createdAt: Date | string;
}

export interface LoyaltySettings {
  id: string;
  branchId?: string;
  pointsPerCurrency: number;
  currencyPerPoint: number;
  minimumPointsRedeem: number;
  pointsExpiryMonths: number;
  isActive: boolean;
  createdAt: Date | string;
}

// ============================================
// 9. SUPPLIER ENHANCED TYPES
// ============================================

export interface SupplierAddress {
  id: string;
  supplierId: string;
  addressType: 'main' | 'warehouse' | 'billing';
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault: boolean;
  createdAt: Date | string;
}

export interface SupplierContact {
  id: string;
  supplierId: string;
  name: string;
  designation?: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
  createdAt: Date | string;
}

// ============================================
// 10. EXPENSE ENHANCED TYPES
// ============================================

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date | string;
}

// ============================================
// 11. NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  branchId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: Date | string;
  readBy?: string;
  actionUrl?: string;
  createdAt: Date | string;
}

export interface UserNotification {
  id: string;
  notificationId: string;
  userId: string;
  isRead: boolean;
  readAt?: Date | string;
  createdAt: Date | string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  notificationType: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  createdAt: Date | string;
}

// ============================================
// 12. SETTINGS TYPES
// ============================================

export interface CompanySettings {
  id: string;
  companyName: string;
  legalName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
  vatNumber?: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
  fiscalYearStart?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface InvoiceSettings {
  id: string;
  branchId?: string;
  invoicePrefix: string;
  invoiceSuffix?: string;
  currentNumber: number;
  numberPadding: number;
  resetPeriod: 'never' | 'yearly' | 'monthly';
  lastResetAt?: Date | string;
  createdAt: Date | string;
}

export interface NumberSequence {
  id: string;
  branchId?: string;
  sequenceType: string;
  prefix?: string;
  suffix?: string;
  currentNumber: number;
  padding: number;
  createdAt: Date | string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  taxType: 'inclusive' | 'exclusive';
  hsCode?: string;
  isActive: boolean;
  createdAt: Date | string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'mobile_banking' | 'bank_transfer' | 'credit';
  icon?: string;
  isActive: boolean;
  isDefault: boolean;
  accountId?: string;
  processingFee?: number;
  createdAt: Date | string;
}

export interface MobileBankingConfig {
  id: string;
  providerName: string;
  accountNumber: string;
  merchantId?: string;
  apiKey?: string;
  isActive: boolean;
  createdAt: Date | string;
}

export interface PrintTemplate {
  id: string;
  name: string;
  type: string;
  templateContent: string;
  paperSize: string;
  orientation: 'portrait' | 'landscape';
  isDefault: boolean;
  createdAt: Date | string;
}

// ============================================
// 13. INTEGRATION TYPES
// ============================================

export interface EmailLog {
  id: string;
  toEmail: string;
  subject?: string;
  body?: string;
  status: 'pending' | 'sent' | 'failed';
  errorMessage?: string;
  sentAt?: Date | string;
  createdAt: Date | string;
}

export interface SmsLog {
  id: string;
  toPhone: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  errorMessage?: string;
  provider?: string;
  messageId?: string;
  sentAt?: Date | string;
  createdAt: Date | string;
}

export interface IntegrationLog {
  id: string;
  integrationType: string;
  direction: 'inbound' | 'outbound';
  endpoint?: string;
  requestData?: Record<string, unknown>;
  responseData?: Record<string, unknown>;
  status?: string;
  errorMessage?: string;
  processingTime?: number;
  createdAt: Date | string;
}

// ============================================
// 14. BACKUP TYPES
// ============================================

export interface BackupHistory {
  id: string;
  backupType: 'full' | 'partial' | 'incremental';
  backupLocation?: string;
  fileSize?: number;
  status: 'in_progress' | 'completed' | 'failed';
  startedAt: Date | string;
  completedAt?: Date | string;
  createdBy?: string;
  notes?: string;
}

export interface RestoreHistory {
  id: string;
  backupId?: string;
  restoreType: 'full' | 'partial';
  status: 'in_progress' | 'completed' | 'failed';
  startedAt: Date | string;
  completedAt?: Date | string;
  restoredBy?: string;
  notes?: string;
}

// ============================================
// 15. SYSTEM TYPES
// ============================================

export interface SystemConfig {
  id: string;
  configKey: string;
  configValue: Record<string, unknown>;
  description?: string;
  isPublic: boolean;
  updatedAt: Date | string;
}

export interface FeatureFlag {
  id: string;
  featureName: string;
  isEnabled: boolean;
  description?: string;
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
  | 'branches'
  | 'stock-transfer'
  | 'stocktake'
  | 'purchase-orders'
  | 'cash-register'
  | 'bank-accounts'
  | 'quotations'
  | 'held-sales'
  | 'sales-returns'
  | 'cheques'
  | 'journal-entries'
  | 'chart-of-accounts'
  | 'budgets'
  | 'loyalty'
  | 'notifications'
  | 'backups'
  | 'integrations'
  | 'print-templates';
