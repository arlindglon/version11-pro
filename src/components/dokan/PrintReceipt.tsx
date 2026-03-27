'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PrintTemplate, PrintTemplateElement, Sale, AppSettings, Purchase } from '@/types';
import { formatCurrency, CURRENCY_SYMBOL, useLanguage } from '@/contexts/LanguageContext';
import { 
  getTemplates, 
  getDefaultTemplate,
  getTemplateByPaperSize,
} from '@/lib/printTemplates';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Printer, 
  X,
  Smartphone, 
  Tablet,
  Monitor,
  CheckCircle,
  FileText,
  User,
  Calendar,
  Check,
  Truck,
  Zap,
  FileDown,
  Settings,
  ArrowLeftRight
} from 'lucide-react';
import { toast } from 'sonner';

interface PrintReceiptProps {
  open: boolean;
  onClose: () => void;
  sale?: Sale | null;
  purchase?: Purchase | null;
  settings?: AppSettings | null;
  currentUser?: { name: string } | null;
  type?: 'sale' | 'purchase';
  autoPrint?: boolean; // Auto print on open
  autoPrintType?: 'thermal' | 'full' | 'both'; // What to auto print
}

export default function PrintReceipt({ 
  open, 
  onClose, 
  sale, 
  purchase,
  settings, 
  currentUser,
  type = 'sale',
  autoPrint = false,
  autoPrintType = 'thermal'
}: PrintReceiptProps) {
  const { t, isBangla } = useLanguage();
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<'thermal-58' | 'thermal-80' | 'a4'>('thermal-80');
  const [isPrinting, setIsPrinting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const hasAutoPrinted = useRef(false);

  // Get the current transaction data
  const transaction = type === 'purchase' ? purchase : sale;
  const transactionId = transaction ? (type === 'purchase' 
    ? (transaction as Purchase).purchaseNumber || transaction.id 
    : (transaction as Sale).invoiceNumber || transaction.id
  ) : '';

  // Load templates
  useEffect(() => {
    if (!open) return;
    
    const allTemplates = getTemplates();
    const activeTemplates = allTemplates.filter(t => t.isActive);
    setTemplates(activeTemplates);
    
    const defaultTemplate = getDefaultTemplate();
    if (defaultTemplate) {
      setSelectedTemplate(defaultTemplate);
      setPreviewMode(defaultTemplate.paperSize as 'thermal-58' | 'thermal-80' | 'a4');
    }
    
    // Reset auto print flag when dialog opens
    hasAutoPrinted.current = false;
  }, [open]);

  // Auto print on open if enabled
  useEffect(() => {
    if (open && autoPrint && !hasAutoPrinted.current && transaction) {
      hasAutoPrinted.current = true;
      
      // Delay to ensure templates are loaded
      setTimeout(() => {
        if (autoPrintType === 'thermal') {
          handleQuickPrint('thermal');
        } else if (autoPrintType === 'full') {
          handleQuickPrint('full');
        } else if (autoPrintType === 'both') {
          handleQuickPrint('both');
        }
      }, 500);
    }
  }, [open, autoPrint, autoPrintType, transaction]);

  // Replace variables with actual data - Full support for all template variables
  const replaceVariables = useCallback((content: string) => {
    if (!transaction) return content;
    
    const currency = settings?.currencySymbol || '৳';
    const transactionDate = new Date(
      type === 'purchase' ? (transaction as Purchase).date : (transaction as Sale).date
    );
    const now = new Date();
    
    // Generate QR link
    const qrLink = settings?.shopWebsite 
      ? `${settings.shopWebsite}/track/${transactionId}`
      : '';
    
    // Common replacements for both sale and purchase
    let result = content
      // Shop Info
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
      
      // Social Media
      .replace(/\{\{facebook\}\}/g, settings?.facebookUrl || '')
      .replace(/\{\{instagram\}\}/g, settings?.instagramUrl || '')
      .replace(/\{\{whatsapp\}\}/g, settings?.whatsappNumber || '')
      .replace(/\{\{youtube\}\}/g, settings?.youtubeUrl || '')
      
      // Bank Details
      .replace(/\{\{bank_name\}\}/g, settings?.bankName || '')
      .replace(/\{\{bank_account\}\}/g, settings?.bankAccountNumber || '')
      .replace(/\{\{bank_account_name\}\}/g, settings?.bankAccountName || '')
      .replace(/\{\{bank_branch\}\}/g, settings?.bankBranch || '')
      
      // Date/Time
      .replace(/\{\{invoice_date\}\}/g, transactionDate.toLocaleDateString())
      .replace(/\{\{invoice_time\}\}/g, transactionDate.toLocaleTimeString())
      .replace(/\{\{invoice_datetime\}\}/g, transactionDate.toLocaleString())
      .replace(/\{\{print_date\}\}/g, now.toLocaleDateString())
      .replace(/\{\{print_time\}\}/g, now.toLocaleTimeString())
      
      // QR Code
      .replace(/\{\{qr_link\}\}/g, qrLink)
      
      // Footer
      .replace(/\{\{footer_text\}\}/g, settings?.receiptFooter || 'Thank you for shopping!')
      .replace(/\{\{served_by\}\}/g, (transaction as any).salesmanName || (transaction as any).createdByName || currentUser?.name || 'System')
      .replace(/\{\{notes\}\}/g, (transaction as any).notes || '');
    
    // Purchase-specific replacements
    if (type === 'purchase') {
      const p = transaction as Purchase;
      result = result
        .replace(/\{\{invoice_number\}\}/g, p.purchaseNumber || p.id)
        .replace(/\{\{customer_name\}\}/g, p.supplierName || 'Unknown Supplier')
        .replace(/\{\{supplier_name\}\}/g, p.supplierName || 'Unknown')
        .replace(/\{\{customer_phone\}\}/g, '')
        .replace(/\{\{customer_address\}\}/g, '')
        .replace(/\{\{items_count\}\}/g, p.items?.length?.toString() || '0')
        .replace(/\{\{total_quantity\}\}/g, p.items?.reduce((sum, item) => sum + item.quantity, 0).toString() || '0')
        .replace(/\{\{subtotal\}\}/g, formatCurrency(p.subtotal, currency))
        .replace(/\{\{discount\}\}/g, formatCurrency(p.discount || 0, currency))
        .replace(/\{\{tax\}\}/g, formatCurrency(p.taxAmount || 0, currency))
        .replace(/\{\{total\}\}/g, formatCurrency(p.total, currency))
        .replace(/\{\{paid\}\}/g, formatCurrency(p.paid, currency))
        .replace(/\{\{due\}\}/g, formatCurrency(p.balance, currency))
        .replace(/\{\{change\}\}/g, formatCurrency(0, currency))
        .replace(/\{\{payment_method\}\}/g, 'Cash')
        .replace(/\{\{payment_status\}\}/g, p.paymentStatus || 'Pending');
    } else {
      // Sale-specific replacements
      const s = transaction as Sale;
      result = result
        .replace(/\{\{invoice_number\}\}/g, s.invoiceNumber || s.id)
        .replace(/\{\{customer_name\}\}/g, s.customerName || 'Walk-in Customer')
        .replace(/\{\{supplier_name\}\}/g, '')
        .replace(/\{\{customer_phone\}\}/g, s.customerPhone || '')
        .replace(/\{\{customer_address\}\}/g, s.customerAddress || '')
        .replace(/\{\{items_count\}\}/g, s.items?.length?.toString() || '0')
        .replace(/\{\{total_quantity\}\}/g, s.items?.reduce((sum, item) => sum + item.quantity, 0).toString() || '0')
        .replace(/\{\{subtotal\}\}/g, formatCurrency(s.subtotal, currency))
        .replace(/\{\{discount\}\}/g, formatCurrency((s.itemDiscount || 0) + (s.cartDiscount || 0), currency))
        .replace(/\{\{tax\}\}/g, formatCurrency(s.taxAmount || 0, currency))
        .replace(/\{\{total\}\}/g, formatCurrency(s.total, currency))
        .replace(/\{\{paid\}\}/g, formatCurrency(s.paid, currency))
        .replace(/\{\{due\}\}/g, formatCurrency(s.due, currency))
        .replace(/\{\{change\}\}/g, formatCurrency(s.changeAmount || 0, currency))
        .replace(/\{\{payment_method\}\}/g, s.paymentMethod || 'Cash')
        .replace(/\{\{payment_status\}\}/g, s.paymentStatus || 'Paid');
    }
    
    return result;
  }, [transaction, settings, currentUser, type, transactionId]);

  // Render element
  const renderElement = useCallback((element: PrintTemplateElement) => {
    const items = transaction?.items;
    
    switch (element.type) {
      case 'text':
        return <div style={element.style}>{replaceVariables(element.content || '')}</div>;
      
      case 'image':
        return (
          <div className="flex justify-center py-2" style={element.style}>
            <img 
              src={settings?.shopLogo || '/logo.svg'} 
              alt="Logo" 
              style={{ maxHeight: '50px', maxWidth: '100%' }}
            />
          </div>
        );
      
      case 'line':
        return <div className="border-t border-dashed border-gray-400 my-1" style={element.style} />;
      
      case 'spacer':
        return <div style={{ height: element.style?.height || '10px' }} />;
      
      case 'table':
        if (!items) return null;
        return (
          <div className="w-full text-xs" style={element.style}>
            <div className="flex justify-between border-b border-dashed border-gray-400 py-1 font-bold text-[10px]">
              <span style={{ flex: 1 }}>Item</span>
              <span style={{ width: '30px', textAlign: 'center' }}>Qty</span>
              <span style={{ width: '50px', textAlign: 'right' }}>Price</span>
              <span style={{ width: '55px', textAlign: 'right' }}>Total</span>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between py-1 border-b border-dotted border-gray-200">
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '4px' }}>
                  {item.productName || item.name || 'Item'}
                </span>
                <span style={{ width: '30px', textAlign: 'center' }}>{item.quantity}</span>
                <span style={{ width: '50px', textAlign: 'right' }}>
                  {(item.unitPrice || item.price || 0).toFixed(0)}
                </span>
                <span style={{ width: '55px', textAlign: 'right' }}>
                  {((item.totalPrice || item.total) || (item.unitPrice || item.price || 0) * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        );
      
      case 'barcode':
        return (
          <div className="text-center py-2" style={element.style}>
            <div className="text-xs tracking-tighter font-mono">|||| |||| |||| ||||</div>
            <div className="text-xs">{transactionId}</div>
          </div>
        );
      
      case 'qrcode':
        return (
          <div className="flex justify-center py-2" style={element.style}>
            <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-xs">[QR]</div>
          </div>
        );
      
      case 'html':
        return (
          <div dangerouslySetInnerHTML={{ __html: replaceVariables(element.content || '') }} style={element.style} />
        );
      
      default:
        return null;
    }
  }, [transaction, settings, replaceVariables, transactionId]);

  // Get paper width
  const getPaperWidth = () => {
    switch (previewMode) {
      case 'thermal-58': return '58mm';
      case 'thermal-80': return '80mm';
      case 'a4': return '210mm';
      default: return '80mm';
    }
  };

  // Generate print content for a template
  const generatePrintContent = useCallback((template: PrintTemplate) => {
    if (!transaction) return '';
    
    const paperWidth = template.paperSize === 'thermal-58' ? '58mm' :
                       template.paperSize === 'thermal-80' ? '80mm' :
                       template.paperSize === 'a5' ? '148mm' : '210mm';
    
    // Build content HTML from template elements
    let contentHTML = '';
    template.elements.forEach((element) => {
      switch (element.type) {
        case 'text':
          contentHTML += `<div style="${Object.entries(element.style || {}).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')}">${replaceVariables(element.content || '')}</div>`;
          break;
        case 'line':
          contentHTML += '<div style="border-top: 1px dashed #666; margin: 4px 0;"></div>';
          break;
        case 'spacer':
          contentHTML += `<div style="height: ${element.style?.height || '10px'}"></div>`;
          break;
        case 'image':
          contentHTML += `<div style="text-align: center; padding: 8px 0;"><img src="${settings?.shopLogo || '/logo.svg'}" style="max-height: 50px; max-width: 100%;" alt="Logo" /></div>`;
          break;
        case 'barcode':
          contentHTML += `<div style="text-align: center; padding: 8px 0;"><div style="font-size: 10px; letter-spacing: -1px; font-family: monospace;">|||| |||| |||| ||||</div><div style="font-size: 10px;">${transactionId}</div></div>`;
          break;
        case 'qrcode':
          contentHTML += `<div style="text-align: center; padding: 8px 0;"><div style="width: 64px; height: 64px; background: #e5e5e5; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 10px;">[QR]</div></div>`;
          break;
        case 'table':
          if (transaction.items) {
            contentHTML += '<div style="width: 100%; font-size: 10px;"><div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #666; padding: 4px 0; font-weight: bold;"><span style="flex: 1;">Item</span><span style="width: 30px; text-align: center;">Qty</span><span style="width: 50px; text-align: right;">Price</span><span style="width: 55px; text-align: right;">Total</span></div>';
            transaction.items.forEach((item) => {
              contentHTML += `<div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ccc;"><span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 4px;">${item.productName || item.name || 'Item'}</span><span style="width: 30px; text-align: center;">${item.quantity}</span><span style="width: 50px; text-align: right;">${(item.unitPrice || item.price || 0).toFixed(0)}</span><span style="width: 55px; text-align: right;">${((item.totalPrice || item.total) || (item.unitPrice || item.price || 0) * item.quantity).toFixed(0)}</span></div>`;
            });
            contentHTML += '</div>';
          }
          break;
        case 'html':
          contentHTML += replaceVariables(element.content || '');
          break;
      }
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${type === 'purchase' ? 'Purchase' : 'Invoice'} ${transactionId}</title>
        <style>
          @page {
            size: ${template.paperSize === 'a4' ? 'A4' : template.paperSize === 'a5' ? 'A5' : `${template.width}mm auto`};
            margin: ${template.margin.top}mm ${template.margin.right}mm ${template.margin.bottom}mm ${template.margin.left}mm;
          }
          body {
            font-family: monospace;
            font-size: 11px;
            width: ${paperWidth};
            margin: 0 auto;
            padding: ${template.margin.top}mm ${template.margin.right}mm ${template.margin.bottom}mm ${template.margin.left}mm;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${contentHTML}
      </body>
      </html>
    `;
  }, [transaction, settings, type, transactionId, replaceVariables]);

  // Quick print - Thermal or Full
  const handleQuickPrint = useCallback(async (printType: 'thermal' | 'full' | 'both') => {
    if (!transaction) return;
    
    setIsPrinting(true);
    
    try {
      // Get templates based on print type
      const templatesToPrint: PrintTemplate[] = [];
      
      if (printType === 'thermal' || printType === 'both') {
        // Get thermal template (prefer 80mm, fallback to 58mm)
        let thermalTemplate = templates.find(t => t.paperSize === 'thermal-80' && t.isActive) ||
                              templates.find(t => t.paperSize === 'thermal-58' && t.isActive) ||
                              templates.find(t => t.paperSize?.startsWith('thermal') && t.isActive);
        if (thermalTemplate) templatesToPrint.push(thermalTemplate);
      }
      
      if (printType === 'full' || printType === 'both') {
        // Get A4 template
        let a4Template = templates.find(t => t.paperSize === 'a4' && t.isActive);
        if (a4Template) templatesToPrint.push(a4Template);
      }
      
      // If no specific templates found, use default
      if (templatesToPrint.length === 0) {
        const defaultTemplate = getDefaultTemplate();
        if (defaultTemplate) templatesToPrint.push(defaultTemplate);
      }
      
      if (templatesToPrint.length === 0) {
        toast.error(t('print.no_templates'));
        setIsPrinting(false);
        return;
      }
      
      // Print each template
      for (const template of templatesToPrint) {
        const printContent = generatePrintContent(template);
        
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) {
          toast.error(t('print.allow_popups'));
          continue;
        }
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        printWindow.focus();
        printWindow.print();
        
        // Close window after print (optional)
        // printWindow.close();
      }
      
      toast.success(t('print.receipt_printed'));
    } catch (error) {
      console.error('Print error:', error);
      toast.error(t('print.failed'));
    } finally {
      setIsPrinting(false);
    }
  }, [transaction, templates, generatePrintContent, t]);

  // Handle print with selected template
  const handlePrint = useCallback(async () => {
    if (!selectedTemplate || !transaction) return;
    
    setIsPrinting(true);
    
    try {
      const printContent = generatePrintContent(selectedTemplate);
      
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (!printWindow) {
        toast.error(t('print.allow_popups'));
        setIsPrinting(false);
        return;
      }
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      printWindow.focus();
      printWindow.print();
      
      toast.success(t('print.dialog_opened'));
    } catch (error) {
      console.error('Print error:', error);
      toast.error(t('print.failed'));
    } finally {
      setIsPrinting(false);
    }
  }, [selectedTemplate, transaction, generatePrintContent, t]);

  if (!open || !transaction) return null;

  const currency = settings?.currencySymbol || '৳';
  const totalAmount = type === 'purchase' 
    ? (transaction as Purchase).total 
    : (transaction as Sale).total;
  const customerName = type === 'purchase' 
    ? (transaction as Purchase).supplierName 
    : (transaction as Sale).customerName || 'Walk-in';
  const date = type === 'purchase' 
    ? (transaction as Purchase).date 
    : (transaction as Sale).date;
  const isPurchase = type === 'purchase';

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
      {/* Full screen modal with responsive layout */}
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden sm:max-w-4xl lg:max-w-5xl">
        
        {/* Header - Fixed */}
        <div className={`shrink-0 ${isPurchase ? 'bg-gradient-to-r from-teal-600 to-emerald-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} text-white p-4 sm:p-5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
                {isPurchase ? <Truck className="w-5 h-5 sm:w-6 sm:h-6" /> : <Printer className="w-5 h-5 sm:w-6 sm:h-6" />}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold">
                  {isPurchase ? t('print.purchase') : t('print.invoice')}
                </h2>
                <p className="text-white/80 text-xs sm:text-sm">{isBangla ? 'টেমপ্লেট নির্বাচন করুন এবং প্রিন্ট করুন' : 'Select template and print your receipt'}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row">
            
            {/* Left Panel - Controls */}
            <div className="lg:w-80 p-4 sm:p-5 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 shrink-0">
              
              {/* Invoice Info Card */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${isPurchase ? 'bg-teal-100' : 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
                    {isPurchase 
                      ? <Truck className={`w-5 h-5 ${isPurchase ? 'text-teal-600' : 'text-blue-600'}`} />
                      : <FileText className="w-5 h-5 text-blue-600" />
                    }
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{isPurchase ? t('print.purchase_number') : t('print.invoice_number')}</p>
                    <p className="font-bold text-slate-900 text-sm">{transactionId}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 truncate text-xs">{customerName || (isPurchase ? t('print.supplier') : t('print.walk_in'))}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 text-xs">{new Date(date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 text-sm">{t('print.total_amount')}</span>
                  <span className={`text-xl font-bold ${isPurchase ? 'text-teal-600' : 'text-green-600'}`}>
                    {formatCurrency(totalAmount, currency)}
                  </span>
                </div>
              </div>

              {/* Print Options */}
              <div className="space-y-4 mb-4">
                {/* Template Selector */}
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <label className="text-sm font-bold text-slate-700 mb-2 block flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    {t('print.select_template')}
                  </label>
                  <Select
                    value={selectedTemplate?.id}
                    onValueChange={(value) => {
                      const template = templates.find(t => t.id === value);
                      if (template) {
                        setSelectedTemplate(template);
                        setPreviewMode(template.paperSize as 'thermal-58' | 'thermal-80' | 'a4');
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-11 bg-white border-2 border-slate-200">
                      <SelectValue placeholder={isBangla ? 'টেমপ্লেট বেছে নিন' : 'Choose template'} />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <span>{template.name}</span>
                            {template.isDefault && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{t('print.default')}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Paper Size */}
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <label className="text-sm font-bold text-slate-700 mb-2 block flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-slate-500" />
                    {t('print.paper_size')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPreviewMode('thermal-58')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        previewMode === 'thermal-58' 
                          ? `${isPurchase ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-blue-500 bg-blue-50 text-blue-700'}` 
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <Smartphone className="w-5 h-5" />
                      <span className="text-xs font-bold">{t('print.58mm')}</span>
                    </button>
                    <button
                      onClick={() => setPreviewMode('thermal-80')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        previewMode === 'thermal-80' 
                          ? `${isPurchase ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-blue-500 bg-blue-50 text-blue-700'}` 
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <Tablet className="w-5 h-5" />
                      <span className="text-xs font-bold">{t('print.80mm')}</span>
                    </button>
                    <button
                      onClick={() => setPreviewMode('a4')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        previewMode === 'a4' 
                          ? `${isPurchase ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-blue-500 bg-blue-50 text-blue-700'}` 
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <Monitor className="w-5 h-5" />
                      <span className="text-xs font-bold">{t('print.a4')}</span>
                    </button>
                  </div>
                </div>

                {/* Print Button */}
                <Button
                  className={`w-full h-12 font-bold ${
                    isPurchase 
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                  }`}
                  onClick={handlePrint}
                  disabled={isPrinting}
                >
                  {isPrinting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      {t('print.printing')}
                    </>
                  ) : (
                    <>
                      <Printer className="w-5 h-5 mr-2" />
                      {t('print.print')}
                    </>
                  )}
                </Button>
              </div>

              {/* Done Button */}
              <Button
                variant="outline"
                className="w-full h-12 text-base font-bold border-2"
                onClick={onClose}
              >
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                {t('print.done')}
              </Button>
            </div>

            {/* Right Panel - Preview */}
            <div className="flex-1 p-4 sm:p-5 bg-slate-100 flex items-center justify-center overflow-auto min-h-[300px] lg:min-h-0">
              <div 
                ref={printRef}
                className="bg-white shadow-xl"
                style={{ 
                  width: getPaperWidth(),
                  maxWidth: '100%',
                  minHeight: '150px',
                  padding: selectedTemplate ? `${selectedTemplate.margin.top}mm ${selectedTemplate.margin.right}mm ${selectedTemplate.margin.bottom}mm ${selectedTemplate.margin.left}mm` : '4mm',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}
              >
                {selectedTemplate?.elements.map((element) => (
                  <div key={element.id} style={element.style}>
                    {renderElement(element)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Chevron Icon Component
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
