import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// Default permissions for each role
const ROLE_PERMISSIONS = {
  'Master Admin': {
    dashboard_view: true, pos_access: true, sales_view: true, sales_create: true, sales_edit: true, sales_delete: true, sales_return: true,
    purchases_view: true, purchases_create: true, purchases_edit: true, purchases_delete: true,
    inventory_view: true, inventory_create: true, inventory_edit: true, inventory_delete: true, inventory_adjust: true,
    customers_view: true, customers_create: true, customers_edit: true, customers_delete: true,
    suppliers_view: true, suppliers_create: true, suppliers_edit: true, suppliers_delete: true,
    accounting_view: true, accounting_create: true, accounting_edit: true, accounting_delete: true,
    reports_view: true, reports_export: true, cash_register: true, cash_adjust: true,
    expenses_view: true, expenses_create: true, expenses_edit: true, expenses_delete: true,
    branches_view: true, branches_manage: true, stock_transfer: true,
    settings_view: true, settings_edit: true, print_templates: true,
    users_view: true, users_create: true, users_edit: true, users_delete: true, users_permissions: true,
    activity_logs: true,
  },
  'Admin': {
    dashboard_view: true, pos_access: true, sales_view: true, sales_create: true, sales_edit: true, sales_delete: true, sales_return: true,
    purchases_view: true, purchases_create: true, purchases_edit: true, purchases_delete: true,
    inventory_view: true, inventory_create: true, inventory_edit: true, inventory_delete: true, inventory_adjust: true,
    customers_view: true, customers_create: true, customers_edit: true, customers_delete: true,
    suppliers_view: true, suppliers_create: true, suppliers_edit: true, suppliers_delete: true,
    accounting_view: true, accounting_create: true, accounting_edit: true, accounting_delete: true,
    reports_view: true, reports_export: true, cash_register: true, cash_adjust: true,
    expenses_view: true, expenses_create: true, expenses_edit: true, expenses_delete: true,
    branches_view: true, branches_manage: false, stock_transfer: true,
    settings_view: true, settings_edit: false, print_templates: false,
    users_view: true, users_create: true, users_edit: true, users_delete: false, users_permissions: false,
    activity_logs: true,
  },
  'Manager': {
    dashboard_view: true, pos_access: true, sales_view: true, sales_create: true, sales_edit: true, sales_delete: false, sales_return: true,
    purchases_view: true, purchases_create: true, purchases_edit: true, purchases_delete: false,
    inventory_view: true, inventory_create: true, inventory_edit: true, inventory_delete: false, inventory_adjust: true,
    customers_view: true, customers_create: true, customers_edit: true, customers_delete: false,
    suppliers_view: true, suppliers_create: true, suppliers_edit: true, suppliers_delete: false,
    accounting_view: true, accounting_create: true, accounting_edit: true, accounting_delete: false,
    reports_view: true, reports_export: true, cash_register: true, cash_adjust: true,
    expenses_view: true, expenses_create: true, expenses_edit: true, expenses_delete: false,
    branches_view: true, branches_manage: false, stock_transfer: true,
    settings_view: true, settings_edit: false, print_templates: false,
    users_view: true, users_create: false, users_edit: false, users_delete: false, users_permissions: false,
    activity_logs: true,
  },
  'Staff': {
    dashboard_view: true, pos_access: true, sales_view: true, sales_create: true, sales_edit: false, sales_delete: false, sales_return: false,
    purchases_view: true, purchases_create: true, purchases_edit: false, purchases_delete: false,
    inventory_view: true, inventory_create: false, inventory_edit: true, inventory_delete: false, inventory_adjust: false,
    customers_view: true, customers_create: true, customers_edit: true, customers_delete: false,
    suppliers_view: true, suppliers_create: false, suppliers_edit: false, suppliers_delete: false,
    accounting_view: true, accounting_create: false, accounting_edit: false, accounting_delete: false,
    reports_view: true, reports_export: false, cash_register: true, cash_adjust: false,
    expenses_view: true, expenses_create: false, expenses_edit: false, expenses_delete: false,
    branches_view: false, branches_manage: false, stock_transfer: false,
    settings_view: false, settings_edit: false, print_templates: false,
    users_view: false, users_create: false, users_edit: false, users_delete: false, users_permissions: false,
    activity_logs: false,
  },
  'Seller': {
    dashboard_view: true, pos_access: true, sales_view: true, sales_create: true, sales_edit: false, sales_delete: false, sales_return: false,
    purchases_view: false, purchases_create: false, purchases_edit: false, purchases_delete: false,
    inventory_view: true, inventory_create: false, inventory_edit: false, inventory_delete: false, inventory_adjust: false,
    customers_view: true, customers_create: true, customers_edit: false, customers_delete: false,
    suppliers_view: false, suppliers_create: false, suppliers_edit: false, suppliers_delete: false,
    accounting_view: false, accounting_create: false, accounting_edit: false, accounting_delete: false,
    reports_view: false, reports_export: false, cash_register: true, cash_adjust: false,
    expenses_view: false, expenses_create: false, expenses_edit: false, expenses_delete: false,
    branches_view: false, branches_manage: false, stock_transfer: false,
    settings_view: false, settings_edit: false, print_templates: false,
    users_view: false, users_create: false, users_edit: false, users_delete: false, users_permissions: false,
    activity_logs: false,
  },
  'Viewer': {
    dashboard_view: true, pos_access: false, sales_view: true, sales_create: false, sales_edit: false, sales_delete: false, sales_return: false,
    purchases_view: true, purchases_create: false, purchases_edit: false, purchases_delete: false,
    inventory_view: true, inventory_create: false, inventory_edit: false, inventory_delete: false, inventory_adjust: false,
    customers_view: true, customers_create: false, customers_edit: false, customers_delete: false,
    suppliers_view: true, suppliers_create: false, suppliers_edit: false, suppliers_delete: false,
    accounting_view: true, accounting_create: false, accounting_edit: false, accounting_delete: false,
    reports_view: true, reports_export: false, cash_register: false, cash_adjust: false,
    expenses_view: true, expenses_create: false, expenses_edit: false, expenses_delete: false,
    branches_view: true, branches_manage: false, stock_transfer: false,
    settings_view: false, settings_edit: false, print_templates: false,
    users_view: false, users_create: false, users_edit: false, users_delete: false, users_permissions: false,
    activity_logs: false,
  },
};

// Helper to check if record exists
async function checkExists(table: string, column: string, value: string) {
  const { data } = await supabase
    .from(table)
    .select('id')
    .eq(column, value)
    .single();
  return !!data;
}

export async function POST() {
  try {
    console.log('Checking database setup...');

    // Check if already seeded - using a more robust check
    const { count: userCount } = await supabase
      .from('app_users')
      .select('*', { count: 'exact', head: true });

    // If users exist, skip seeding entirely
    if (userCount && userCount > 0) {
      console.log('Database already has users, skipping seed');
      return NextResponse.json({ message: 'Database already set up', skipped: true });
    }

    // ============================================
    // FIRST TIME SETUP ONLY - NO PRODUCTS/CUSTOMERS/SUPPLIERS
    // ============================================
    console.log('First time setup - creating users and settings only...');

    // Create default categories only if they don't exist
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('name');
    
    const existingCategoryNames = (existingCategories || []).map(c => c.name);
    const categories = ['Beverages', 'Electronics', 'Grocery', 'Fashion', 'Other'];
    
    for (const cat of categories) {
      if (!existingCategoryNames.includes(cat)) {
        await supabase.from('categories').insert([{ name: cat }]);
        console.log('Created category:', cat);
      }
    }

    // Create default settings only if not exists
    const { data: existingSettings } = await supabase
      .from('app_settings')
      .select('id')
      .single();
    
    if (!existingSettings) {
      await supabase.from('app_settings').insert([{
        id: 'default-settings',
        shop_name: 'Dokan Enterprise',
        shop_address: '123 Business Avenue, Suite 100, City Center',
        shop_contact: '+880 1234 567890',
        shop_bio: 'Premium Quality - Retail & Wholesale',
        shop_services: 'Smartphones - Laptops - CCTV - Electronics Accessories - Repairing',
      }]);
      console.log('Created default settings');
    }

    // Create Master Admin user (The Creator/Owner)
    const masterExists = await checkExists('app_users', 'role', 'Master Admin');
    if (!masterExists) {
      await supabase.from('app_users').insert([{
        name: 'Master Admin',
        role: 'Master Admin',
        username: 'master',
        email: 'mdshantosarker353@gmail.com',
        password: '#shant0s#',
        is_active: true,
        permissions: ROLE_PERMISSIONS['Master Admin'],
      }]);
      console.log('Created Master Admin user');
    }

    // Create Admin user
    const adminExists = await checkExists('app_users', 'username', 'admin');
    if (!adminExists) {
      await supabase.from('app_users').insert([{
        name: 'Admin',
        role: 'Admin',
        username: 'admin',
        password: 'admin123',
        is_active: true,
        permissions: ROLE_PERMISSIONS['Admin'],
      }]);
      console.log('Created Admin user');
    }

    // Create sample users for other roles
    const sampleUsers = [
      { name: 'Demo Manager', role: 'Manager', username: 'manager', password: 'manager123', permissions: ROLE_PERMISSIONS['Manager'] },
      { name: 'Demo Staff', role: 'Staff', username: 'staff', password: 'staff123', permissions: ROLE_PERMISSIONS['Staff'] },
      { name: 'Demo Seller', role: 'Seller', username: 'seller', password: 'seller123', permissions: ROLE_PERMISSIONS['Seller'] },
      { name: 'Demo Viewer', role: 'Viewer', username: 'viewer', password: 'viewer123', permissions: ROLE_PERMISSIONS['Viewer'] },
    ];

    for (const user of sampleUsers) {
      const exists = await checkExists('app_users', 'username', user.username);
      if (!exists) {
        await supabase.from('app_users').insert([{
          name: user.name,
          role: user.role,
          username: user.username,
          password: user.password,
          is_active: true,
          permissions: user.permissions,
        }]);
        console.log(`Created ${user.role} user`);
      }
    }

    // NO PRODUCTS, CUSTOMERS, SUPPLIERS - USER WILL ADD THEIR OWN
    console.log('Setup complete - no sample data added');

    return NextResponse.json({ message: 'Database setup complete - ready for use' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to setup database', details: String(error) }, { status: 500 });
  }
}
