'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Users, Plus, Edit, Trash2, X, Shield, Eye, EyeOff,
  CheckCircle, UserCheck, UserX, Save, Key, Mail, Phone, AtSign,
  Crown, Star, Settings, Store, ShoppingCart, Package, Truck, 
  Calculator, BarChart3, Globe, Database, Lock, Unlock, AlertCircle,
  UserCog, UserPlus, ShieldCheck, ShieldAlert, Activity, CreditCard,
  Building, Wallet, FileText, Layers, RefreshCw
} from 'lucide-react';

// Role definitions with permissions
export const ROLE_DEFINITIONS = {
  'Master Admin': {
    level: 1,
    color: 'bg-gradient-to-r from-amber-500 to-orange-500',
    textColor: 'text-white',
    borderColor: 'border-amber-400',
    description: 'Full system control - Creator/Owner',
    isSystemRole: true,
    permissions: {
      // Dashboard
      dashboard_view: true,
      // POS & Sales
      pos_access: true,
      sales_view: true,
      sales_create: true,
      sales_edit: true,
      sales_delete: true,
      sales_return: true,
      // Purchases
      purchases_view: true,
      purchases_create: true,
      purchases_edit: true,
      purchases_delete: true,
      // Inventory
      inventory_view: true,
      inventory_create: true,
      inventory_edit: true,
      inventory_delete: true,
      inventory_adjust: true,
      // Customers
      customers_view: true,
      customers_create: true,
      customers_edit: true,
      customers_delete: true,
      // Suppliers
      suppliers_view: true,
      suppliers_create: true,
      suppliers_edit: true,
      suppliers_delete: true,
      // Accounting
      accounting_view: true,
      accounting_create: true,
      accounting_edit: true,
      accounting_delete: true,
      // Reports
      reports_view: true,
      reports_export: true,
      // Cash Register
      cash_register: true,
      cash_adjust: true,
      // Expenses
      expenses_view: true,
      expenses_create: true,
      expenses_edit: true,
      expenses_delete: true,
      // Branches
      branches_view: true,
      branches_manage: true,
      stock_transfer: true,
      // Settings
      settings_view: true,
      settings_edit: true,
      // Users
      users_view: true,
      users_create: true,
      users_edit: true,
      users_delete: true,
      users_permissions: true,
      // Activity Logs
      activity_logs: true,
      // Print Templates
      print_templates: true,
    }
  },
  'Admin': {
    level: 2,
    color: 'bg-gradient-to-r from-purple-500 to-violet-500',
    textColor: 'text-white',
    borderColor: 'border-purple-400',
    description: 'Administrative access - Can manage most things',
    isSystemRole: false,
    permissions: {
      dashboard_view: true,
      pos_access: true,
      sales_view: true,
      sales_create: true,
      sales_edit: true,
      sales_delete: true,
      sales_return: true,
      purchases_view: true,
      purchases_create: true,
      purchases_edit: true,
      purchases_delete: true,
      inventory_view: true,
      inventory_create: true,
      inventory_edit: true,
      inventory_delete: true,
      inventory_adjust: true,
      customers_view: true,
      customers_create: true,
      customers_edit: true,
      customers_delete: true,
      suppliers_view: true,
      suppliers_create: true,
      suppliers_edit: true,
      suppliers_delete: true,
      accounting_view: true,
      accounting_create: true,
      accounting_edit: true,
      accounting_delete: true,
      reports_view: true,
      reports_export: true,
      cash_register: true,
      cash_adjust: true,
      expenses_view: true,
      expenses_create: true,
      expenses_edit: true,
      expenses_delete: true,
      branches_view: true,
      branches_manage: false,
      stock_transfer: true,
      settings_view: true,
      settings_edit: false,
      users_view: true,
      users_create: true,
      users_edit: true,
      users_delete: false,
      users_permissions: false,
      activity_logs: true,
      print_templates: true,
    }
  },
  'Manager': {
    level: 3,
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    textColor: 'text-white',
    borderColor: 'border-blue-400',
    description: 'Staff management, reports, inventory control',
    isSystemRole: false,
    permissions: {
      dashboard_view: true,
      pos_access: true,
      sales_view: true,
      sales_create: true,
      sales_edit: true,
      sales_delete: false,
      sales_return: true,
      purchases_view: true,
      purchases_create: true,
      purchases_edit: true,
      purchases_delete: false,
      inventory_view: true,
      inventory_create: true,
      inventory_edit: true,
      inventory_delete: false,
      inventory_adjust: true,
      customers_view: true,
      customers_create: true,
      customers_edit: true,
      customers_delete: false,
      suppliers_view: true,
      suppliers_create: true,
      suppliers_edit: true,
      suppliers_delete: false,
      accounting_view: true,
      accounting_create: true,
      accounting_edit: true,
      accounting_delete: false,
      reports_view: true,
      reports_export: true,
      cash_register: true,
      cash_adjust: true,
      expenses_view: true,
      expenses_create: true,
      expenses_edit: true,
      expenses_delete: false,
      branches_view: true,
      branches_manage: false,
      stock_transfer: true,
      settings_view: true,
      settings_edit: false,
      users_view: true,
      users_create: false,
      users_edit: false,
      users_delete: false,
      users_permissions: false,
      activity_logs: true,
      print_templates: false,
    }
  },
  'Staff': {
    level: 4,
    color: 'bg-gradient-to-r from-green-500 to-emerald-500',
    textColor: 'text-white',
    borderColor: 'border-green-400',
    description: 'Regular staff - Sales, purchases, inventory',
    isSystemRole: false,
    permissions: {
      dashboard_view: true,
      pos_access: true,
      sales_view: true,
      sales_create: true,
      sales_edit: false,
      sales_delete: false,
      sales_return: false,
      purchases_view: true,
      purchases_create: true,
      purchases_edit: false,
      purchases_delete: false,
      inventory_view: true,
      inventory_create: false,
      inventory_edit: true,
      inventory_delete: false,
      inventory_adjust: false,
      customers_view: true,
      customers_create: true,
      customers_edit: true,
      customers_delete: false,
      suppliers_view: true,
      suppliers_create: false,
      suppliers_edit: false,
      suppliers_delete: false,
      accounting_view: true,
      accounting_create: false,
      accounting_edit: false,
      accounting_delete: false,
      reports_view: true,
      reports_export: false,
      cash_register: true,
      cash_adjust: false,
      expenses_view: true,
      expenses_create: false,
      expenses_edit: false,
      expenses_delete: false,
      branches_view: false,
      branches_manage: false,
      stock_transfer: false,
      settings_view: false,
      settings_edit: false,
      users_view: false,
      users_create: false,
      users_edit: false,
      users_delete: false,
      users_permissions: false,
      activity_logs: false,
      print_templates: false,
    }
  },
  'Seller': {
    level: 5,
    color: 'bg-gradient-to-r from-teal-500 to-cyan-500',
    textColor: 'text-white',
    borderColor: 'border-teal-400',
    description: 'Only POS/Sales operations',
    isSystemRole: false,
    permissions: {
      dashboard_view: true,
      pos_access: true,
      sales_view: true,
      sales_create: true,
      sales_edit: false,
      sales_delete: false,
      sales_return: false,
      purchases_view: false,
      purchases_create: false,
      purchases_edit: false,
      purchases_delete: false,
      inventory_view: true,
      inventory_create: false,
      inventory_edit: false,
      inventory_delete: false,
      inventory_adjust: false,
      customers_view: true,
      customers_create: true,
      customers_edit: false,
      customers_delete: false,
      suppliers_view: false,
      suppliers_create: false,
      suppliers_edit: false,
      suppliers_delete: false,
      accounting_view: false,
      accounting_create: false,
      accounting_edit: false,
      accounting_delete: false,
      reports_view: false,
      reports_export: false,
      cash_register: true,
      cash_adjust: false,
      expenses_view: false,
      expenses_create: false,
      expenses_edit: false,
      expenses_delete: false,
      branches_view: false,
      branches_manage: false,
      stock_transfer: false,
      settings_view: false,
      settings_edit: false,
      users_view: false,
      users_create: false,
      users_edit: false,
      users_delete: false,
      users_permissions: false,
      activity_logs: false,
      print_templates: false,
    }
  },
  'Viewer': {
    level: 6,
    color: 'bg-gradient-to-r from-slate-500 to-gray-500',
    textColor: 'text-white',
    borderColor: 'border-slate-400',
    description: 'Read-only access - View data only',
    isSystemRole: false,
    permissions: {
      dashboard_view: true,
      pos_access: false,
      sales_view: true,
      sales_create: false,
      sales_edit: false,
      sales_delete: false,
      sales_return: false,
      purchases_view: true,
      purchases_create: false,
      purchases_edit: false,
      purchases_delete: false,
      inventory_view: true,
      inventory_create: false,
      inventory_edit: false,
      inventory_delete: false,
      inventory_adjust: false,
      customers_view: true,
      customers_create: false,
      customers_edit: false,
      customers_delete: false,
      suppliers_view: true,
      suppliers_create: false,
      suppliers_edit: false,
      suppliers_delete: false,
      accounting_view: true,
      accounting_create: false,
      accounting_edit: false,
      accounting_delete: false,
      reports_view: true,
      reports_export: false,
      cash_register: false,
      cash_adjust: false,
      expenses_view: true,
      expenses_create: false,
      expenses_edit: false,
      expenses_delete: false,
      branches_view: true,
      branches_manage: false,
      stock_transfer: false,
      settings_view: false,
      settings_edit: false,
      users_view: false,
      users_create: false,
      users_edit: false,
      users_delete: false,
      users_permissions: false,
      activity_logs: false,
      print_templates: false,
    }
  }
};

// Permission categories for organized display
export const PERMISSION_CATEGORIES = {
  'Dashboard': {
    icon: BarChart3,
    permissions: ['dashboard_view']
  },
  'POS & Sales': {
    icon: ShoppingCart,
    permissions: ['pos_access', 'sales_view', 'sales_create', 'sales_edit', 'sales_delete', 'sales_return']
  },
  'Purchases': {
    icon: Truck,
    permissions: ['purchases_view', 'purchases_create', 'purchases_edit', 'purchases_delete']
  },
  'Inventory': {
    icon: Package,
    permissions: ['inventory_view', 'inventory_create', 'inventory_edit', 'inventory_delete', 'inventory_adjust']
  },
  'Customers': {
    icon: Users,
    permissions: ['customers_view', 'customers_create', 'customers_edit', 'customers_delete']
  },
  'Suppliers': {
    icon: Truck,
    permissions: ['suppliers_view', 'suppliers_create', 'suppliers_edit', 'suppliers_delete']
  },
  'Accounting': {
    icon: Calculator,
    permissions: ['accounting_view', 'accounting_create', 'accounting_edit', 'accounting_delete']
  },
  'Reports': {
    icon: BarChart3,
    permissions: ['reports_view', 'reports_export']
  },
  'Cash & Expenses': {
    icon: Wallet,
    permissions: ['cash_register', 'cash_adjust', 'expenses_view', 'expenses_create', 'expenses_edit', 'expenses_delete']
  },
  'Branches': {
    icon: Building,
    permissions: ['branches_view', 'branches_manage', 'stock_transfer']
  },
  'Settings': {
    icon: Settings,
    permissions: ['settings_view', 'settings_edit', 'print_templates']
  },
  'User Management': {
    icon: Shield,
    permissions: ['users_view', 'users_create', 'users_edit', 'users_delete', 'users_permissions']
  },
  'Activity Logs': {
    icon: Activity,
    permissions: ['activity_logs']
  }
};

// Permission labels
export const PERMISSION_LABELS: Record<string, string> = {
  dashboard_view: 'View Dashboard',
  pos_access: 'Access POS',
  sales_view: 'View Sales',
  sales_create: 'Create Sales',
  sales_edit: 'Edit Sales',
  sales_delete: 'Delete Sales',
  sales_return: 'Process Returns',
  purchases_view: 'View Purchases',
  purchases_create: 'Create Purchases',
  purchases_edit: 'Edit Purchases',
  purchases_delete: 'Delete Purchases',
  inventory_view: 'View Inventory',
  inventory_create: 'Add Products',
  inventory_edit: 'Edit Products',
  inventory_delete: 'Delete Products',
  inventory_adjust: 'Adjust Stock',
  customers_view: 'View Customers',
  customers_create: 'Add Customers',
  customers_edit: 'Edit Customers',
  customers_delete: 'Delete Customers',
  suppliers_view: 'View Suppliers',
  suppliers_create: 'Add Suppliers',
  suppliers_edit: 'Edit Suppliers',
  suppliers_delete: 'Delete Suppliers',
  accounting_view: 'View Accounting',
  accounting_create: 'Create Entries',
  accounting_edit: 'Edit Entries',
  accounting_delete: 'Delete Entries',
  reports_view: 'View Reports',
  reports_export: 'Export Reports',
  cash_register: 'Manage Cash Register',
  cash_adjust: 'Adjust Cash',
  expenses_view: 'View Expenses',
  expenses_create: 'Add Expenses',
  expenses_edit: 'Edit Expenses',
  expenses_delete: 'Delete Expenses',
  branches_view: 'View Branches',
  branches_manage: 'Manage Branches',
  stock_transfer: 'Stock Transfer',
  settings_view: 'View Settings',
  settings_edit: 'Edit Settings',
  users_view: 'View Users',
  users_create: 'Add Users',
  users_edit: 'Edit Users',
  users_delete: 'Delete Users',
  users_permissions: 'Manage Permissions',
  activity_logs: 'View Activity Logs',
  print_templates: 'Manage Print Templates',
};

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  username: string;
  role: string;
  isActive: boolean;
  permissions: Record<string, boolean>;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  users: User[];
  currentUserRole?: string;
  currentUserPermissions?: Record<string, boolean>;
  onAddUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateUser: (id: string, user: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
}

const UserManagement: React.FC<Props> = ({
  users,
  currentUserRole,
  currentUserPermissions,
  onAddUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const { lang, t } = useLanguage();
  
  // Check permissions
  const isMasterAdmin = currentUserRole === 'Master Admin';
  const isAdmin = currentUserRole === 'Admin';
  // Master Admin has full control, Admin can view/create users but not manage permissions
  const canViewUsers = isMasterAdmin || isAdmin || currentUserPermissions?.users_view;
  const canCreateUsers = isMasterAdmin || isAdmin || currentUserPermissions?.users_create;
  const canEditUsers = isMasterAdmin || isAdmin || currentUserPermissions?.users_edit;
  const canDeleteUsers = isMasterAdmin || currentUserPermissions?.users_delete;
  // ONLY Master Admin can manage permissions (including Admin's permissions)
  const canManagePermissions = isMasterAdmin;
  
  // Hide Master Admin from non-Master Admin users
  const visibleUsers = isMasterAdmin 
    ? users 
    : users.filter(u => u.role !== 'Master Admin');
  
  // Available roles for creation
  // Master Admin can create ALL roles
  // Admin can create: Manager, Staff, Seller, Viewer (NOT Master Admin, NOT Admin)
  // Others with users_create permission can create based on their permissions
  const availableRoles = isMasterAdmin 
    ? Object.keys(ROLE_DEFINITIONS)
    : isAdmin 
      ? Object.keys(ROLE_DEFINITIONS).filter(r => r !== 'Master Admin' && r !== 'Admin')
      : Object.keys(ROLE_DEFINITIONS).filter(r => r !== 'Master Admin');
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showRoleInfo, setShowRoleInfo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    role: 'Staff' as keyof typeof ROLE_DEFINITIONS,
    password: '',
    isActive: true,
    permissions: { ...ROLE_DEFINITIONS['Staff'].permissions }
  });
  
  // Reset form when role changes
  const handleRoleChange = (role: keyof typeof ROLE_DEFINITIONS) => {
    setUserForm(prev => ({
      ...prev,
      role,
      permissions: { ...ROLE_DEFINITIONS[role].permissions }
    }));
  };
  
  // Toggle individual permission
  const handlePermissionToggle = (permission: string) => {
    if (!canManagePermissions) return;
    
    setUserForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission]
      }
    }));
  };
  
  // Open add user modal
  const openAddUserModal = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      username: '',
      email: '',
      phone: '',
      role: 'Staff',
      password: '',
      isActive: true,
      permissions: { ...ROLE_DEFINITIONS['Staff'].permissions }
    });
    setShowUserModal(true);
  };
  
  // Open edit user modal
  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      role: (user.role as keyof typeof ROLE_DEFINITIONS) || 'Staff',
      password: '',
      isActive: user.isActive ?? true,
      permissions: user.permissions || { ...ROLE_DEFINITIONS['Staff'].permissions }
    });
    setShowUserModal(true);
  };
  
  // Save user
  const handleSaveUser = () => {
    if (!userForm.name || !userForm.username) {
      alert(lang === 'bn' ? 'নাম এবং ইউজারনেম প্রয়োজন' : 'Name and Username are required');
      return;
    }
    
    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(userForm.username)) {
      alert(lang === 'bn' ? 'ইউজারনেম শুধুমাত্র অক্ষর, সংখ্যা এবং _ হতে পারবে' : 'Username can only contain letters, numbers and underscore');
      return;
    }
    
    if (editingUser) {
      onUpdateUser(editingUser.id, {
        name: userForm.name,
        username: userForm.username,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        isActive: userForm.isActive,
        permissions: userForm.permissions,
        ...(userForm.password ? { password: userForm.password } : {})
      });
    } else {
      onAddUser({
        name: userForm.name,
        username: userForm.username,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        isActive: userForm.isActive,
        permissions: userForm.permissions,
        password: userForm.password || '123456'
      });
    }
    
    setShowUserModal(false);
    setEditingUser(null);
  };
  
  // Delete user
  const handleDeleteUser = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };
  
  // Toggle user active status
  const toggleUserStatus = (user: User) => {
    onUpdateUser(user.id, { isActive: !user.isActive });
  };
  
  // Filter users
  const filteredUsers = visibleUsers.filter(user => {
    const matchesSearch = 
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  // Get role badge style
  const getRoleBadge = (role: string) => {
    const roleDef = ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS];
    if (roleDef) {
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${roleDef.color} ${roleDef.textColor}`}>
          {role === 'Master Admin' && <Crown className="w-3 h-3" />}
          {role}
        </span>
      );
    }
    return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">{role}</span>;
  };
  
  // Count permissions
  const countEnabledPermissions = (permissions: Record<string, boolean>) => {
    return Object.values(permissions).filter(v => v).length;
  };
  
  const totalPermissions = Object.keys(PERMISSION_LABELS).length;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-violet-600" />
            {lang === 'bn' ? 'ইউজার ম্যানেজমেন্ট' : 'User Management'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {lang === 'bn' ? 'স্টাফ অ্যাকাউন্ট এবং পারমিশন ম্যানেজ করুন' : 'Manage staff accounts and permissions'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRoleInfo(!showRoleInfo)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
          >
            <Shield className="w-4 h-4" />
            {lang === 'bn' ? 'রোল তথ্য' : 'Role Info'}
          </button>
          {canCreateUsers && (
            <button
              onClick={openAddUserModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              {lang === 'bn' ? 'নতুন ইউজার' : 'Add User'}
            </button>
          )}
        </div>
      </div>
      
      {/* Role Info Panel */}
      {showRoleInfo && (
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-violet-600" />
            {lang === 'bn' ? 'রোল এবং পারমিশন গাইড' : 'Role & Permission Guide'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(ROLE_DEFINITIONS)
              .filter(([role]) => isMasterAdmin || role !== 'Master Admin')
              .map(([role, def]) => (
              <div 
                key={role}
                className={`p-4 rounded-xl border-2 ${def.borderColor} bg-white`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${def.color} ${def.textColor}`}>
                    {role === 'Master Admin' && <Crown className="w-3 h-3 inline mr-1" />}
                    {role}
                  </span>
                  {def.isSystemRole && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {lang === 'bn' ? 'সিস্টেম' : 'System'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">{def.description}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {countEnabledPermissions(def.permissions)}/{totalPermissions} {lang === 'bn' ? 'পারমিশন' : 'permissions'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder={lang === 'bn' ? 'নাম, ইউজারনেম বা ইমেইল খুঁজুন...' : 'Search by name, username or email...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
        >
          <option value="all">{lang === 'bn' ? 'সব রোল' : 'All Roles'}</option>
          {availableRoles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
        >
          <option value="all">{lang === 'bn' ? 'সব স্ট্যাটাস' : 'All Status'}</option>
          <option value="active">{lang === 'bn' ? 'সক্রিয়' : 'Active'}</option>
          <option value="inactive">{lang === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
        </select>
      </div>
      
      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                  {lang === 'bn' ? 'ইউজার' : 'User'}
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                  {lang === 'bn' ? 'রোল' : 'Role'}
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider hidden md:table-cell">
                  {lang === 'bn' ? 'পারমিশন' : 'Permissions'}
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider hidden lg:table-cell">
                  {lang === 'bn' ? 'শেষ লগইন' : 'Last Login'}
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                  {lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                </th>
                <th className="text-right px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                  {lang === 'bn' ? 'অ্যাকশন' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>{lang === 'bn' ? 'কোনো ইউজার পাওয়া যায়নি' : 'No users found'}</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                          ROLE_DEFINITIONS[user.role as keyof typeof ROLE_DEFINITIONS]?.color || 'bg-slate-500'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                            style={{ 
                              width: `${(countEnabledPermissions(user.permissions || {}) / totalPermissions) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {countEnabledPermissions(user.permissions || {})}/{totalPermissions}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString('bn-BD' , { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : (lang === 'bn' ? 'কখনো না' : 'Never')
                      }
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleUserStatus(user)}
                        disabled={!canEditUsers}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          user.isActive 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        } ${!canEditUsers ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {user.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            {lang === 'bn' ? 'সক্রিয়' : 'Active'}
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            {lang === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {canEditUsers && (
                          <button
                            onClick={() => openEditUserModal(user)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            title={lang === 'bn' ? 'এডিট' : 'Edit'}
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                          </button>
                        )}
                        {canDeleteUsers && user.role !== 'Master Admin' && (
                          <button
                            onClick={() => setUserToDelete(user)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-all"
                            title={lang === 'bn' ? 'ডিলিট' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {editingUser ? (
                    <>
                      <UserCog className="w-5 h-5" />
                      {lang === 'bn' ? 'ইউজার এডিট' : 'Edit User'}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      {lang === 'bn' ? 'নতুন ইউজার' : 'Add New User'}
                    </>
                  )}
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  {editingUser 
                    ? (lang === 'bn' ? `${editingUser.name} এর তথ্য আপডেট করুন` : `Update information for ${editingUser.name}`)
                    : (lang === 'bn' ? 'একজন নতুন ইউজার যোগ করুন' : 'Create a new user account')
                  }
                </p>
              </div>
              <button 
                onClick={() => setShowUserModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-600" />
                    {lang === 'bn' ? 'মৌলিক তথ্য' : 'Basic Information'}
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                        {lang === 'bn' ? 'পুরো নাম' : 'Full Name'} *
                      </label>
                      <input
                        type="text"
                        value={userForm.name}
                        onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full mt-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-violet-500 outline-none transition-all"
                        placeholder={lang === 'bn' ? 'পুরো নাম লিখুন' : 'Enter full name'}
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                        {lang === 'bn' ? 'ইউজারনেম' : 'Username'} *
                      </label>
                      <div className="relative mt-1">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={userForm.username}
                          onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                          className="w-full pl-10 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-violet-500 outline-none transition-all"
                          placeholder="username"
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {lang === 'bn' ? 'শুধুমাত্র ছোট হাতের অক্ষর, সংখ্যা এবং _' : 'Only lowercase letters, numbers and underscore'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {lang === 'bn' ? 'ইমেইল' : 'Email'}
                        </label>
                        <input
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full mt-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-violet-500 outline-none transition-all"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {lang === 'bn' ? 'ফোন' : 'Phone'}
                        </label>
                        <input
                          type="text"
                          value={userForm.phone}
                          onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full mt-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-violet-500 outline-none transition-all"
                          placeholder="+880"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <Key className="w-3 h-3" /> {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                        {editingUser && <span className="text-slate-400 font-normal">({lang === 'bn' ? 'খালি রাখুন অপরিবর্তিত রাখতে' : 'leave empty to keep unchanged'})</span>}
                      </label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={userForm.password}
                          onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full pl-10 pr-10 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-violet-500 outline-none transition-all"
                          placeholder={editingUser ? '••••••••' : (lang === 'bn' ? 'পাসওয়ার্ড দিন' : 'Enter password')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {!editingUser && (
                        <p className="text-xs text-slate-400 mt-1">
                          {lang === 'bn' ? 'ডিফল্ট: 123456' : 'Default: 123456'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                        {lang === 'bn' ? 'রোল নির্বাচন' : 'Select Role'}
                      </label>
                      <select
                        value={userForm.role}
                        onChange={(e) => handleRoleChange(e.target.value as keyof typeof ROLE_DEFINITIONS)}
                        disabled={!isMasterAdmin && userForm.role === 'Master Admin'}
                        className="w-full mt-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-violet-500 outline-none transition-all"
                      >
                        {availableRoles.map(role => (
                          <option key={role} value={role}>
                            {role} - {ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]?.description || role}
                          </option>
                        ))}
                      </select>
                      {!isMasterAdmin && (
                        <p className="text-xs text-amber-600 mt-1">
                          {lang === 'bn' ? 'Master Admin শুধুমাত্র Master Admin দ্বারা তৈরি করা যাবে' : 'Master Admin can only be created by Master Admin'}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setUserForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                        className={`w-12 h-7 rounded-full transition-all relative ${
                          userForm.isActive ? 'bg-green-500' : 'bg-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                          userForm.isActive ? 'right-1' : 'left-1'
                        }`} />
                      </button>
                      <span className="font-medium text-slate-700">
                        {userForm.isActive 
                          ? (lang === 'bn' ? 'অ্যাকাউন্ট সক্রিয়' : 'Account Active')
                          : (lang === 'bn' ? 'অ্যাকাউন্ট নিষ্ক্রিয়' : 'Account Inactive')
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Right: Permissions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-violet-600" />
                      {lang === 'bn' ? 'পারমিশন' : 'Permissions'}
                    </h4>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">{countEnabledPermissions(userForm.permissions)}/{totalPermissions}</span>
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all"
                          style={{ 
                            width: `${(countEnabledPermissions(userForm.permissions) / totalPermissions) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4 space-y-4 max-h-[400px] overflow-y-auto">
                    {Object.entries(PERMISSION_CATEGORIES).map(([category, { icon: Icon, permissions }]) => (
                      <div key={category} className="space-y-2">
                        <h5 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                          <Icon className="w-3 h-3" />
                          {category}
                        </h5>
                        <div className="grid grid-cols-2 gap-2">
                          {permissions.map(permission => (
                            <button
                              key={permission}
                              onClick={() => handlePermissionToggle(permission)}
                              disabled={!canManagePermissions}
                              className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs font-medium transition-all ${
                                userForm.permissions[permission]
                                  ? 'bg-green-100 text-green-700 border border-green-200'
                                  : 'bg-white text-slate-500 border border-slate-200'
                              } ${!canManagePermissions ? 'opacity-50 cursor-not-allowed' : 'hover:border-violet-300'}`}
                            >
                              {userForm.permissions[permission] ? (
                                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              ) : (
                                <X className="w-3.5 h-3.5 flex-shrink-0" />
                              )}
                              <span className="truncate">{PERMISSION_LABELS[permission]}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {!canManagePermissions && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{lang === 'bn' ? 'পারমিশন পরিবর্তন করার অনুমতি নেই' : 'No permission to modify permissions'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveUser}
                className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingUser 
                  ? (lang === 'bn' ? 'আপডেট করুন' : 'Update User')
                  : (lang === 'bn' ? 'তৈরি করুন' : 'Create User')
                }
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'bn' ? 'ইউজার ডিলিট করুন?' : 'Delete User?'}
                </h3>
                <p className="text-sm text-slate-500">
                  {lang === 'bn' ? 'এই কাজ পূর্বাবস্থায় ফেরানো যাবে না' : 'This action cannot be undone'}
                </p>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                  ROLE_DEFINITIONS[userToDelete.role as keyof typeof ROLE_DEFINITIONS]?.color || 'bg-slate-500'
                }`}>
                  {userToDelete.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{userToDelete.name}</p>
                  <p className="text-xs text-slate-500">@{userToDelete.username} • {userToDelete.role}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {lang === 'bn' ? 'ডিলিট করুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
