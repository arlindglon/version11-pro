// Compact Memo Print Utility for Thermal Receipt Printers (58mm/80mm)

interface PrintItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface PrintMemoOptions {
  type: 'sale' | 'purchase';
  invoiceNumber: string;
  date: Date | string;
  items: PrintItem[];
  subtotal: number;
  discount?: number;
  total: number;
  paid: number;
  due: number;
  paymentMethod?: string;
  paymentStatus?: string;
  customerName?: string;
  supplierName?: string;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  currencySymbol?: string;
  showQR?: boolean;
}

export function printCompactMemo(options: PrintMemoOptions) {
  const {
    type,
    invoiceNumber,
    date,
    items,
    subtotal,
    discount = 0,
    total,
    paid,
    due,
    paymentMethod = 'Cash',
    paymentStatus = 'Pending',
    customerName = 'Walk-in',
    supplierName = '',
    shopName = 'Dokan',
    shopAddress = '',
    shopPhone = '',
    currencySymbol = '৳',
    showQR = false,
  } = options;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const isSale = type === 'sale';
  const title = isSale ? 'SALES RECEIPT' : 'PURCHASE ORDER';
  const partyLabel = isSale ? 'Customer' : 'Supplier';
  const partyName = isSale ? customerName : supplierName;
  
  // Fix: Convert date to Date object if it's a string
  const dateObj = date instanceof Date ? date : new Date(date);
  const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${title} #${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', 'Consolas', monospace;
      font-size: 11px;
      line-height: 1.3;
      padding: 8px;
      max-width: 280px;
      margin: 0 auto;
      background: white;
      color: #000;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .large { font-size: 14px; }
    .small { font-size: 9px; }
    .spacer { height: 4px; }
    .hr { border-top: 1px dashed #000; margin: 4px 0; }
    .double-hr { border-top: 2px solid #000; margin: 4px 0; }
    
    .header { margin-bottom: 6px; }
    .shop-name { font-size: 16px; font-weight: bold; letter-spacing: 1px; }
    .shop-info { font-size: 9px; color: #333; }
    
    .title-box {
      background: #000;
      color: #fff;
      padding: 4px 8px;
      margin: 6px 0;
      font-weight: bold;
      font-size: 12px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
    }
    
    .items-table { width: 100%; margin: 4px 0; }
    .items-table th { 
      border-bottom: 1px solid #000; 
      padding: 2px 0; 
      font-size: 9px;
      text-align: left;
    }
    .items-table th:last-child { text-align: right; }
    .items-table td { 
      padding: 2px 0;
      font-size: 10px;
    }
    .items-table td:last-child { text-align: right; }
    .item-name { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 1px 0;
    }
    .total-row {
      font-size: 14px;
      font-weight: bold;
      padding: 4px 0;
      border-top: 2px solid #000;
      margin-top: 2px;
    }
    
    .status-box {
      padding: 4px;
      margin: 4px 0;
      text-align: center;
      font-weight: bold;
    }
    .status-paid { background: #d4edda; color: #155724; }
    .status-partial { background: #fff3cd; color: #856404; }
    .status-pending { background: #f8d7da; color: #721c24; }
    
    .footer { 
      margin-top: 6px; 
      text-align: center; 
      font-size: 9px;
    }
    .thank-you {
      font-size: 11px;
      font-weight: bold;
      margin: 4px 0;
    }
    
    @media print {
      body { padding: 0; max-width: none; }
      @page { margin: 0; size: 58mm auto; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header center">
    <div class="shop-name">${shopName.toUpperCase()}</div>
    ${shopAddress ? `<div class="shop-info">${shopAddress}</div>` : ''}
    ${shopPhone ? `<div class="shop-info">Tel: ${shopPhone}</div>` : ''}
  </div>
  
  <div class="title-box center">${title}</div>
  
  <!-- Info -->
  <div class="info-row">
    <span>Invoice:</span>
    <span class="bold">#${invoiceNumber}</span>
  </div>
  <div class="info-row">
    <span>Date:</span>
    <span>${dateStr}</span>
  </div>
  <div class="info-row">
    <span>Time:</span>
    <span>${timeStr}</span>
  </div>
  <div class="info-row">
    <span>${partyLabel}:</span>
    <span>${partyName}</span>
  </div>
  
  <div class="hr"></div>
  
  <!-- Items -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 50%">Item</th>
        <th style="width: 20%" class="center">Qty</th>
        <th style="width: 30%">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td class="item-name">${item.name}</td>
          <td class="center">${item.quantity}</td>
          <td>${currencySymbol}${item.total.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="hr"></div>
  
  <!-- Summary -->
  <div class="summary-row">
    <span>Subtotal:</span>
    <span>${currencySymbol}${subtotal.toFixed(2)}</span>
  </div>
  ${discount > 0 ? `
  <div class="summary-row">
    <span>Discount:</span>
    <span>-${currencySymbol}${discount.toFixed(2)}</span>
  </div>
  ` : ''}
  <div class="summary-row total-row">
    <span>TOTAL:</span>
    <span>${currencySymbol}${total.toFixed(2)}</span>
  </div>
  
  <div class="hr"></div>
  
  <div class="summary-row">
    <span>Paid:</span>
    <span>${currencySymbol}${paid.toFixed(2)}</span>
  </div>
  <div class="summary-row ${due > 0 ? 'bold' : ''}">
    <span>Due:</span>
    <span>${currencySymbol}${due.toFixed(2)}</span>
  </div>
  
  <!-- Status -->
  <div class="status-box status-${paymentStatus.toLowerCase()}">
    ${paymentStatus.toUpperCase()}
  </div>
  
  <div class="info-row small">
    <span>Payment:</span>
    <span>${paymentMethod}</span>
  </div>
  
  <div class="spacer"></div>
  
  <!-- Footer -->
  <div class="footer">
    <div class="thank-you">Thank you for your business!</div>
    <div>Powered by Dokan POS</div>
    <div class="small">${new Date().toISOString()}</div>
  </div>
  
  ${showQR ? `
  <div class="hr"></div>
  <div class="center small">
    <div style="border: 1px solid #000; width: 60px; height: 60px; margin: 4px auto; display: flex; align-items: center; justify-content: center;">QR</div>
  </div>
  ` : ''}
</body>
</html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 100);
}

// Quick print for POS
export function quickPrintReceipt(sale: {
  invoiceNumber?: string;
  id: string;
  date: Date;
  items: Array<{ productName?: string; name?: string; quantity: number; totalPrice?: number; total?: number }>;
  subtotal: number;
  cartDiscount?: number;
  total: number;
  paid: number;
  due: number;
  paymentMethod?: string;
  paymentStatus?: string;
  customerName?: string;
}, settings?: { shopName?: string; shopAddress?: string; shopContact?: string; currencySymbol?: string }) {
  printCompactMemo({
    type: 'sale',
    invoiceNumber: sale.invoiceNumber || sale.id.slice(0, 8).toUpperCase(),
    date: sale.date,
    items: sale.items.map(item => ({
      name: item.productName || item.name || 'Item',
      quantity: item.quantity,
      price: (item.totalPrice || item.total || 0) / (item.quantity || 1),
      total: item.totalPrice || item.total || 0,
    })),
    subtotal: sale.subtotal,
    discount: sale.cartDiscount,
    total: sale.total,
    paid: sale.paid,
    due: sale.due,
    paymentMethod: sale.paymentMethod,
    paymentStatus: sale.paymentStatus,
    customerName: sale.customerName,
    shopName: settings?.shopName,
    shopAddress: settings?.shopAddress,
    shopPhone: settings?.shopContact,
    currencySymbol: settings?.currencySymbol,
  });
}
