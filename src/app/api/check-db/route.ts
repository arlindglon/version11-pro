import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
  const results: Record<string, unknown> = {};
  
  // Check products table
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .limit(1);
  
  results.products = {
    exists: !productsError,
    error: productsError?.message,
    columns: products && products.length > 0 ? Object.keys(products[0]) : [],
    sampleData: products
  };
  
  // Check customers table
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .limit(1);
  
  results.customers = {
    exists: !customersError,
    error: customersError?.message,
    columns: customers && customers.length > 0 ? Object.keys(customers[0]) : []
  };
  
  // Check suppliers table  
  const { data: suppliers, error: suppliersError } = await supabase
    .from('suppliers')
    .select('*')
    .limit(1);
  
  results.suppliers = {
    exists: !suppliersError,
    error: suppliersError?.message,
    columns: suppliers && suppliers.length > 0 ? Object.keys(suppliers[0]) : []
  };
  
  // Check sales table
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('*')
    .limit(1);
  
  results.sales = {
    exists: !salesError,
    error: salesError?.message,
    columns: sales && sales.length > 0 ? Object.keys(sales[0]) : []
  };
  
  // Check purchases table
  const { data: purchases, error: purchasesError } = await supabase
    .from('purchases')
    .select('*')
    .limit(1);
  
  results.purchases = {
    exists: !purchasesError,
    error: purchasesError?.message,
    columns: purchases && purchases.length > 0 ? Object.keys(purchases[0]) : []
  };

  // Check app_users table
  const { data: users, error: usersError } = await supabase
    .from('app_users')
    .select('*')
    .limit(1);
  
  results.app_users = {
    exists: !usersError,
    error: usersError?.message,
    columns: users && users.length > 0 ? Object.keys(users[0]) : []
  };
  
  return NextResponse.json(results, { status: 200 });
}
