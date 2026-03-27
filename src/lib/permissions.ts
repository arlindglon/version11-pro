// Permission utility functions for role-based access control
import { ROLE_DEFINITIONS } from '@/components/dokan/UserManagement';

export type PermissionKey = keyof typeof ROLE_DEFINITIONS['Master Admin']['permissions'];

// Check if a user has a specific permission
export function hasPermission(
  userRole: string | undefined,
  userPermissions: Record<string, boolean> | undefined,
  permission: PermissionKey | string
): boolean {
  if (!userRole) return false;
  
  // ONLY Master Admin has full access to everything
  if (userRole === 'Master Admin') return true;
  
  // All other roles (including Admin) must have explicit permission
  return userPermissions?.[permission] === true;
}

// Check multiple permissions (returns true if ANY permission is granted)
export function hasAnyPermission(
  userRole: string | undefined,
  userPermissions: Record<string, boolean> | undefined,
  permissions: string[]
): boolean {
  if (!userRole) return false;
  if (userRole === 'Master Admin') return true;
  
  return permissions.some(p => userPermissions?.[p] === true);
}

// Check multiple permissions (returns true if ALL permissions are granted)
export function hasAllPermissions(
  userRole: string | undefined,
  userPermissions: Record<string, boolean> | undefined,
  permissions: string[]
): boolean {
  if (!userRole) return false;
  if (userRole === 'Master Admin') return true;
  
  return permissions.every(p => userPermissions?.[p] === true);
}

// Permission groups for easy checking
export const PERMISSION_GROUPS = {
  // Dashboard
  dashboard: ['dashboard_view'],
  
  // POS & Sales
  pos: ['pos_access'],
  salesView: ['sales_view'],
  salesCreate: ['sales_create'],
  salesEdit: ['sales_edit'],
  salesDelete: ['sales_delete'],
  salesReturn: ['sales_return'],
  
  // Purchases
  purchasesView: ['purchases_view'],
  purchasesCreate: ['purchases_create'],
  purchasesEdit: ['purchases_edit'],
  purchasesDelete: ['purchases_delete'],
  
  // Inventory
  inventoryView: ['inventory_view'],
  inventoryCreate: ['inventory_create'],
  inventoryEdit: ['inventory_edit'],
  inventoryDelete: ['inventory_delete'],
  inventoryAdjust: ['inventory_adjust'],
  
  // Customers
  customersView: ['customers_view'],
  customersCreate: ['customers_create'],
  customersEdit: ['customers_edit'],
  customersDelete: ['customers_delete'],
  
  // Suppliers
  suppliersView: ['suppliers_view'],
  suppliersCreate: ['suppliers_create'],
  suppliersEdit: ['suppliers_edit'],
  suppliersDelete: ['suppliers_delete'],
  
  // Accounting
  accountingView: ['accounting_view'],
  accountingCreate: ['accounting_create'],
  accountingEdit: ['accounting_edit'],
  accountingDelete: ['accounting_delete'],
  
  // Reports
  reportsView: ['reports_view'],
  reportsExport: ['reports_export'],
  
  // Cash & Expenses
  cashRegister: ['cash_register'],
  cashAdjust: ['cash_adjust'],
  expensesView: ['expenses_view'],
  expensesCreate: ['expenses_create'],
  expensesEdit: ['expenses_edit'],
  expensesDelete: ['expenses_delete'],
  
  // Branches
  branchesView: ['branches_view'],
  branchesManage: ['branches_manage'],
  stockTransfer: ['stock_transfer'],
  
  // Settings
  settingsView: ['settings_view'],
  settingsEdit: ['settings_edit'],
  printTemplates: ['print_templates'],
  
  // User Management
  usersView: ['users_view'],
  usersCreate: ['users_create'],
  usersEdit: ['users_edit'],
  usersDelete: ['users_delete'],
  usersPermissions: ['users_permissions'],
  
  // Activity Logs
  activityLogs: ['activity_logs'],
};

// Helper to get default role permissions
export function getRolePermissions(role: string): Record<string, boolean> {
  const roleDef = ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS];
  return roleDef ? { ...roleDef.permissions } : {};
}
