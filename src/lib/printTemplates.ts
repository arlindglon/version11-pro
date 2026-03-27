import { PrintTemplate, PrintTemplateElement, Sale, AppSettings, Purchase } from '@/types';

// Generate unique ID
export const generateId = () => Math.random().toString(36).substring(2, 11);

// Get default purchase template
export function getDefaultPurchaseTemplate(): PrintTemplate {
  const templates = getTemplates();
  const purchaseTemplate = templates.find(t => t.type === 'purchase' && t.isActive);
  if (purchaseTemplate) return purchaseTemplate;
  return templates.find(t => t.isDefault && t.isActive) || getDefaultTemplate();
}

// All available template variables - Extended with social media, bank details, QR code, etc.
export const TEMPLATE_VARIABLES = {
  shop: [
    { key: '{{shop_name}}', label: 'Shop Name', example: 'My Shop', category: 'basic' },
    { key: '{{shop_address}}', label: 'Shop Address', example: '123 Business Street', category: 'basic' },
    { key: '{{shop_phone}}', label: 'Shop Phone', example: '+880 1234 567890', category: 'basic' },
    { key: '{{shop_email}}', label: 'Shop Email', example: 'info@myshop.com', category: 'basic' },
    { key: '{{shop_logo}}', label: 'Shop Logo URL', example: '/logo.png', category: 'media' },
    { key: '{{shop_tagline}}', label: 'Shop Tagline/Bio', example: 'Quality Products', category: 'basic' },
    { key: '{{shop_website}}', label: 'Website', example: 'www.myshop.com', category: 'basic' },
    { key: '{{tax_id}}', label: 'Tax ID/VAT No', example: 'VAT-123456', category: 'business' },
    { key: '{{registration_no}}', label: 'Registration No', example: 'REG-789', category: 'business' },
    { key: '{{opening_hours}}', label: 'Opening Hours', example: '9AM - 10PM', category: 'basic' },
  ],
  social: [
    { key: '{{facebook}}', label: 'Facebook', example: 'facebook.com/myshop', category: 'social' },
    { key: '{{instagram}}', label: 'Instagram', example: '@myshop', category: 'social' },
    { key: '{{whatsapp}}', label: 'WhatsApp', example: '+880 1234567890', category: 'social' },
    { key: '{{youtube}}', label: 'YouTube', example: 'youtube.com/myshop', category: 'social' },
  ],
  bank: [
    { key: '{{bank_name}}', label: 'Bank Name', example: 'City Bank', category: 'bank' },
    { key: '{{bank_account}}', label: 'Account Number', example: '1234567890', category: 'bank' },
    { key: '{{bank_account_name}}', label: 'Account Name', example: 'My Shop Ltd', category: 'bank' },
    { key: '{{bank_branch}}', label: 'Bank Branch', example: 'Main Branch', category: 'bank' },
  ],
  invoice: [
    { key: '{{invoice_number}}', label: 'Invoice Number', example: 'INV-001', category: 'invoice' },
    { key: '{{invoice_date}}', label: 'Invoice Date', example: '15/01/2025', category: 'invoice' },
    { key: '{{invoice_time}}', label: 'Invoice Time', example: '14:30', category: 'invoice' },
    { key: '{{invoice_datetime}}', label: 'Date & Time', example: '15/01/2025 14:30', category: 'invoice' },
    { key: '{{print_date}}', label: 'Print Date', example: '15/01/2025', category: 'invoice' },
    { key: '{{print_time}}', label: 'Print Time', example: '14:30', category: 'invoice' },
  ],
  customer: [
    { key: '{{customer_name}}', label: 'Customer Name', example: 'John Doe', category: 'customer' },
    { key: '{{customer_phone}}', label: 'Customer Phone', example: '+880 1987654321', category: 'customer' },
    { key: '{{customer_address}}', label: 'Customer Address', example: '456 Customer Rd', category: 'customer' },
    { key: '{{supplier_name}}', label: 'Supplier Name (Purchase)', example: 'ABC Supplier', category: 'customer' },
  ],
  items: [
    { key: '{{items_table}}', label: 'Items Table', example: '[Items List]', category: 'items' },
    { key: '{{items_count}}', label: 'Total Items', example: '5', category: 'items' },
    { key: '{{total_quantity}}', label: 'Total Quantity', example: '12', category: 'items' },
  ],
  totals: [
    { key: '{{subtotal}}', label: 'Subtotal', example: '৳1,000.00', category: 'totals' },
    { key: '{{discount}}', label: 'Total Discount', example: '৳100.00', category: 'totals' },
    { key: '{{tax}}', label: 'Tax Amount', example: '৳50.00', category: 'totals' },
    { key: '{{total}}', label: 'Grand Total', example: '৳950.00', category: 'totals' },
  ],
  payment: [
    { key: '{{paid}}', label: 'Amount Paid', example: '৳1,000.00', category: 'payment' },
    { key: '{{due}}', label: 'Amount Due', example: '৳0.00', category: 'payment' },
    { key: '{{change}}', label: 'Change', example: '৳50.00', category: 'payment' },
    { key: '{{payment_method}}', label: 'Payment Method', example: 'Cash', category: 'payment' },
    { key: '{{payment_status}}', label: 'Payment Status', example: 'Paid', category: 'payment' },
  ],
  qr_barcode: [
    { key: '{{barcode}}', label: 'Barcode (Visual)', example: '||| ||| |||', category: 'qr' },
    { key: '{{qr_code}}', label: 'QR Code', example: '[QR]', category: 'qr' },
    { key: '{{qr_link}}', label: 'QR Link (URL)', example: 'https://myshop.com/track/INV-001', category: 'qr' },
  ],
  other: [
    { key: '{{footer_text}}', label: 'Footer Text', example: 'Thank you for shopping!', category: 'other' },
    { key: '{{served_by}}', label: 'Served By', example: 'System', category: 'other' },
    { key: '{{notes}}', label: 'Notes', example: 'Special instructions', category: 'other' },
  ],
};

// ==================== HIGH QUALITY TEMPLATES ====================
// 15 Beautiful, Eye-Catching Templates for Different Use Cases

export const READY_MADE_TEMPLATES: PrintTemplate[] = [
  // ==================== THERMAL 58mm TEMPLATES ====================
  
  // Template 1: Thermal 58mm - Minimal Clean
  {
    id: 'thermal-58-minimal',
    name: '58mm - Minimal Clean',
    type: 'invoice',
    paperSize: 'thermal-58',
    width: 58,
    isDefault: false,
    isActive: true,
    margin: { top: 2, right: 2, bottom: 2, left: 2 },
    elements: [
      { id: '1', type: 'text', content: '{{shop_name}}', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '2', type: 'text', content: '{{shop_address}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '3', type: 'text', content: 'Tel: {{shop_phone}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '4', type: 'line', style: {} },
      { id: '5', type: 'text', content: 'Invoice: {{invoice_number}}', style: { fontSize: '9px' } },
      { id: '6', type: 'text', content: 'Date: {{invoice_date}} {{invoice_time}}', style: { fontSize: '9px' } },
      { id: '7', type: 'line', style: {} },
      { id: '8', type: 'table', content: '{{items_table}}' },
      { id: '9', type: 'line', style: {} },
      { id: '10', type: 'text', content: 'TOTAL: {{total}}', style: { fontSize: '12px', fontWeight: 'bold', textAlign: 'right' } },
      { id: '11', type: 'spacer', style: { height: '5px' } },
      { id: '12', type: 'text', content: '{{footer_text}}', style: { fontSize: '8px', textAlign: 'center' } },
      { id: '13', type: 'text', content: 'Served by: {{served_by}}', style: { fontSize: '8px', textAlign: 'center' } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // Template 2: Thermal 58mm - Compact
  {
    id: 'thermal-58-compact',
    name: '58mm - Ultra Compact',
    type: 'invoice',
    paperSize: 'thermal-58',
    width: 58,
    isDefault: false,
    isActive: true,
    margin: { top: 1, right: 1, bottom: 1, left: 1 },
    elements: [
      { id: '1', type: 'text', content: '{{shop_name}}', style: { fontSize: '12px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '2', type: 'text', content: 'Tel: {{shop_phone}}', style: { fontSize: '8px', textAlign: 'center' } },
      { id: '3', type: 'text', content: '════════════════════', style: { fontSize: '8px', textAlign: 'center' } },
      { id: '4', type: 'text', content: '#{{invoice_number}} | {{invoice_date}}', style: { fontSize: '8px', textAlign: 'center' } },
      { id: '5', type: 'table', content: '{{items_table}}' },
      { id: '6', type: 'text', content: '─────────────────', style: { fontSize: '8px', textAlign: 'center' } },
      { id: '7', type: 'text', content: 'TOTAL: {{total}}', style: { fontSize: '11px', fontWeight: 'bold', textAlign: 'right' } },
      { id: '8', type: 'text', content: 'Paid: {{paid}} | Due: {{due}}', style: { fontSize: '8px', textAlign: 'right' } },
      { id: '9', type: 'text', content: '{{footer_text}}', style: { fontSize: '7px', textAlign: 'center' } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // ==================== THERMAL 80mm TEMPLATES ====================
  
  // Template 3: Thermal 80mm - Standard Professional (DEFAULT)
  {
    id: 'thermal-80-standard',
    name: '80mm - Standard Pro',
    type: 'invoice',
    paperSize: 'thermal-80',
    width: 80,
    isDefault: true,
    isActive: true,
    margin: { top: 3, right: 3, bottom: 3, left: 3 },
    elements: [
      // Header
      { id: '1', type: 'text', content: '{{shop_name}}', style: { fontSize: '18px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '2', type: 'text', content: '{{shop_address}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '3', type: 'text', content: 'Tel: {{shop_phone}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '4', type: 'text', content: 'Email: {{shop_email}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '5', type: 'text', content: '════════════════════════════════════', style: { fontSize: '10px', textAlign: 'center' } },
      
      // Invoice Info
      { id: '6', type: 'text', content: 'INVOICE: {{invoice_number}}', style: { fontSize: '12px', fontWeight: 'bold' } },
      { id: '7', type: 'text', content: 'Date: {{invoice_date}}  Time: {{invoice_time}}', style: { fontSize: '10px' } },
      { id: '8', type: 'text', content: 'Customer: {{customer_name}}', style: { fontSize: '10px' } },
      { id: '9', type: 'line', style: {} },
      
      // Items
      { id: '10', type: 'table', content: '{{items_table}}' },
      { id: '11', type: 'text', content: '════════════════════════════════════', style: { fontSize: '10px', textAlign: 'center' } },
      
      // Totals
      { id: '12', type: 'text', content: 'Subtotal: {{subtotal}}', style: { fontSize: '10px', textAlign: 'right' } },
      { id: '13', type: 'text', content: 'Discount: {{discount}}', style: { fontSize: '10px', textAlign: 'right' } },
      { id: '14', type: 'text', content: 'Tax: {{tax}}', style: { fontSize: '10px', textAlign: 'right' } },
      { id: '15', type: 'text', content: '╔════════════════════════════════════╗', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '16', type: 'text', content: '║  GRAND TOTAL: {{total}}  ║', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '17', type: 'text', content: '╚════════════════════════════════════╝', style: { fontSize: '10px', textAlign: 'center' } },
      
      // Payment
      { id: '18', type: 'spacer', style: { height: '5px' } },
      { id: '19', type: 'text', content: 'Payment: {{payment_method}}', style: { fontSize: '10px' } },
      { id: '20', type: 'text', content: 'Paid: {{paid}}  |  Due: {{due}}', style: { fontSize: '10px', textAlign: 'right' } },
      { id: '21', type: 'spacer', style: { height: '8px' } },
      
      // Footer
      { id: '22', type: 'text', content: '{{footer_text}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '23', type: 'text', content: 'Thank you for shopping with us!', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '24', type: 'text', content: 'Served by: {{served_by}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '25', type: 'barcode', content: '{{invoice_number}}', style: {} },
      { id: '26', type: 'text', content: 'Printed: {{print_date}} {{print_time}}', style: { fontSize: '8px', textAlign: 'center', color: '#999' } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Template 4: Thermal 80mm - Premium Elegant
  {
    id: 'thermal-80-premium',
    name: '80mm - Premium Elegant',
    type: 'invoice',
    paperSize: 'thermal-80',
    width: 80,
    isDefault: false,
    isActive: true,
    margin: { top: 4, right: 4, bottom: 4, left: 4 },
    elements: [
      // Logo & Header
      { id: '1', type: 'image', content: '{{shop_logo}}', style: { width: '50px', height: '50px', margin: '0 auto' } },
      { id: '2', type: 'spacer', style: { height: '5px' } },
      { id: '3', type: 'text', content: '{{shop_name}}', style: { fontSize: '20px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '4', type: 'text', content: '✦ {{shop_tagline}} ✦', style: { fontSize: '10px', textAlign: 'center', fontStyle: 'italic', color: '#555' } },
      { id: '5', type: 'text', content: '{{shop_address}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '6', type: 'text', content: '📞 {{shop_phone}} | ✉ {{shop_email}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '7', type: 'text', content: '🌐 {{shop_website}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '8', type: 'text', content: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', style: { fontSize: '10px', textAlign: 'center' } },
      
      // Invoice Title
      { id: '9', type: 'text', content: '★ TAX INVOICE ★', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '10', type: 'text', content: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '11', type: 'spacer', style: { height: '5px' } },
      
      // Invoice Details
      { id: '12', type: 'text', content: 'Invoice No: {{invoice_number}}', style: { fontSize: '11px', fontWeight: 'bold' } },
      { id: '13', type: 'text', content: 'Date: {{invoice_date}}  Time: {{invoice_time}}', style: { fontSize: '10px' } },
      { id: '14', type: 'line', style: {} },
      
      // Customer Info
      { id: '15', type: 'text', content: 'Bill To:', style: { fontSize: '10px', fontWeight: 'bold' } },
      { id: '16', type: 'text', content: '  {{customer_name}}', style: { fontSize: '10px' } },
      { id: '17', type: 'text', content: '  {{customer_phone}}', style: { fontSize: '9px', color: '#666' } },
      { id: '18', type: 'text', content: '────────────────────────────────────', style: { fontSize: '10px', textAlign: 'center' } },
      
      // Items
      { id: '19', type: 'table', content: '{{items_table}}' },
      { id: '20', type: 'text', content: '────────────────────────────────────', style: { fontSize: '10px', textAlign: 'center' } },
      
      // Summary
      { id: '21', type: 'text', content: 'Items: {{items_count}} | Qty: {{total_quantity}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '22', type: 'spacer', style: { height: '5px' } },
      
      // Totals
      { id: '23', type: 'text', content: 'Subtotal: {{subtotal}}', style: { fontSize: '10px', textAlign: 'right' } },
      { id: '24', type: 'text', content: 'Discount: -{{discount}}', style: { fontSize: '10px', textAlign: 'right', color: '#c00' } },
      { id: '25', type: 'text', content: 'Tax (VAT): {{tax}}', style: { fontSize: '10px', textAlign: 'right' } },
      { id: '26', type: 'text', content: '╔════════════════════════════════════╗', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '27', type: 'text', content: '║  TOTAL: {{total}}  ║', style: { fontSize: '16px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '28', type: 'text', content: '╚════════════════════════════════════╝', style: { fontSize: '10px', textAlign: 'center' } },
      
      // Payment Info
      { id: '29', type: 'spacer', style: { height: '5px' } },
      { id: '30', type: 'text', content: '━━━ Payment Details ━━━', style: { fontSize: '10px', textAlign: 'center', fontWeight: 'bold' } },
      { id: '31', type: 'text', content: 'Method: {{payment_method}} | Status: {{payment_status}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '32', type: 'text', content: 'Paid: {{paid}} | Due: {{due}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '33', type: 'spacer', style: { height: '10px' } },
      
      // QR Code & Barcode
      { id: '34', type: 'barcode', content: '{{invoice_number}}', style: {} },
      { id: '35', type: 'qrcode', content: '{{qr_link}}', style: {} },
      { id: '36', type: 'spacer', style: { height: '10px' } },
      
      // Social Media
      { id: '37', type: 'text', content: '━━━ Follow Us ━━━', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '38', type: 'text', content: '📘 {{facebook}}  📷 {{instagram}}', style: { fontSize: '8px', textAlign: 'center' } },
      { id: '39', type: 'text', content: '📱 WhatsApp: {{whatsapp}}', style: { fontSize: '8px', textAlign: 'center' } },
      { id: '40', type: 'spacer', style: { height: '10px' } },
      
      // Footer
      { id: '41', type: 'text', content: '{{footer_text}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '42', type: 'text', content: 'Opening Hours: {{opening_hours}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '43', type: 'text', content: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '44', type: 'text', content: 'Served by: {{served_by}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '45', type: 'text', content: 'Printed: {{print_date}} {{print_time}}', style: { fontSize: '8px', textAlign: 'center', color: '#999' } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Template 5: Thermal 80mm - Modern Minimal
  {
    id: 'thermal-80-modern',
    name: '80mm - Modern Minimal',
    type: 'invoice',
    paperSize: 'thermal-80',
    width: 80,
    isDefault: false,
    isActive: true,
    margin: { top: 3, right: 3, bottom: 3, left: 3 },
    elements: [
      { id: '1', type: 'text', content: '┌────────────────────────────────┐', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '2', type: 'text', content: '│  {{shop_name}}  │', style: { fontSize: '16px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '3', type: 'text', content: '│  {{shop_address}}  │', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '4', type: 'text', content: '│  📞 {{shop_phone}}  │', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '5', type: 'text', content: '└────────────────────────────────┘', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '6', type: 'spacer', style: { height: '5px' } },
      { id: '7', type: 'text', content: '# {{invoice_number}}', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '8', type: 'text', content: '{{invoice_date}} | {{invoice_time}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '9', type: 'line', style: {} },
      { id: '10', type: 'table', content: '{{items_table}}' },
      { id: '11', type: 'line', style: {} },
      { id: '12', type: 'text', content: '┌────────────────────────────────┐', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '13', type: 'text', content: '│  TOTAL: {{total}}  │', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '14', type: 'text', content: '└────────────────────────────────┘', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '15', type: 'text', content: '{{payment_method}}: {{paid}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '16', type: 'spacer', style: { height: '8px' } },
      { id: '17', type: 'text', content: '{{footer_text}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '18', type: 'text', content: '{{print_date}} {{print_time}}', style: { fontSize: '8px', textAlign: 'center', color: '#999' } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Template 6: Thermal 80mm - Compact Receipt
  {
    id: 'thermal-80-compact',
    name: '80mm - Quick Receipt',
    type: 'receipt',
    paperSize: 'thermal-80',
    width: 80,
    isDefault: false,
    isActive: true,
    margin: { top: 2, right: 2, bottom: 2, left: 2 },
    elements: [
      { id: '1', type: 'text', content: '{{shop_name}}', style: { fontSize: '16px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '2', type: 'text', content: 'Tel: {{shop_phone}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '3', type: 'line', style: {} },
      { id: '4', type: 'text', content: 'Invoice: {{invoice_number}} | {{invoice_date}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '5', type: 'table', content: '{{items_table}}' },
      { id: '6', type: 'line', style: {} },
      { id: '7', type: 'text', content: 'TOTAL: {{total}}', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'right' } },
      { id: '8', type: 'text', content: '{{payment_method}}: {{paid}}', style: { fontSize: '10px', textAlign: 'right' } },
      { id: '9', type: 'spacer', style: { height: '5px' } },
      { id: '10', type: 'text', content: '{{footer_text}}', style: { fontSize: '9px', textAlign: 'center' } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Template 7: Thermal 80mm - With Bank Details
  {
    id: 'thermal-80-bank',
    name: '80mm - With Bank Info',
    type: 'invoice',
    paperSize: 'thermal-80',
    width: 80,
    isDefault: false,
    isActive: true,
    margin: { top: 3, right: 3, bottom: 3, left: 3 },
    elements: [
      { id: '1', type: 'text', content: '{{shop_name}}', style: { fontSize: '16px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '2', type: 'text', content: '{{shop_address}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '3', type: 'text', content: 'Tel: {{shop_phone}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '4', type: 'text', content: '════════════════════════════════════', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '5', type: 'text', content: 'Invoice: {{invoice_number}}', style: { fontSize: '11px', fontWeight: 'bold' } },
      { id: '6', type: 'text', content: 'Date: {{invoice_date}} {{invoice_time}}', style: { fontSize: '10px' } },
      { id: '7', type: 'text', content: 'Customer: {{customer_name}}', style: { fontSize: '10px' } },
      { id: '8', type: 'line', style: {} },
      { id: '9', type: 'table', content: '{{items_table}}' },
      { id: '10', type: 'text', content: '════════════════════════════════════', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '11', type: 'text', content: 'TOTAL: {{total}}', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'right' } },
      { id: '12', type: 'text', content: 'Paid: {{paid}} | Due: {{due}}', style: { fontSize: '10px', textAlign: 'right' } },
      { id: '13', type: 'spacer', style: { height: '8px' } },
      { id: '14', type: 'text', content: '━━━━ Bank Details ━━━━', style: { fontSize: '10px', textAlign: 'center', fontWeight: 'bold' } },
      { id: '15', type: 'text', content: 'Bank: {{bank_name}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '16', type: 'text', content: 'A/C: {{bank_account}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '17', type: 'text', content: 'Name: {{bank_account_name}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '18', type: 'text', content: 'Branch: {{bank_branch}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '19', type: 'spacer', style: { height: '8px' } },
      { id: '20', type: 'text', content: '{{footer_text}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '21', type: 'qrcode', content: '{{qr_link}}', style: {} },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Template 8: Thermal 80mm - Social Media Focus
  {
    id: 'thermal-80-social',
    name: '80mm - Social Focus',
    type: 'invoice',
    paperSize: 'thermal-80',
    width: 80,
    isDefault: false,
    isActive: true,
    margin: { top: 3, right: 3, bottom: 3, left: 3 },
    elements: [
      { id: '1', type: 'image', content: '{{shop_logo}}', style: { width: '40px', height: '40px', margin: '0 auto' } },
      { id: '2', type: 'text', content: '{{shop_name}}', style: { fontSize: '16px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '3', type: 'text', content: '{{shop_tagline}}', style: { fontSize: '9px', textAlign: 'center', fontStyle: 'italic' } },
      { id: '4', type: 'text', content: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '5', type: 'text', content: 'Invoice: {{invoice_number}} | {{invoice_date}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '6', type: 'line', style: {} },
      { id: '7', type: 'table', content: '{{items_table}}' },
      { id: '8', type: 'line', style: {} },
      { id: '9', type: 'text', content: 'TOTAL: {{total}}', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'right' } },
      { id: '10', type: 'spacer', style: { height: '10px' } },
      { id: '11', type: 'text', content: '━━━ Connect With Us ━━━', style: { fontSize: '10px', textAlign: 'center', fontWeight: 'bold' } },
      { id: '12', type: 'text', content: '📘 Facebook: {{facebook}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '13', type: 'text', content: '📷 Instagram: {{instagram}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '14', type: 'text', content: '📱 WhatsApp: {{whatsapp}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '15', type: 'text', content: '▶️ YouTube: {{youtube}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '16', type: 'text', content: '🌐 Website: {{shop_website}}', style: { fontSize: '9px', textAlign: 'center' } },
      { id: '17', type: 'spacer', style: { height: '8px' } },
      { id: '18', type: 'qrcode', content: '{{qr_link}}', style: {} },
      { id: '19', type: 'text', content: 'Scan for more info!', style: { fontSize: '8px', textAlign: 'center' } },
      { id: '20', type: 'text', content: '{{footer_text}}', style: { fontSize: '9px', textAlign: 'center' } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Template 9: Thermal 80mm - Gift Receipt
  {
    id: 'thermal-80-gift',
    name: '80mm - Gift Receipt',
    type: 'receipt',
    paperSize: 'thermal-80',
    width: 80,
    isDefault: false,
    isActive: true,
    margin: { top: 4, right: 4, bottom: 4, left: 4 },
    elements: [
      { id: '1', type: 'text', content: '✨ GIFT RECEIPT ✨', style: { fontSize: '16px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '2', type: 'text', content: '════════════════════════════════════', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '3', type: 'text', content: '{{shop_name}}', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '4', type: 'text', content: '{{shop_address}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '5', type: 'text', content: 'Tel: {{shop_phone}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '6', type: 'spacer', style: { height: '10px' } },
      { id: '7', type: 'text', content: 'Receipt #: {{invoice_number}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '8', type: 'text', content: 'Date: {{invoice_date}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '9', type: 'line', style: {} },
      { id: '10', type: 'table', content: '{{items_table}}' },
      { id: '11', type: 'line', style: {} },
      { id: '12', type: 'text', content: 'Total Items: {{items_count}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '13', type: 'spacer', style: { height: '10px' } },
      { id: '14', type: 'text', content: '🎁 This is a gift receipt 🎁', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '15', type: 'text', content: 'Prices have been hidden', style: { fontSize: '9px', textAlign: 'center', color: '#666' } },
      { id: '16', type: 'spacer', style: { height: '10px' } },
      { id: '17', type: 'text', content: '{{footer_text}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '18', type: 'text', content: 'Thank you for shopping with us!', style: { fontSize: '10px', textAlign: 'center' } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Template 10: Thermal 80mm - Purchase Order
  {
    id: 'thermal-80-purchase',
    name: '80mm - Purchase Order',
    type: 'purchase',
    paperSize: 'thermal-80',
    width: 80,
    isDefault: false,
    isActive: true,
    margin: { top: 3, right: 3, bottom: 3, left: 3 },
    elements: [
      { id: '1', type: 'text', content: '━━ PURCHASE ORDER ━━', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '2', type: 'text', content: '{{shop_name}}', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '3', type: 'text', content: '════════════════════════════════════', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '4', type: 'text', content: 'PO #: {{invoice_number}}', style: { fontSize: '11px', fontWeight: 'bold' } },
      { id: '5', type: 'text', content: 'Date: {{invoice_date}}', style: { fontSize: '10px' } },
      { id: '6', type: 'line', style: {} },
      { id: '7', type: 'text', content: 'Supplier: {{supplier_name}}', style: { fontSize: '10px', fontWeight: 'bold' } },
      { id: '8', type: 'line', style: {} },
      { id: '9', type: 'table', content: '{{items_table}}' },
      { id: '10', type: 'text', content: '════════════════════════════════════', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '11', type: 'text', content: 'Subtotal: {{subtotal}}', style: { fontSize: '10px', textAlign: 'right' } },
      { id: '12', type: 'text', content: 'Discount: {{discount}}', style: { fontSize: '10px', textAlign: 'right' } },
      { id: '13', type: 'text', content: 'TOTAL: {{total}}', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'right' } },
      { id: '14', type: 'spacer', style: { height: '5px' } },
      { id: '15', type: 'text', content: 'Paid: {{paid}} | Due: {{due}}', style: { fontSize: '10px', textAlign: 'right' } },
      { id: '16', type: 'spacer', style: { height: '8px' } },
      { id: '17', type: 'text', content: 'Status: {{payment_status}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '18', type: 'barcode', content: '{{invoice_number}}', style: {} },
      { id: '19', type: 'text', content: 'Printed: {{print_date}} {{print_time}}', style: { fontSize: '8px', textAlign: 'center', color: '#999' } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // ==================== A4 TEMPLATES ====================
  
  // Template 11: A4 - Professional Invoice
  {
    id: 'a4-professional',
    name: 'A4 - Professional Invoice',
    type: 'invoice',
    paperSize: 'a4',
    width: 210,
    isDefault: false,
    isActive: true,
    margin: { top: 15, right: 15, bottom: 15, left: 15 },
    customCSS: `
      .invoice-header { border-bottom: 3px double #333; padding-bottom: 15px; margin-bottom: 15px; }
      .total-row { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; }
    `,
    elements: [
      // Header
      { id: '1', type: 'image', content: '{{shop_logo}}', style: { width: '80px', height: '80px', marginBottom: '10px' } },
      { id: '2', type: 'text', content: '{{shop_name}}', style: { fontSize: '28px', fontWeight: 'bold', color: '#1a1a1a' } },
      { id: '3', type: 'text', content: '{{shop_tagline}}', style: { fontSize: '12px', color: '#666', fontStyle: 'italic' } },
      { id: '4', type: 'text', content: '{{shop_address}}', style: { fontSize: '12px', color: '#555' } },
      { id: '5', type: 'text', content: '📞 {{shop_phone}} | ✉ {{shop_email}}', style: { fontSize: '11px', color: '#555' } },
      { id: '6', type: 'text', content: '🌐 {{shop_website}}', style: { fontSize: '11px', color: '#555' } },
      { id: '7', type: 'text', content: 'VAT/Tax ID: {{tax_id}} | Reg: {{registration_no}}', style: { fontSize: '11px', color: '#555' } },
      { id: '8', type: 'spacer', style: { height: '20px' } },
      
      // Invoice Title
      { id: '9', type: 'text', content: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', style: { fontSize: '10px', textAlign: 'center', color: '#ccc' } },
      { id: '10', type: 'text', content: 'TAX INVOICE', style: { fontSize: '24px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '11', type: 'text', content: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', style: { fontSize: '10px', textAlign: 'center', color: '#ccc' } },
      { id: '12', type: 'spacer', style: { height: '15px' } },
      
      // Invoice Details - Two Column
      { id: '13', type: 'html', content: '<div style="display: flex; justify-content: space-between;"><div><strong style="font-size: 12px;">INVOICE DETAILS</strong><br/><span style="font-size: 11px;">Invoice No: {{invoice_number}}</span><br/><span style="font-size: 11px;">Date: {{invoice_date}}</span><br/><span style="font-size: 11px;">Time: {{invoice_time}}</span></div><div style="text-align: right;"><strong style="font-size: 12px;">BILL TO</strong><br/><span style="font-size: 11px;">{{customer_name}}</span><br/><span style="font-size: 11px;">{{customer_phone}}</span><br/><span style="font-size: 11px;">{{customer_address}}</span></div></div>', style: {} },
      { id: '14', type: 'spacer', style: { height: '15px' } },
      { id: '15', type: 'line', style: {} },
      
      // Items Table
      { id: '16', type: 'table', content: '{{items_table}}' },
      { id: '17', type: 'spacer', style: { height: '10px' } },
      
      // Totals
      { id: '18', type: 'html', content: '<div style="text-align: right; padding: 15px; background: #f9f9f9; border: 1px solid #eee; border-radius: 5px;"><div style="font-size: 11px;">Subtotal: {{subtotal}}</div><div style="font-size: 11px;">Discount: {{discount}}</div><div style="font-size: 11px;">Tax: {{tax}}</div><div style="font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px;">TOTAL: {{total}}</div></div>', style: {} },
      { id: '19', type: 'spacer', style: { height: '15px' } },
      
      // Payment Info
      { id: '20', type: 'text', content: '━━━ Payment Information ━━━', style: { fontSize: '12px', fontWeight: 'bold' } },
      { id: '21', type: 'text', content: 'Method: {{payment_method}} | Status: {{payment_status}}', style: { fontSize: '11px' } },
      { id: '22', type: 'text', content: 'Amount Paid: {{paid}} | Balance Due: {{due}}', style: { fontSize: '11px' } },
      { id: '23', type: 'spacer', style: { height: '20px' } },
      
      // Bank Details
      { id: '24', type: 'text', content: '━━━ Bank Details ━━━', style: { fontSize: '12px', fontWeight: 'bold' } },
      { id: '25', type: 'text', content: 'Bank: {{bank_name}} | A/C: {{bank_account}}', style: { fontSize: '11px' } },
      { id: '26', type: 'text', content: 'Account Name: {{bank_account_name}} | Branch: {{bank_branch}}', style: { fontSize: '11px' } },
      { id: '27', type: 'spacer', style: { height: '20px' } },
      
      // Footer
      { id: '28', type: 'text', content: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', style: { fontSize: '10px', textAlign: 'center', color: '#ccc' } },
      { id: '29', type: 'text', content: '{{footer_text}}', style: { fontSize: '12px', textAlign: 'center', color: '#555' } },
      { id: '30', type: 'text', content: 'Opening Hours: {{opening_hours}}', style: { fontSize: '11px', textAlign: 'center', color: '#666' } },
      { id: '31', type: 'spacer', style: { height: '10px' } },
      { id: '32', type: 'text', content: '📘 {{facebook}} | 📷 {{instagram}} | 📱 {{whatsapp}}', style: { fontSize: '10px', textAlign: 'center', color: '#888' } },
      { id: '33', type: 'spacer', style: { height: '15px' } },
      { id: '34', type: 'qrcode', content: '{{qr_link}}', style: {} },
      { id: '35', type: 'text', content: 'Served by: {{served_by}}', style: { fontSize: '10px', textAlign: 'center', color: '#888' } },
      { id: '36', type: 'text', content: 'Printed: {{print_date}} {{print_time}}', style: { fontSize: '10px', textAlign: 'center', color: '#aaa' } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Template 12: A4 - Modern Corporate
  {
    id: 'a4-modern',
    name: 'A4 - Modern Corporate',
    type: 'invoice',
    paperSize: 'a4',
    width: 210,
    isDefault: false,
    isActive: true,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    elements: [
      // Header with Logo
      { id: '1', type: 'html', content: '<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1a1a1a; padding-bottom: 20px;"><div><div style="font-size: 32px; font-weight: bold;">{{shop_name}}</div><div style="font-size: 12px; color: #666; font-style: italic;">{{shop_tagline}}</div></div><div style="text-align: right;"><div style="font-size: 12px;">{{shop_address}}</div><div style="font-size: 11px;">📞 {{shop_phone}}</div><div style="font-size: 11px;">✉ {{shop_email}}</div></div></div>', style: {} },
      { id: '2', type: 'spacer', style: { height: '20px' } },
      
      // Invoice Title
      { id: '3', type: 'text', content: 'INVOICE', style: { fontSize: '36px', fontWeight: 'bold', textAlign: 'center', color: '#1a1a1a' } },
      { id: '4', type: 'text', content: '#{{invoice_number}}', style: { fontSize: '16px', textAlign: 'center', color: '#666' } },
      { id: '5', type: 'spacer', style: { height: '20px' } },
      
      // Details
      { id: '6', type: 'html', content: '<div style="display: flex; justify-content: space-between;"><div style="background: #f5f5f5; padding: 15px; border-radius: 8px; width: 45%;"><div style="font-size: 11px; font-weight: bold; color: #888; margin-bottom: 8px;">BILL TO</div><div style="font-size: 14px; font-weight: bold;">{{customer_name}}</div><div style="font-size: 11px; color: #666;">{{customer_phone}}</div><div style="font-size: 11px; color: #666;">{{customer_address}}</div></div><div style="background: #1a1a1a; color: white; padding: 15px; border-radius: 8px; width: 45%;"><div style="font-size: 11px; color: #aaa; margin-bottom: 8px;">INVOICE DETAILS</div><div style="font-size: 11px;">Date: {{invoice_date}}</div><div style="font-size: 11px;">Time: {{invoice_time}}</div><div style="font-size: 11px;">Status: {{payment_status}}</div></div></div>', style: {} },
      { id: '7', type: 'spacer', style: { height: '20px' } },
      
      // Items
      { id: '8', type: 'table', content: '{{items_table}}' },
      { id: '9', type: 'spacer', style: { height: '15px' } },
      
      // Totals
      { id: '10', type: 'html', content: '<div style="display: flex; justify-content: flex-end;"><div style="width: 300px; background: #f9f9f9; padding: 15px; border-radius: 8px;"><div style="display: flex; justify-content: space-between; font-size: 11px; padding: 5px 0;"><span>Subtotal:</span><span>{{subtotal}}</span></div><div style="display: flex; justify-content: space-between; font-size: 11px; padding: 5px 0;"><span>Discount:</span><span>{{discount}}</span></div><div style="display: flex; justify-content: space-between; font-size: 11px; padding: 5px 0;"><span>Tax:</span><span>{{tax}}</span></div><div style="border-top: 2px solid #1a1a1a; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;"><span>TOTAL:</span><span>{{total}}</span></div><div style="display: flex; justify-content: space-between; font-size: 11px; padding: 5px 0; color: #16a34a;"><span>Paid:</span><span>{{paid}}</span></div><div style="display: flex; justify-content: space-between; font-size: 11px; padding: 5px 0; color: #dc2626;"><span>Due:</span><span>{{due}}</span></div></div></div>', style: {} },
      { id: '11', type: 'spacer', style: { height: '30px' } },
      
      // Bank & Social
      { id: '12', type: 'html', content: '<div style="display: flex; justify-content: space-between; border-top: 1px solid #ddd; padding-top: 20px;"><div><div style="font-size: 11px; font-weight: bold; margin-bottom: 8px;">BANK DETAILS</div><div style="font-size: 10px;">Bank: {{bank_name}}</div><div style="font-size: 10px;">A/C: {{bank_account}}</div><div style="font-size: 10px;">Name: {{bank_account_name}}</div></div><div style="text-align: right;"><div style="font-size: 11px; font-weight: bold; margin-bottom: 8px;">CONNECT WITH US</div><div style="font-size: 10px;">📘 {{facebook}}</div><div style="font-size: 10px;">📷 {{instagram}}</div><div style="font-size: 10px;">📱 {{whatsapp}}</div></div></div>', style: {} },
      { id: '13', type: 'spacer', style: { height: '20px' } },
      
      // Footer
      { id: '14', type: 'text', content: '{{footer_text}}', style: { fontSize: '11px', textAlign: 'center', color: '#666' } },
      { id: '15', type: 'text', content: 'Opening Hours: {{opening_hours}} | 🌐 {{shop_website}}', style: { fontSize: '10px', textAlign: 'center', color: '#888' } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Template 13: A4 - Minimal Clean
  {
    id: 'a4-minimal',
    name: 'A4 - Minimal Clean',
    type: 'invoice',
    paperSize: 'a4',
    width: 210,
    isDefault: false,
    isActive: true,
    margin: { top: 25, right: 25, bottom: 25, left: 25 },
    elements: [
      { id: '1', type: 'text', content: '{{shop_name}}', style: { fontSize: '24px', fontWeight: 'bold' } },
      { id: '2', type: 'text', content: '{{shop_address}} | {{shop_phone}}', style: { fontSize: '11px', color: '#666' } },
      { id: '3', type: 'spacer', style: { height: '30px' } },
      { id: '4', type: 'text', content: 'Invoice #{{invoice_number}}', style: { fontSize: '18px', fontWeight: 'bold' } },
      { id: '5', type: 'text', content: '{{invoice_date}}', style: { fontSize: '12px', color: '#666' } },
      { id: '6', type: 'spacer', style: { height: '20px' } },
      { id: '7', type: 'text', content: 'Bill to: {{customer_name}}', style: { fontSize: '12px' } },
      { id: '8', type: 'spacer', style: { height: '20px' } },
      { id: '9', type: 'table', content: '{{items_table}}' },
      { id: '10', type: 'spacer', style: { height: '15px' } },
      { id: '11', type: 'text', content: 'Total: {{total}}', style: { fontSize: '16px', fontWeight: 'bold', textAlign: 'right' } },
      { id: '12', type: 'text', content: 'Paid: {{paid}} | Due: {{due}}', style: { fontSize: '11px', textAlign: 'right' } },
      { id: '13', type: 'spacer', style: { height: '40px' } },
      { id: '14', type: 'text', content: '{{footer_text}}', style: { fontSize: '11px', textAlign: 'center', color: '#888' } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // ==================== A5 TEMPLATES ====================
  
  // Template 14: A5 - Quotation
  {
    id: 'a5-quotation',
    name: 'A5 - Quotation',
    type: 'quotation',
    paperSize: 'a5',
    width: 148,
    isDefault: false,
    isActive: true,
    margin: { top: 12, right: 12, bottom: 12, left: 12 },
    elements: [
      { id: '1', type: 'text', content: '━━━ QUOTATION ━━━', style: { fontSize: '18px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '2', type: 'spacer', style: { height: '10px' } },
      { id: '3', type: 'text', content: '{{shop_name}}', style: { fontSize: '14px', fontWeight: 'bold' } },
      { id: '4', type: 'text', content: '{{shop_address}}', style: { fontSize: '10px', color: '#666' } },
      { id: '5', type: 'text', content: '📞 {{shop_phone}} | ✉ {{shop_email}}', style: { fontSize: '10px', color: '#666' } },
      { id: '6', type: 'spacer', style: { height: '10px' } },
      { id: '7', type: 'text', content: 'Quote #: {{invoice_number}}', style: { fontSize: '11px', fontWeight: 'bold' } },
      { id: '8', type: 'text', content: 'Date: {{invoice_date}}', style: { fontSize: '10px' } },
      { id: '9', type: 'text', content: 'Valid Until: 30 Days', style: { fontSize: '9px', color: '#e74c3c' } },
      { id: '10', type: 'spacer', style: { height: '10px' } },
      { id: '11', type: 'text', content: 'Customer: {{customer_name}}', style: { fontSize: '10px' } },
      { id: '12', type: 'text', content: 'Phone: {{customer_phone}}', style: { fontSize: '9px', color: '#666' } },
      { id: '13', type: 'line', style: {} },
      { id: '14', type: 'table', content: '{{items_table}}' },
      { id: '15', type: 'line', style: {} },
      { id: '16', type: 'text', content: 'Subtotal: {{subtotal}}', style: { fontSize: '10px', textAlign: 'right' } },
      { id: '17', type: 'text', content: 'Discount: {{discount}}', style: { fontSize: '10px', textAlign: 'right' } },
      { id: '18', type: 'text', content: 'TOTAL: {{total}}', style: { fontSize: '12px', fontWeight: 'bold', textAlign: 'right' } },
      { id: '19', type: 'spacer', style: { height: '15px' } },
      { id: '20', type: 'text', content: 'Terms & Conditions:', style: { fontSize: '10px', fontWeight: 'bold' } },
      { id: '21', type: 'text', content: '• Valid for 30 days from date', style: { fontSize: '9px', color: '#666' } },
      { id: '22', type: 'text', content: '• 50% advance, 50% on delivery', style: { fontSize: '9px', color: '#666' } },
      { id: '23', type: 'spacer', style: { height: '10px' } },
      { id: '24', type: 'text', content: '{{footer_text}}', style: { fontSize: '9px', textAlign: 'center', color: '#666' } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Template 15: A5 - Delivery Note
  {
    id: 'a5-delivery',
    name: 'A5 - Delivery Note',
    type: 'delivery',
    paperSize: 'a5',
    width: 148,
    isDefault: false,
    isActive: true,
    margin: { top: 12, right: 12, bottom: 12, left: 12 },
    elements: [
      { id: '1', type: 'text', content: '📦 DELIVERY NOTE 📦', style: { fontSize: '16px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '2', type: 'text', content: '═══════════════════════════════════════', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '3', type: 'text', content: '{{shop_name}}', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'center' } },
      { id: '4', type: 'text', content: '{{shop_address}} | Tel: {{shop_phone}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '5', type: 'spacer', style: { height: '10px' } },
      { id: '6', type: 'text', content: 'Delivery #: {{invoice_number}}', style: { fontSize: '11px', fontWeight: 'bold' } },
      { id: '7', type: 'text', content: 'Date: {{invoice_date}}', style: { fontSize: '10px' } },
      { id: '8', type: 'line', style: {} },
      { id: '9', type: 'text', content: 'Ship To:', style: { fontSize: '10px', fontWeight: 'bold' } },
      { id: '10', type: 'text', content: '{{customer_name}}', style: { fontSize: '11px' } },
      { id: '11', type: 'text', content: '{{customer_address}}', style: { fontSize: '10px', color: '#666' } },
      { id: '12', type: 'text', content: 'Phone: {{customer_phone}}', style: { fontSize: '10px', color: '#666' } },
      { id: '13', type: 'line', style: {} },
      { id: '14', type: 'table', content: '{{items_table}}' },
      { id: '15', type: 'line', style: {} },
      { id: '16', type: 'text', content: 'Total Items: {{items_count}} | Qty: {{total_quantity}}', style: { fontSize: '10px', textAlign: 'center' } },
      { id: '17', type: 'spacer', style: { height: '15px' } },
      { id: '18', type: 'text', content: 'Notes: {{notes}}', style: { fontSize: '10px', color: '#666' } },
      { id: '19', type: 'spacer', style: { height: '15px' } },
      { id: '20', type: 'html', content: '<div style="display: flex; justify-content: space-between; margin-top: 30px;"><div style="text-align: center; width: 45%;"><div style="border-top: 1px solid #333; padding-top: 5px; font-size: 10px;">Received By</div></div><div style="text-align: center; width: 45%;"><div style="border-top: 1px solid #333; padding-top: 5px; font-size: 10px;">Delivered By</div></div></div>', style: {} },
      { id: '21', type: 'spacer', style: { height: '10px' } },
      { id: '22', type: 'text', content: 'Printed: {{print_date}} {{print_time}}', style: { fontSize: '9px', textAlign: 'center', color: '#999' } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Get templates from localStorage or return defaults
export function getTemplates(): PrintTemplate[] {
  if (typeof window === 'undefined') return READY_MADE_TEMPLATES;
  
  const TEMPLATE_VERSION = '4.0'; // Updated with new templates and variables
  const savedVersion = localStorage.getItem('print_templates_version');
  
  const saved = localStorage.getItem('print_templates');
  
  // If no saved templates or version mismatch, reinitialize with ready-made templates
  if (!saved || savedVersion !== TEMPLATE_VERSION) {
    localStorage.setItem('print_templates', JSON.stringify(READY_MADE_TEMPLATES));
    localStorage.setItem('print_templates_version', TEMPLATE_VERSION);
    return READY_MADE_TEMPLATES;
  }
  
  // Return saved templates
  try {
    const parsed = JSON.parse(saved);
    // Ensure at least one template is default
    const hasDefault = parsed.some((t: PrintTemplate) => t.isDefault);
    if (!hasDefault && parsed.length > 0) {
      parsed[0].isDefault = true;
      localStorage.setItem('print_templates', JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    localStorage.setItem('print_templates', JSON.stringify(READY_MADE_TEMPLATES));
    localStorage.setItem('print_templates_version', TEMPLATE_VERSION);
    return READY_MADE_TEMPLATES;
  }
}

// Get default template
export function getDefaultTemplate(): PrintTemplate {
  const templates = getTemplates();
  return templates.find(t => t.isDefault && t.isActive) || templates.find(t => t.isActive) || READY_MADE_TEMPLATES[2];
}

// Get template by paper size
export function getTemplateByPaperSize(paperSize: string): PrintTemplate {
  const templates = getTemplates();
  const activeTemplates = templates.filter(t => t.isActive);
  return activeTemplates.find(t => t.paperSize === paperSize) || activeTemplates[0] || READY_MADE_TEMPLATES[2];
}

// Get template by ID
export function getTemplateById(id: string): PrintTemplate | undefined {
  const templates = getTemplates();
  return templates.find(t => t.id === id);
}

// Save templates
export function saveTemplates(templates: PrintTemplate[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('print_templates', JSON.stringify(templates));
}

// Save single template
export function saveTemplate(template: PrintTemplate): void {
  const templates = getTemplates();
  const index = templates.findIndex(t => t.id === template.id);
  if (index >= 0) {
    templates[index] = { ...template, updatedAt: new Date().toISOString() };
  } else {
    templates.push({ ...template, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveTemplates(templates);
}

// Delete template
export function deleteTemplate(id: string): void {
  const templates = getTemplates();
  const filtered = templates.filter(t => t.id !== id);
  saveTemplates(filtered);
}

// Create new template with system settings pre-filled
export function createTemplate(
  name: string, 
  paperSize: 'thermal-58' | 'thermal-80' | 'a4' | 'a5' = 'thermal-80',
  settings?: AppSettings | null
): PrintTemplate {
  const width = paperSize === 'thermal-58' ? 58 : paperSize === 'thermal-80' ? 80 : paperSize === 'a5' ? 148 : 210;
  
  // Pre-fill with system settings if available
  const shopName = settings?.shopName || 'My Shop';
  const shopAddress = settings?.shopAddress || '';
  const shopPhone = settings?.shopPhone || settings?.whatsappNumber || '';
  const shopEmail = settings?.shopEmail || '';
  
  const newTemplate: PrintTemplate = {
    id: `custom-${generateId()}`,
    name,
    type: 'invoice',
    paperSize,
    width,
    isDefault: false,
    isActive: true,
    margin: { top: 3, right: 3, bottom: 3, left: 3 },
    elements: [
      { id: generateId(), type: 'text', content: shopName, style: { fontSize: '16px', fontWeight: 'bold', textAlign: 'center' } },
      { id: generateId(), type: 'text', content: shopAddress, style: { fontSize: '10px', textAlign: 'center' } },
      { id: generateId(), type: 'text', content: `Tel: ${shopPhone}`, style: { fontSize: '10px', textAlign: 'center' } },
      { id: generateId(), type: 'text', content: shopEmail, style: { fontSize: '9px', textAlign: 'center' } },
      { id: generateId(), type: 'line', style: {} },
      { id: generateId(), type: 'text', content: 'Invoice: {{invoice_number}}', style: { fontSize: '10px' } },
      { id: generateId(), type: 'text', content: 'Date: {{invoice_date}} {{invoice_time}}', style: { fontSize: '10px' } },
      { id: generateId(), type: 'line', style: {} },
      { id: generateId(), type: 'table', content: '{{items_table}}' },
      { id: generateId(), type: 'line', style: {} },
      { id: generateId(), type: 'text', content: 'TOTAL: {{total}}', style: { fontSize: '12px', fontWeight: 'bold', textAlign: 'right' } },
      { id: generateId(), type: 'spacer', style: { height: '10px' } },
      { id: generateId(), type: 'text', content: '{{footer_text}}', style: { fontSize: '9px', textAlign: 'center' } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  return newTemplate;
}

// Replace variables in content with full support for all variables
export function replaceVariables(
  content: string, 
  data: {
    sale?: Sale;
    purchase?: Purchase;
    settings?: AppSettings | null;
    currentUser?: { name: string } | null;
  }
): string {
  const { sale, purchase, settings, currentUser } = data;
  const currency = settings?.currencySymbol || '৳';
  const transactionDate = sale ? new Date(sale.date) : purchase ? new Date(purchase.date) : new Date();
  const now = new Date();
  
  // Generate QR link
  const qrLink = settings?.shopWebsite 
    ? `${settings.shopWebsite}/track/${sale?.invoiceNumber || purchase?.purchaseNumber || ''}`
    : `https://track.example.com/${sale?.invoiceNumber || purchase?.purchaseNumber || ''}`;
  
  // Common replacements for all transaction types
  let result = content
    // Shop variables
    .replace(/\{\{shop_name\}\}/g, settings?.shopName || 'My Shop')
    .replace(/\{\{shop_address\}\}/g, settings?.shopAddress || '')
    .replace(/\{\{shop_phone\}\}/g, settings?.shopPhone || settings?.whatsappNumber || '')
    .replace(/\{\{shop_email\}\}/g, settings?.shopEmail || '')
    .replace(/\{\{shop_logo\}\}/g, settings?.shopLogo || '')
    .replace(/\{\{shop_tagline\}\}/g, settings?.shopBio || '')
    .replace(/\{\{shop_website\}\}/g, settings?.shopWebsite || '')
    .replace(/\{\{tax_id\}\}/g, settings?.taxId || '')
    .replace(/\{\{registration_no\}\}/g, settings?.registrationNo || '')
    .replace(/\{\{opening_hours\}\}/g, settings?.openingHours || '')
    
    // Social media
    .replace(/\{\{facebook\}\}/g, settings?.facebookUrl || '')
    .replace(/\{\{instagram\}\}/g, settings?.instagramUrl || '')
    .replace(/\{\{whatsapp\}\}/g, settings?.whatsappNumber || '')
    .replace(/\{\{youtube\}\}/g, settings?.youtubeUrl || '')
    
    // Bank details
    .replace(/\{\{bank_name\}\}/g, settings?.bankName || '')
    .replace(/\{\{bank_account\}\}/g, settings?.bankAccountNumber || '')
    .replace(/\{\{bank_account_name\}\}/g, settings?.bankAccountName || '')
    .replace(/\{\{bank_branch\}\}/g, settings?.bankBranch || '')
    
    // Invoice variables
    .replace(/\{\{invoice_number\}\}/g, sale?.invoiceNumber || purchase?.purchaseNumber || '')
    .replace(/\{\{invoice_date\}\}/g, transactionDate.toLocaleDateString())
    .replace(/\{\{invoice_time\}\}/g, transactionDate.toLocaleTimeString())
    .replace(/\{\{invoice_datetime\}\}/g, transactionDate.toLocaleString())
    .replace(/\{\{print_date\}\}/g, now.toLocaleDateString())
    .replace(/\{\{print_time\}\}/g, now.toLocaleTimeString())
    
    // QR/Barcode
    .replace(/\{\{qr_link\}\}/g, qrLink)
    
    // Other variables
    .replace(/\{\{footer_text\}\}/g, settings?.receiptFooter || 'Thank you for shopping!')
    .replace(/\{\{served_by\}\}/g, currentUser?.name || 'System')
    .replace(/\{\{notes\}\}/g, sale?.notes || purchase?.notes || '');
  
  // Sale-specific replacements
  if (sale) {
    result = result
      .replace(/\{\{customer_name\}\}/g, sale.customerName || 'Walk-in Customer')
      .replace(/\{\{customer_phone\}\}/g, sale.customerPhone || '')
      .replace(/\{\{customer_address\}\}/g, sale.customerAddress || '')
      .replace(/\{\{items_count\}\}/g, sale.items?.length?.toString() || '0')
      .replace(/\{\{total_quantity\}\}/g, sale.items?.reduce((sum, item) => sum + item.quantity, 0).toString() || '0')
      .replace(/\{\{subtotal\}\}/g, formatAmount(sale.subtotal, currency))
      .replace(/\{\{discount\}\}/g, formatAmount((sale.itemDiscount || 0) + (sale.cartDiscount || 0), currency))
      .replace(/\{\{tax\}\}/g, formatAmount(sale.taxAmount || 0, currency))
      .replace(/\{\{total\}\}/g, formatAmount(sale.total, currency))
      .replace(/\{\{paid\}\}/g, formatAmount(sale.paid, currency))
      .replace(/\{\{due\}\}/g, formatAmount(sale.due, currency))
      .replace(/\{\{change\}\}/g, formatAmount(sale.changeAmount || 0, currency))
      .replace(/\{\{payment_method\}\}/g, sale.paymentMethod || 'Cash')
      .replace(/\{\{payment_status\}\}/g, sale.paymentStatus || 'Paid');
  }
  
  // Purchase-specific replacements
  if (purchase) {
    result = result
      .replace(/\{\{customer_name\}\}/g, purchase.supplierName || 'Unknown')
      .replace(/\{\{supplier_name\}\}/g, purchase.supplierName || 'Unknown')
      .replace(/\{\{customer_phone\}\}/g, '')
      .replace(/\{\{customer_address\}\}/g, '')
      .replace(/\{\{items_count\}\}/g, purchase.items?.length?.toString() || '0')
      .replace(/\{\{total_quantity\}\}/g, purchase.items?.reduce((sum, item) => sum + item.quantity, 0).toString() || '0')
      .replace(/\{\{subtotal\}\}/g, formatAmount(purchase.subtotal, currency))
      .replace(/\{\{discount\}\}/g, formatAmount(purchase.discount || 0, currency))
      .replace(/\{\{tax\}\}/g, formatAmount(purchase.taxAmount || 0, currency))
      .replace(/\{\{total\}\}/g, formatAmount(purchase.total, currency))
      .replace(/\{\{paid\}\}/g, formatAmount(purchase.paid, currency))
      .replace(/\{\{due\}\}/g, formatAmount(purchase.balance, currency))
      .replace(/\{\{change\}\}/g, formatAmount(0, currency))
      .replace(/\{\{payment_method\}\}/g, 'Cash')
      .replace(/\{\{payment_status\}\}/g, purchase.paymentStatus || 'Pending');
  }
  
  return result;
}

// Format amount with currency
function formatAmount(amount: number, currency: string): string {
  return `${currency}${amount.toFixed(2)}`;
}

// Render items table HTML
export function renderItemsTable(
  transaction: Sale | Purchase, 
  currency: string, 
  paperSize: string
): string {
  const items = transaction?.items;
  if (!items || items.length === 0) return '';
  
  const isThermal = paperSize.startsWith('thermal');
  const isSmall = paperSize === 'thermal-58';
  
  if (isThermal) {
    // Thermal printer format
    let html = '';
    
    // Header
    if (!isSmall) {
      html += `<div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px;">
        <span style="flex: 1;">Item</span>
        <span style="width: 30px; text-align: center;">Qty</span>
        <span style="width: 50px; text-align: right;">Price</span>
        <span style="width: 55px; text-align: right;">Total</span>
      </div>`;
    }
    
    // Items
    items.forEach(item => {
      const name = item.productName || (item as any).name || 'Item';
      const price = item.unitPrice || (item as any).price || 0;
      const total = item.totalPrice || (item as any).total || price * item.quantity;
      
      html += `<div style="display: flex; justify-content: space-between; font-size: ${isSmall ? '9px' : '10px'}; padding: 2px 0; border-bottom: 1px dashed #ccc;">
        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</span>
        <span style="width: 30px; text-align: center;">${item.quantity}</span>
        <span style="width: 50px; text-align: right;">${price.toFixed(0)}</span>
        <span style="width: 55px; text-align: right;">${total.toFixed(0)}</span>
      </div>`;
    });
    
    return html;
  } else {
    // A4/A5 format
    let html = `<table style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background: #f5f5f5;">
          <th style="padding: 8px; text-align: left; border-bottom: 2px solid #333;">Item</th>
          <th style="padding: 8px; text-align: center; border-bottom: 2px solid #333;">Qty</th>
          <th style="padding: 8px; text-align: right; border-bottom: 2px solid #333;">Price</th>
          <th style="padding: 8px; text-align: right; border-bottom: 2px solid #333;">Total</th>
        </tr>
      </thead>
      <tbody>`;
    
    items.forEach(item => {
      const name = item.productName || (item as any).name || 'Item';
      const price = item.unitPrice || (item as any).price || 0;
      const total = item.totalPrice || (item as any).total || price * item.quantity;
      
      html += `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
        <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">${currency}${price.toFixed(2)}</td>
        <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">${currency}${total.toFixed(2)}</td>
      </tr>`;
    });
    
    html += '</tbody></table>';
    return html;
  }
}

// Render element to HTML
export function renderElement(
  element: PrintTemplateElement,
  data: {
    sale?: Sale;
    purchase?: Purchase;
    settings?: AppSettings | null;
    currentUser?: { name: string } | null;
  }
): string {
  const { sale, purchase, settings } = data;
  const transaction = sale || purchase;
  const currency = settings?.currencySymbol || '৳';
  const template = getDefaultTemplate();
  const paperSize = template.paperSize;
  const style = element.style || {};
  
  const styleStr = Object.entries(style)
    .filter(([key]) => !['width', 'height', 'margin'].includes(key) || element.type !== 'image')
    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
    .join('; ');
  
  switch (element.type) {
    case 'text':
      const content = replaceVariables(element.content || '', data);
      return `<div style="${styleStr}">${content}</div>`;
    
    case 'line':
      return `<div style="border-top: 1px dashed #666; margin: 4px 0; ${styleStr}"></div>`;
    
    case 'spacer':
      return `<div style="height: ${style.height || '10px'}"></div>`;
    
    case 'table':
      if (!transaction) return '';
      return `<div style="${styleStr}">${renderItemsTable(transaction, currency, paperSize)}</div>`;
    
    case 'barcode':
      const barcodeNum = sale?.invoiceNumber || purchase?.purchaseNumber || '';
      return `<div style="text-align: center; padding: 8px 0; ${styleStr}">
        <div style="font-family: monospace; font-size: 10px; letter-spacing: -1px;">|||| |||| |||| ||||</div>
        <div style="font-size: 10px;">${barcodeNum}</div>
      </div>`;
    
    case 'qrcode':
      const qrLink = settings?.shopWebsite 
        ? `${settings.shopWebsite}/track/${sale?.invoiceNumber || purchase?.purchaseNumber || ''}`
        : '';
      return `<div style="text-align: center; padding: 8px 0; ${styleStr}">
        <div style="width: 60px; height: 60px; background: #eee; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 10px; border-radius: 4px;">
          ${qrLink ? `[QR: ${qrLink.substring(0, 20)}...]` : '[QR Code]'}
        </div>
      </div>`;
    
    case 'image':
      const logoSrc = settings?.shopLogo || '/logo.svg';
      return `<div style="text-align: center; ${styleStr}">
        <img src="${logoSrc}" style="max-height: 60px; max-width: 100%;" alt="Logo" />
      </div>`;
    
    case 'html':
      return `<div style="${styleStr}">${replaceVariables(element.content || '', data)}</div>`;
    
    default:
      return '';
  }
}

// Generate print HTML from template
export function generatePrintHTML(
  template: PrintTemplate,
  data: {
    sale?: Sale;
    purchase?: Purchase;
    settings?: AppSettings | null;
    currentUser?: { name: string } | null;
  }
): string {
  const elementsHtml = template.elements
    .filter(el => el.visible !== false)
    .map(el => renderElement(el, data))
    .join('\n');
  
  const paperWidth = template.paperSize === 'thermal-58' ? '58mm' :
                     template.paperSize === 'thermal-80' ? '80mm' :
                     template.paperSize === 'a5' ? '148mm' :
                     template.paperSize === 'letter' ? '215.9mm' : '210mm';
  
  const invoiceNum = data.sale?.invoiceNumber || data.purchase?.purchaseNumber || '';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoiceNum}</title>
  <style>
    @page {
      size: ${template.paperSize === 'a4' ? 'A4' : template.paperSize === 'a5' ? 'A5' : `${template.width}mm auto`};
      margin: ${template.margin.top}mm ${template.margin.right}mm ${template.margin.bottom}mm ${template.margin.left}mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      width: ${paperWidth};
      margin: 0 auto;
      padding: ${template.margin.top}mm ${template.margin.right}mm ${template.margin.bottom}mm ${template.margin.left}mm;
    }
    ${template.customCSS || ''}
    @media print {
      body { -webkit-print-color-adjust: exact; }
      @page { margin: 0; }
    }
  </style>
</head>
<body>
  ${elementsHtml}
</body>
</html>`;
}

// Print using template
export function printWithTemplate(
  sale: Sale,
  options?: {
    settings?: AppSettings | null;
    currentUser?: { name: string } | null;
    template?: PrintTemplate;
    paperSize?: 'thermal-58' | 'thermal-80' | 'a4';
  }
): void {
  const template = options?.template || 
                   (options?.paperSize ? getTemplateByPaperSize(options.paperSize) : getDefaultTemplate());
  
  const html = generatePrintHTML(template, {
    sale,
    settings: options?.settings,
    currentUser: options?.currentUser,
  });
  
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    alert('Please allow popups to print');
    return;
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);
}

// Quick thermal print (for POS)
export function quickThermalPrint(
  sale: Sale,
  settings?: AppSettings | null,
  currentUser?: { name: string } | null
): void {
  printWithTemplate(sale, {
    settings,
    currentUser,
    paperSize: 'thermal-80',
  });
}

// Print purchase with template
export function printPurchaseWithTemplate(
  purchase: Purchase,
  options?: {
    settings?: AppSettings | null;
    currentUser?: { name: string } | null;
    template?: PrintTemplate;
    paperSize?: 'thermal-58' | 'thermal-80' | 'a4';
  }
): void {
  const template = options?.template || 
                   (options?.paperSize ? getTemplateByPaperSize(options.paperSize) : getDefaultPurchaseTemplate());
  
  const html = generatePrintHTML(template, {
    purchase,
    settings: options?.settings,
    currentUser: options?.currentUser,
  });
  
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    alert('Please allow popups to print');
    return;
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);
}

// Quick thermal print for purchase
export function quickThermalPrintPurchase(
  purchase: Purchase,
  settings?: AppSettings | null,
  currentUser?: { name: string } | null
): void {
  printPurchaseWithTemplate(purchase, {
    settings,
    currentUser,
    paperSize: 'thermal-80',
  });
}
