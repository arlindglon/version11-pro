'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  PrintTemplate, PrintTemplateElement, PrintTemplateType, PrintPaperSize,
  TEMPLATE_VARIABLES, DEFAULT_THERMAL_TEMPLATE
} from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Printer,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Settings2,
  Code,
  Type,
  Image,
  Minus,
  Table,
  Barcode,
  QrCode,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  Save,
  RotateCcw,
  FileText,
  LayoutTemplate,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface PrintTemplateEditorProps {
  settings?: {
    shopName?: string;
    shopAddress?: string;
    shopPhone?: string;
    shopEmail?: string;
    shopLogo?: string;
    receiptFooter?: string;
    currencySymbol?: string;
  } | null;
  onSave?: (template: PrintTemplate) => void;
}

const PAPER_SIZES: { value: PrintPaperSize; label: string; width: number; description: string }[] = [
  { value: 'thermal-58', label: 'Thermal 58mm', width: 58, description: 'Small POS receipt' },
  { value: 'thermal-80', label: 'Thermal 80mm', width: 80, description: 'Standard POS receipt' },
  { value: 'a4', label: 'A4', width: 210, description: 'Full page invoice' },
  { value: 'a5', label: 'A5', width: 148, description: 'Half page invoice' },
  { value: 'letter', label: 'Letter', width: 215.9, description: 'US Letter size' },
];

const TEMPLATE_TYPES: { value: PrintTemplateType; label: string; icon: React.ReactNode }[] = [
  { value: 'invoice', label: 'Invoice', icon: <FileText className="w-4 h-4" /> },
  { value: 'receipt', label: 'Receipt', icon: <Printer className="w-4 h-4" /> },
  { value: 'purchase', label: 'Purchase Order', icon: <FileText className="w-4 h-4" /> },
  { value: 'quotation', label: 'Quotation', icon: <FileText className="w-4 h-4" /> },
  { value: 'challan', label: 'Delivery Challan', icon: <FileText className="w-4 h-4" /> },
];

const ELEMENT_TYPES: { type: PrintTemplateElement['type']; label: string; icon: React.ReactNode }[] = [
  { type: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
  { type: 'image', label: 'Image/Logo', icon: <Image className="w-4 h-4" /> },
  { type: 'line', label: 'Divider Line', icon: <Minus className="w-4 h-4" /> },
  { type: 'spacer', label: 'Spacer', icon: <Minus className="w-4 h-4 rotate-90" /> },
  { type: 'table', label: 'Items Table', icon: <Table className="w-4 h-4" /> },
  { type: 'barcode', label: 'Barcode', icon: <Barcode className="w-4 h-4" /> },
  { type: 'qrcode', label: 'QR Code', icon: <QrCode className="w-4 h-4" /> },
  { type: 'html', label: 'Custom HTML', icon: <Code className="w-4 h-4" /> },
];

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 11);

export default function PrintTemplateEditor({ settings, onSave }: PrintTemplateEditorProps) {
  const { t } = useLanguage();
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null);
  const [selectedElement, setSelectedElement] = useState<PrintTemplateElement | null>(null);
  const [previewMode, setPreviewMode] = useState<'thermal-58' | 'thermal-80' | 'a4'>('thermal-80');
  const [showVariables, setShowVariables] = useState(false);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);
  const [variableDialogOpen, setVariableDialogOpen] = useState(false);
  const [customVariableName, setCustomVariableName] = useState('');

  // Load templates from localStorage on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('print_templates');
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        
        // Check if any template is marked as default
        const hasDefault = parsed.some((t: PrintTemplate) => t.isDefault);
        
        // If no default, set the first one as default
        if (!hasDefault && parsed.length > 0) {
          parsed[0].isDefault = true;
          localStorage.setItem('print_templates', JSON.stringify(parsed));
        }
        
        setTemplates(parsed);
        if (parsed.length > 0) {
          const defaultTemplate = parsed.find((t: PrintTemplate) => t.isDefault) || parsed[0];
          setSelectedTemplate(defaultTemplate);
        }
      } catch (e) {
        console.error('Failed to load templates:', e);
      }
    } else {
      // Create default template
      const defaultTemplate: PrintTemplate = {
        id: generateId(),
        name: 'Default Thermal Receipt',
        type: 'invoice',
        paperSize: 'thermal-80',
        isDefault: true,
        isActive: true,
        elements: [
          { id: generateId(), type: 'text', content: '{{shop_name}}', style: { fontSize: '16px', fontWeight: 'bold', textAlign: 'center' } },
          { id: generateId(), type: 'text', content: '{{shop_address}}', style: { fontSize: '11px', textAlign: 'center' } },
          { id: generateId(), type: 'text', content: 'Tel: {{shop_phone}}', style: { fontSize: '11px', textAlign: 'center' } },
          { id: generateId(), type: 'line', style: { padding: '4px 0' } },
          { id: generateId(), type: 'text', content: 'Invoice: {{invoice_number}}', style: { fontSize: '11px' } },
          { id: generateId(), type: 'text', content: 'Date: {{invoice_date}} Time: {{invoice_time}}', style: { fontSize: '11px' } },
          { id: generateId(), type: 'text', content: 'Customer: {{customer_name}}', style: { fontSize: '11px' } },
          { id: generateId(), type: 'line', style: { padding: '4px 0' } },
          { id: generateId(), type: 'table', content: '{{items_table}}' },
          { id: generateId(), type: 'line', style: { padding: '4px 0' } },
          { id: generateId(), type: 'text', content: 'Subtotal: {{subtotal}}', style: { fontSize: '11px', textAlign: 'right' } },
          { id: generateId(), type: 'text', content: 'Discount: {{discount}}', style: { fontSize: '11px', textAlign: 'right' } },
          { id: generateId(), type: 'text', content: 'Tax: {{tax}}', style: { fontSize: '11px', textAlign: 'right' } },
          { id: generateId(), type: 'text', content: '────────────────────', style: { fontSize: '11px', textAlign: 'center' } },
          { id: generateId(), type: 'text', content: 'TOTAL: {{total}}', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'right' } },
          { id: generateId(), type: 'line', style: { padding: '4px 0' } },
          { id: generateId(), type: 'text', content: 'Paid: {{paid}}', style: { fontSize: '11px', textAlign: 'right' } },
          { id: generateId(), type: 'text', content: 'Change: {{change}}', style: { fontSize: '11px', textAlign: 'right' } },
          { id: generateId(), type: 'spacer', style: { height: '8px' } },
          { id: generateId(), type: 'text', content: '{{footer_text}}', style: { fontSize: '10px', textAlign: 'center' } },
          { id: generateId(), type: 'text', content: 'Served by: {{served_by}}', style: { fontSize: '9px', textAlign: 'center' } },
        ],
        width: 80,
        margin: { top: 2, right: 2, bottom: 2, left: 2 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTemplates([defaultTemplate]);
      setSelectedTemplate(defaultTemplate);
      localStorage.setItem('print_templates', JSON.stringify([defaultTemplate]));
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = useCallback((newTemplates: PrintTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('print_templates', JSON.stringify(newTemplates));
    toast.success('Templates saved!');
  }, []);

  // Add new element
  const addElement = (type: PrintTemplateElement['type']) => {
    if (!selectedTemplate) return;
    
    const newElement: PrintTemplateElement = {
      id: generateId(),
      type,
      content: type === 'text' ? 'New text' : type === 'table' ? '{{items_table}}' : '',
      style: {
        fontSize: '11px',
        textAlign: 'left',
      },
    };
    
    const updatedTemplate = {
      ...selectedTemplate,
      elements: [...selectedTemplate.elements, newElement],
      updatedAt: new Date().toISOString(),
    };
    
    setSelectedTemplate(updatedTemplate);
    setSelectedElement(newElement);
    
    const updatedTemplates = templates.map(t => 
      t.id === updatedTemplate.id ? updatedTemplate : t
    );
    saveTemplates(updatedTemplates);
  };

  // Update element
  const updateElement = (elementId: string, updates: Partial<PrintTemplateElement>) => {
    if (!selectedTemplate) return;
    
    const updatedElements = selectedTemplate.elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    );
    
    const updatedTemplate = {
      ...selectedTemplate,
      elements: updatedElements,
      updatedAt: new Date().toISOString(),
    };
    
    setSelectedTemplate(updatedTemplate);
    if (selectedElement?.id === elementId) {
      setSelectedElement({ ...selectedElement, ...updates });
    }
    
    const updatedTemplates = templates.map(t => 
      t.id === updatedTemplate.id ? updatedTemplate : t
    );
    saveTemplates(updatedTemplates);
  };

  // Delete element
  const deleteElement = (elementId: string) => {
    if (!selectedTemplate) return;
    
    const updatedElements = selectedTemplate.elements.filter(el => el.id !== elementId);
    const updatedTemplate = {
      ...selectedTemplate,
      elements: updatedElements,
      updatedAt: new Date().toISOString(),
    };
    
    setSelectedTemplate(updatedTemplate);
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
    
    const updatedTemplates = templates.map(t => 
      t.id === updatedTemplate.id ? updatedTemplate : t
    );
    saveTemplates(updatedTemplates);
  };

  // Duplicate element
  const duplicateElement = (elementId: string) => {
    if (!selectedTemplate) return;
    
    const element = selectedTemplate.elements.find(el => el.id === elementId);
    if (!element) return;
    
    const index = selectedTemplate.elements.findIndex(el => el.id === elementId);
    const newElement: PrintTemplateElement = {
      ...element,
      id: generateId(),
    };
    
    const newElements = [...selectedTemplate.elements];
    newElements.splice(index + 1, 0, newElement);
    
    const updatedTemplate = {
      ...selectedTemplate,
      elements: newElements,
      updatedAt: new Date().toISOString(),
    };
    
    setSelectedTemplate(updatedTemplate);
    setSelectedElement(newElement);
    
    const updatedTemplates = templates.map(t => 
      t.id === updatedTemplate.id ? updatedTemplate : t
    );
    saveTemplates(updatedTemplates);
    toast.success('Element duplicated!');
  };

  // Move element up/down
  const moveElement = (elementId: string, direction: 'up' | 'down') => {
    if (!selectedTemplate) return;
    
    const index = selectedTemplate.elements.findIndex(el => el.id === elementId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedTemplate.elements.length) return;
    
    const newElements = [...selectedTemplate.elements];
    [newElements[index], newElements[newIndex]] = [newElements[newIndex], newElements[index]];
    
    const updatedTemplate = {
      ...selectedTemplate,
      elements: newElements,
      updatedAt: new Date().toISOString(),
    };
    
    setSelectedTemplate(updatedTemplate);
    
    const updatedTemplates = templates.map(t => 
      t.id === updatedTemplate.id ? updatedTemplate : t
    );
    saveTemplates(updatedTemplates);
  };

  // Create new template
  const createNewTemplate = () => {
    const newTemplate: PrintTemplate = {
      id: generateId(),
      name: `New Template ${templates.length + 1}`,
      type: 'invoice',
      paperSize: 'thermal-80',
      isDefault: false,
      isActive: true,
      elements: [
        { id: generateId(), type: 'text', content: '{{shop_name}}', style: { fontSize: '14px', fontWeight: 'bold', textAlign: 'center' } },
        { id: generateId(), type: 'line', style: { padding: '4px 0' } },
      ],
      width: 80,
      margin: { top: 2, right: 2, bottom: 2, left: 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const newTemplates = [...templates, newTemplate];
    saveTemplates(newTemplates);
    setSelectedTemplate(newTemplate);
  };

  // Duplicate template
  const duplicateTemplate = (template: PrintTemplate) => {
    const newTemplate: PrintTemplate = {
      ...template,
      id: generateId(),
      name: `${template.name} (Copy)`,
      isDefault: false,
      elements: template.elements.map(el => ({ ...el, id: generateId() })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const newTemplates = [...templates, newTemplate];
    saveTemplates(newTemplates);
    setSelectedTemplate(newTemplate);
  };

  // Delete template
  const deleteTemplate = (templateId: string) => {
    if (templates.length <= 1) {
      toast.error('Cannot delete the last template');
      return;
    }
    
    const newTemplates = templates.filter(t => t.id !== templateId);
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(newTemplates[0]);
    }
    saveTemplates(newTemplates);
  };

  // Set as default
  const setAsDefault = (templateId: string) => {
    const updatedTemplates = templates.map(t => ({
      ...t,
      isDefault: t.id === templateId,
    }));
    setTemplates(updatedTemplates);
    localStorage.setItem('print_templates', JSON.stringify(updatedTemplates));
    
    // Update selected template if it's the one being set as default
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate({ ...selectedTemplate, isDefault: true });
    } else if (selectedTemplate) {
      setSelectedTemplate({ ...selectedTemplate, isDefault: false });
    }
    
    toast.success('Default template updated!');
  };

  // Update template settings
  const updateTemplateSettings = (updates: Partial<PrintTemplate>) => {
    if (!selectedTemplate) return;
    
    const updatedTemplate = {
      ...selectedTemplate,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    setSelectedTemplate(updatedTemplate);
    
    const updatedTemplates = templates.map(t => 
      t.id === updatedTemplate.id ? updatedTemplate : t
    );
    saveTemplates(updatedTemplates);
  };

  // Copy variable to clipboard
  const copyVariable = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedVariable(key);
    setTimeout(() => setCopiedVariable(null), 2000);
    toast.success('Variable copied!');
  };

  // Insert variable at cursor position or append to content
  const insertVariable = (variable: string) => {
    if (!selectedElement || selectedElement.type !== 'text') {
      toast.error('Please select a text element first');
      return;
    }
    
    const currentContent = selectedElement.content || '';
    const newContent = currentContent + variable;
    updateElement(selectedElement.id, { content: newContent });
    setVariableDialogOpen(false);
    toast.success('Variable inserted!');
  };

  // Add custom variable
  const addCustomVariable = () => {
    if (!customVariableName.trim()) {
      toast.error('Please enter a variable name');
      return;
    }
    const formattedName = customVariableName.trim().toLowerCase().replace(/\s+/g, '_');
    const variable = `{{${formattedName}}}`;
    insertVariable(variable);
    setCustomVariableName('');
    toast.success(`Custom variable ${variable} added!`);
  };

  // Render preview
  const renderPreview = () => {
    if (!selectedTemplate) return null;
    
    const previewWidth = previewMode === 'thermal-58' ? '58mm' : 
                         previewMode === 'thermal-80' ? '80mm' : '210mm';
    
    return (
      <div 
        className="bg-white mx-auto shadow-lg"
        style={{ 
          width: previewWidth,
          minHeight: '200px',
          padding: `${selectedTemplate.margin.top}mm ${selectedTemplate.margin.right}mm ${selectedTemplate.margin.bottom}mm ${selectedTemplate.margin.left}mm`,
          fontFamily: 'monospace',
          fontSize: '11px',
        }}
      >
        {selectedTemplate.elements.map((element, index) => (
          <div 
            key={element.id}
            className={`cursor-pointer transition-all ${
              selectedElement?.id === element.id ? 'bg-blue-50 ring-1 ring-blue-400' : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedElement(element)}
            style={element.style}
          >
            {renderElementPreview(element, index)}
          </div>
        ))}
      </div>
    );
  };

  // Render element preview
  const renderElementPreview = (element: PrintTemplateElement, index: number) => {
    // Replace variables with sample data
    const replaceVariables = (content: string) => {
      return content
        .replace(/\{\{shop_name\}\}/g, settings?.shopName || 'My Shop')
        .replace(/\{\{shop_address\}\}/g, settings?.shopAddress || '123 Main Street, City')
        .replace(/\{\{shop_phone\}\}/g, settings?.shopPhone || '+880 1234 567890')
        .replace(/\{\{shop_email\}\}/g, settings?.shopEmail || 'info@myshop.com')
        .replace(/\{\{invoice_number\}\}/g, 'INV-0001')
        .replace(/\{\{invoice_date\}\}/g, new Date().toLocaleDateString())
        .replace(/\{\{invoice_time\}\}/g, new Date().toLocaleTimeString())
        .replace(/\{\{invoice_datetime\}\}/g, new Date().toLocaleString())
        .replace(/\{\{customer_name\}\}/g, 'John Doe')
        .replace(/\{\{customer_phone\}\}/g, '+880 1712345678')
        .replace(/\{\{customer_address\}\}/g, '456 Customer Road')
        .replace(/\{\{subtotal\}\}/g, `${settings?.currencySymbol || '৳'}1,500.00`)
        .replace(/\{\{discount\}\}/g, `${settings?.currencySymbol || '৳'}100.00`)
        .replace(/\{\{tax\}\}/g, `${settings?.currencySymbol || '৳'}70.00`)
        .replace(/\{\{total\}\}/g, `${settings?.currencySymbol || '৳'}1,470.00`)
        .replace(/\{\{paid\}\}/g, `${settings?.currencySymbol || '৳'}1,500.00`)
        .replace(/\{\{due\}\}/g, `${settings?.currencySymbol || '৳'}0.00`)
        .replace(/\{\{change\}\}/g, `${settings?.currencySymbol || '৳'}30.00`)
        .replace(/\{\{payment_method\}\}/g, 'Cash')
        .replace(/\{\{payment_status\}\}/g, 'Paid')
        .replace(/\{\{footer_text\}\}/g, settings?.receiptFooter || 'Thank you for shopping!')
        .replace(/\{\{served_by\}\}/g, 'Admin')
        .replace(/\{\{items_count\}\}/g, '3')
        .replace(/\{\{total_quantity\}\}/g, '5');
    };
    
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
        return (
          <div className="w-full text-xs">
            <div className="flex justify-between border-b py-1 font-bold">
              <span>Item</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Total</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed">
              <span>Product A</span>
              <span>2</span>
              <span>500</span>
              <span>1,000</span>
            </div>
            <div className="flex justify-between py-1 border-b border-dashed">
              <span>Product B</span>
              <span>1</span>
              <span>500</span>
              <span>500</span>
            </div>
          </div>
        );
      
      case 'barcode':
        return (
          <div className="text-center py-2" style={element.style}>
            <div className="text-xs tracking-tighter font-mono">|||| |||| |||| ||||</div>
            <div className="text-xs">INV-0001</div>
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
          <div dangerouslySetInnerHTML={{ __html: element.content || '' }} style={element.style} />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <LayoutTemplate className="w-7 h-7 text-purple-600" />
              Print Template Editor
            </h1>
            <p className="text-gray-500 mt-1">Customize your invoice and receipt templates for thermal and regular printers</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowVariables(!showVariables)}>
              <Code className="w-4 h-4 mr-2" />
              Variables
            </Button>
            <Button onClick={createNewTemplate}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Templates List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{template.name}</span>
                        {template.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => { e.stopPropagation(); duplicateTemplate(template); }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id); }}
                          disabled={templates.length <= 1}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">{template.paperSize}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{template.type}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Variables Panel */}
            {showVariables && (
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Variables</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {['shop', 'invoice', 'customer', 'items', 'payment', 'other'].map(category => (
                        <div key={category}>
                          <h4 className="text-xs font-bold uppercase text-gray-500 mb-2 capitalize">{category}</h4>
                          <div className="space-y-1">
                            {TEMPLATE_VARIABLES.filter(v => v.category === category).map(variable => (
                              <div
                                key={variable.key}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                                onClick={() => copyVariable(variable.key)}
                              >
                                <div>
                                  <code className="text-xs text-purple-600">{variable.key}</code>
                                  <p className="text-xs text-gray-500">{variable.label}</p>
                                </div>
                                {copiedVariable === variable.key ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-3">
            {selectedTemplate && (
              <Tabs defaultValue="design">
                <TabsList className="mb-4">
                  <TabsTrigger value="design"><Settings2 className="w-4 h-4 mr-2" />Design</TabsTrigger>
                  <TabsTrigger value="preview"><Eye className="w-4 h-4 mr-2" />Preview</TabsTrigger>
                  <TabsTrigger value="css"><Code className="w-4 h-4 mr-2" />Custom CSS</TabsTrigger>
                </TabsList>

                <TabsContent value="design">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Template Settings */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Template Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Template Name</Label>
                          <Input
                            value={selectedTemplate.name}
                            onChange={(e) => updateTemplateSettings({ name: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Type</Label>
                            <Select
                              value={selectedTemplate.type}
                              onValueChange={(value) => updateTemplateSettings({ type: value as PrintTemplateType })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TEMPLATE_TYPES.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-2">
                                      {type.icon}
                                      {type.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Paper Size</Label>
                            <Select
                              value={selectedTemplate.paperSize}
                              onValueChange={(value) => {
                                const paper = PAPER_SIZES.find(p => p.value === value);
                                updateTemplateSettings({ 
                                  paperSize: value as PrintPaperSize,
                                  width: paper?.width || 80
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PAPER_SIZES.map(size => (
                                  <SelectItem key={size.value} value={size.value}>
                                    {size.label} ({size.width}mm)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Active</Label>
                          <Switch
                            checked={selectedTemplate.isActive}
                            onCheckedChange={(checked) => updateTemplateSettings({ isActive: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Set as Default</Label>
                          <Switch
                            checked={selectedTemplate.isDefault}
                            onCheckedChange={() => setAsDefault(selectedTemplate.id)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Add Elements */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Add Element</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-2">
                          {ELEMENT_TYPES.map(({ type, label, icon }) => (
                            <Button
                              key={type}
                              variant="outline"
                              className="flex flex-col h-auto py-3"
                              onClick={() => addElement(type)}
                            >
                              {icon}
                              <span className="text-xs mt-1">{label}</span>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Elements List */}
                  <Card className="mt-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Elements ({selectedTemplate.elements.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {selectedTemplate.elements.map((element, index) => (
                            <div
                              key={element.id}
                              className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                                selectedElement?.id === element.id
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-purple-300'
                              }`}
                              onClick={() => setSelectedElement(element)}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Badge variant="outline" className="capitalize shrink-0">{element.type}</Badge>
                                <span className="text-sm truncate">
                                  {element.content || element.type}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={(e) => { e.stopPropagation(); moveElement(element.id, 'up'); }}
                                  disabled={index === 0}
                                  title="Move Up"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={(e) => { e.stopPropagation(); moveElement(element.id, 'down'); }}
                                  disabled={index === selectedTemplate.elements.length - 1}
                                  title="Move Down"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-blue-500 hover:text-blue-700"
                                  onClick={(e) => { e.stopPropagation(); duplicateElement(element.id); }}
                                  title="Duplicate"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                  onClick={(e) => { e.stopPropagation(); deleteElement(element.id); }}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Element Editor */}
                  {selectedElement && (
                    <Card className="mt-6">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg capitalize">Edit {selectedElement.type} Element</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedElement.type === 'text' && (
                          <>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label>Content</Label>
                                <Dialog open={variableDialogOpen} onOpenChange={setVariableDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-1">
                                      <Plus className="w-3 h-3" /> Variable
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        <Code className="w-5 h-5 text-purple-600" />
                                        Insert Variable
                                      </DialogTitle>
                                    </DialogHeader>
                                    
                                    {/* Custom Variable Input */}
                                    <div className="border-b pb-4 mb-2">
                                      <Label className="text-sm font-medium mb-2 block">Add Custom Variable</Label>
                                      <div className="flex gap-2">
                                        <Input
                                          value={customVariableName}
                                          onChange={(e) => setCustomVariableName(e.target.value)}
                                          placeholder="e.g., custom_field"
                                          className="flex-1"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              addCustomVariable();
                                            }
                                          }}
                                        />
                                        <Button onClick={addCustomVariable} size="sm">
                                          <Sparkles className="w-4 h-4 mr-1" /> Add
                                        </Button>
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">Custom variables can be used for special data</p>
                                    </div>
                                    
                                    <div className="overflow-y-auto flex-1 space-y-3 py-2">
                                      {['shop', 'invoice', 'customer', 'items', 'payment', 'other'].map(category => (
                                        <div key={category}>
                                          <h4 className="text-xs font-bold uppercase text-gray-500 mb-2 capitalize sticky top-0 bg-white py-1">{category}</h4>
                                          <div className="grid grid-cols-1 gap-1">
                                            {TEMPLATE_VARIABLES.filter(v => v.category === category).map(variable => (
                                              <div
                                                key={variable.key}
                                                className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-all"
                                                onClick={() => insertVariable(variable.key)}
                                              >
                                                <div className="flex-1">
                                                  <code className="text-xs text-purple-600 font-mono">{variable.key}</code>
                                                  <p className="text-xs text-gray-500">{variable.label}</p>
                                                </div>
                                                <Plus className="w-4 h-4 text-purple-500" />
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                              <Textarea
                                value={selectedElement.content || ''}
                                onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                                rows={3}
                                placeholder="Enter text or use variables like {{shop_name}}"
                                className="font-mono"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                💡 Tip: Click "Variable" button to insert predefined or custom variables
                              </p>
                              
                              {/* Quick Variables */}
                              <div className="mt-3">
                                <Label className="text-xs font-medium text-gray-600 mb-2 block">Quick Variables</Label>
                                <div className="flex flex-wrap gap-1">
                                  {[
                                    { key: '{{shop_name}}', label: 'Shop' },
                                    { key: '{{invoice_number}}', label: 'Invoice#' },
                                    { key: '{{invoice_date}}', label: 'Date' },
                                    { key: '{{customer_name}}', label: 'Customer' },
                                    { key: '{{total}}', label: 'Total' },
                                    { key: '{{paid}}', label: 'Paid' },
                                    { key: '{{due}}', label: 'Due' },
                                    { key: '{{served_by}}', label: 'Served By' },
                                    { key: '{{footer_text}}', label: 'Footer' },
                                  ].map(v => (
                                    <Button
                                      key={v.key}
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs px-2"
                                      onClick={() => insertVariable(v.key)}
                                    >
                                      {v.label}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {selectedElement.type === 'html' && (
                          <div>
                            <Label>Custom HTML</Label>
                            <Textarea
                              value={selectedElement.content || ''}
                              onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                              rows={5}
                              className="font-mono text-sm"
                              placeholder="<div>Your custom HTML</div>"
                            />
                          </div>
                        )}

                        {selectedElement.type === 'image' && (
                          <div>
                            <Label>Image URL</Label>
                            <Input
                              value={selectedElement.content || ''}
                              onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                              placeholder="https://example.com/logo.png"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty to use shop logo</p>
                          </div>
                        )}

                        {selectedElement.type === 'spacer' && (
                          <div>
                            <Label>Height</Label>
                            <Input
                              value={selectedElement.style?.height || '10px'}
                              onChange={(e) => updateElement(selectedElement.id, { 
                                style: { ...selectedElement.style, height: e.target.value } 
                              })}
                              placeholder="e.g., 10px, 20px"
                            />
                          </div>
                        )}

                        {(selectedElement.type === 'text' || selectedElement.type === 'table') && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Font Size</Label>
                                <Select
                                  value={selectedElement.style?.fontSize || '11px'}
                                  onValueChange={(value) => updateElement(selectedElement.id, { 
                                    style: { ...selectedElement.style, fontSize: value } 
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'].map(size => (
                                      <SelectItem key={size} value={size}>{size}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Text Align</Label>
                                <Select
                                  value={selectedElement.style?.textAlign || 'left'}
                                  onValueChange={(value) => updateElement(selectedElement.id, { 
                                    style: { ...selectedElement.style, textAlign: value as 'left' | 'center' | 'right' } 
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="left">Left</SelectItem>
                                    <SelectItem value="center">Center</SelectItem>
                                    <SelectItem value="right">Right</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <Label>Bold</Label>
                                <Switch
                                  checked={selectedElement.style?.fontWeight === 'bold'}
                                  onCheckedChange={(checked) => updateElement(selectedElement.id, { 
                                    style: { ...selectedElement.style, fontWeight: checked ? 'bold' : 'normal' } 
                                  })}
                                />
                              </div>
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <Label>Italic</Label>
                                <Switch
                                  checked={selectedElement.style?.fontStyle === 'italic'}
                                  onCheckedChange={(checked) => updateElement(selectedElement.id, { 
                                    style: { ...selectedElement.style, fontStyle: checked ? 'italic' : 'normal' } 
                                  })}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Text Color</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="color"
                                  value={selectedElement.style?.color || '#000000'}
                                  onChange={(e) => updateElement(selectedElement.id, { 
                                    style: { ...selectedElement.style, color: e.target.value } 
                                  })}
                                  className="w-12 h-10 p-1"
                                />
                                <Input
                                  value={selectedElement.style?.color || '#000000'}
                                  onChange={(e) => updateElement(selectedElement.id, { 
                                    style: { ...selectedElement.style, color: e.target.value } 
                                  })}
                                  placeholder="#000000"
                                  className="flex-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Background Color</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="color"
                                  value={selectedElement.style?.backgroundColor || '#ffffff'}
                                  onChange={(e) => updateElement(selectedElement.id, { 
                                    style: { ...selectedElement.style, backgroundColor: e.target.value } 
                                  })}
                                  className="w-12 h-10 p-1"
                                />
                                <Input
                                  value={selectedElement.style?.backgroundColor || ''}
                                  onChange={(e) => updateElement(selectedElement.id, { 
                                    style: { ...selectedElement.style, backgroundColor: e.target.value } 
                                  })}
                                  placeholder="transparent or #ffffff"
                                  className="flex-1"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <Label className="text-xs">Padding Top</Label>
                                <Input
                                  value={selectedElement.style?.paddingTop || '0px'}
                                  onChange={(e) => updateElement(selectedElement.id, { 
                                    style: { ...selectedElement.style, paddingTop: e.target.value } 
                                  })}
                                  placeholder="0px"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Padding Bottom</Label>
                                <Input
                                  value={selectedElement.style?.paddingBottom || '0px'}
                                  onChange={(e) => updateElement(selectedElement.id, { 
                                    style: { ...selectedElement.style, paddingBottom: e.target.value } 
                                  })}
                                  placeholder="0px"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Margin Top</Label>
                                <Input
                                  value={selectedElement.style?.marginTop || '0px'}
                                  onChange={(e) => updateElement(selectedElement.id, { 
                                    style: { ...selectedElement.style, marginTop: e.target.value } 
                                  })}
                                  placeholder="0px"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Margin Bottom</Label>
                                <Input
                                  value={selectedElement.style?.marginBottom || '0px'}
                                  onChange={(e) => updateElement(selectedElement.id, { 
                                    style: { ...selectedElement.style, marginBottom: e.target.value } 
                                  })}
                                  placeholder="0px"
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="preview">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Live Preview</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={previewMode === 'thermal-58' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPreviewMode('thermal-58')}
                          >
                            <Smartphone className="w-4 h-4 mr-1" /> 58mm
                          </Button>
                          <Button
                            variant={previewMode === 'thermal-80' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPreviewMode('thermal-80')}
                          >
                            <Tablet className="w-4 h-4 mr-1" /> 80mm
                          </Button>
                          <Button
                            variant={previewMode === 'a4' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPreviewMode('a4')}
                          >
                            <Monitor className="w-4 h-4 mr-1" /> A4
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-100 p-6 rounded-lg flex justify-center overflow-auto">
                        {renderPreview()}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="css">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Custom CSS</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Add custom CSS styles for this template</Label>
                        <Textarea
                          value={selectedTemplate.customCSS || ''}
                          onChange={(e) => updateTemplateSettings({ customCSS: e.target.value })}
                          rows={10}
                          className="font-mono text-sm"
                          placeholder={`/* Example custom styles */
.invoice-header {
  border-bottom: 2px solid #000;
}
.total-row {
  font-size: 16px;
  font-weight: bold;
}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
