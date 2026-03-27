import React, { useState, useEffect } from 'react';
import { AppSettings, User, PrintTemplate } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  Store, Users, Plus, Edit, Trash2, X, Shield, Eye, EyeOff,
  CheckCircle, UserCheck, UserX, Save, Key, Mail, Phone, AtSign,
  Info, Sparkles, Rocket, Zap, Globe, Database, BarChart3,
  ShoppingCart, Package, Truck, Calculator, CreditCard, Settings as SettingsIcon,
  Crown, Star, Scan, Wallet, Printer, Copy, Monitor, Smartphone, Tablet,
  Image as ImageIcon, Facebook, Instagram, Youtube, Clock, Building, Globe2, Camera, AlertCircle,
  Cloud, Upload, Download, RefreshCw, HardDrive, FileJson, Check, Loader2, CloudOff,
  ExternalLink, Link, Unlink, Lock, Unlock, Server, HelpCircle, BookOpen, Layout, Calendar
} from 'lucide-react';
import UserManagement from './UserManagement';
import SupportManagement from './SupportManagement';
import ConfigurationGuide from './ConfigurationGuide';
import FooterManagement from './FooterManagement';
import { 
  getTemplates, 
  getDefaultTemplate, 
  saveTemplates, 
  saveTemplate,
  createTemplate,
  generateId, 
  READY_MADE_TEMPLATES,
  TEMPLATE_VARIABLES
} from '@/lib/printTemplates';
import { PrintTemplateElement } from '@/types';
import { ClickableImage } from '@/components/ui/image-preview';

// Version Information (defaults - will be overridden by database)
const VERSION_INFO_DEFAULT = {
  name: 'Dokan POS Pro',
  version: 'v6.1.0',
  releaseDate: '2024',
  edition: 'Business Pro',
  productionDomain: 'https://shopv9.vercel.app',
  releaseYear: '2024',
  features: [
    { name: { en: 'Scanner POS', bn: 'স্ক্যানার পিওএস' }, icon: Scan, desc: { en: 'Barcode scanning with enhanced checkout', bn: 'বারকোড স্ক্যানিং ও উন্নত চেকআউট' } },
    { name: { en: 'Standard POS', bn: 'স্ট্যান্ডার্ড পিওএস' }, icon: CreditCard, desc: { en: 'Full-featured point of sale system', bn: 'সম্পূর্ণ পয়েন্ট অফ সেল সিস্টেম' } },
    { name: { en: 'Enhanced Checkout UI', bn: 'উন্নত চেকআউট ইউআই' }, icon: Wallet, desc: { en: 'Beautiful payment modal design', bn: 'সুন্দর পেমেন্ট মোডাল ডিজাইন' } },
    { name: { en: 'Customer Selection', bn: 'কাস্টমার সিলেকশন' }, icon: Users, desc: { en: 'Search dropdown with avatar', bn: 'অ্যাভাটার সহ সার্চ ড্রপডাউন' } },
    { name: { en: 'Item Edit in Checkout', bn: 'চেকআউটে আইটেম এডিট' }, icon: Package, desc: { en: 'Edit quantity & price in checkout', bn: 'চেকআউটে পরিমাণ ও দাম এডিট' } },
    { name: { en: 'BDT Currency', bn: 'বিডিটি মুদ্রা' }, icon: CreditCard, desc: { en: 'Bangladeshi Taka format (৳)', bn: 'বাংলাদেশি টাকা ফরম্যাট (৳)' } },
    { name: { en: 'Coupon Style Totals', bn: 'কুপন স্টাইল টোটাল' }, icon: CreditCard, desc: { en: 'Eye-catching discount display', bn: 'আকর্ষণীয় ডিসকাউন্ট ডিসপ্লে' } },
    { name: { en: 'Stock Purchases', bn: 'স্টক পারচেজ' }, icon: Truck, desc: { en: 'Supplier purchase management', bn: 'সাপ্লায়ার পারচেজ ম্যানেজমেন্ট' } },
    { name: { en: 'Supplier Search', bn: 'সাপ্লায়ার সার্চ' }, icon: Users, desc: { en: 'Search & select supplier in purchases', bn: 'পারচেজে সাপ্লায়ার সার্চ ও সিলেক্ট' } },
    { name: { en: 'Mobile Friendly UI', bn: 'মোবাইল ফ্রেন্ডলি ইউআই' }, icon: CreditCard, desc: { en: 'Standard POS style mobile design', bn: 'স্ট্যান্ডার্ড পিওএস স্টাইল মোবাইল ডিজাইন' } },
    { name: { en: 'Smart Amount Buttons', bn: 'স্মার্ট অ্যামাউন্ট বাটন' }, icon: Calculator, desc: { en: 'Quick payment suggestions', bn: 'দ্রুত পেমেন্ট সাজেশন' } },
    { name: { en: 'Inventory Management', bn: 'ইনভেন্টরি ম্যানেজমেন্ট' }, icon: Package, desc: { en: 'Stock tracking & product management', bn: 'স্টক ট্র্যাকিং ও প্রোডাক্ট ম্যানেজমেন্ট' } },
    { name: { en: 'Sales History', bn: 'সেলস হিস্ট্রি' }, icon: BarChart3, desc: { en: 'Complete sales records & analytics', bn: 'সম্পূর্ণ সেলস রেকর্ড ও অ্যানালিটিক্স' } },
    { name: { en: 'Purchase Management', bn: 'পারচেজ ম্যানেজমেন্ট' }, icon: Truck, desc: { en: 'Supplier purchases & stock updates', bn: 'সাপ্লায়ার পারচেজ ও স্টক আপডেট' } },
    { name: { en: 'Customer Management', bn: 'কাস্টমার ম্যানেজমেন্ট' }, icon: Users, desc: { en: 'Customer database & due tracking', bn: 'কাস্টমার ডাটাবেস ও বকেয়া ট্র্যাকিং' } },
    { name: { en: 'Supplier Management', bn: 'সাপ্লায়ার ম্যানেজমেন্ট' }, icon: Truck, desc: { en: 'Supplier database & balance tracking', bn: 'সাপ্লায়ার ডাটাবেস ও ব্যালেন্স ট্র্যাকিং' } },
    { name: { en: 'Accounting', bn: 'হিসাবরক্ষণ' }, icon: Calculator, desc: { en: 'Expense tracking & financial reports', bn: 'খরচ ট্র্যাকিং ও ফিনান্সিয়াল রিপোর্ট' } },
    { name: { en: 'Reports & Analytics', bn: 'রিপোর্ট ও অ্যানালিটিক্স' }, icon: BarChart3, desc: { en: 'Business insights & analytics', bn: 'বিজনেস ইনসাইট ও অ্যানালিটিক্স' } },
    { name: { en: 'Multi-User System', bn: 'মাল্টি-ইউজার সিস্টেম' }, icon: Shield, desc: { en: 'Role-based access control', bn: 'রোল-ভিত্তিক অ্যাক্সেস কন্ট্রোল' } },
    { name: { en: 'Bangla/English', bn: 'বাংলা/ইংরেজি' }, icon: Globe, desc: { en: 'Bilingual language support', bn: 'দ্বিভাষিক ভাষা সাপোর্ট' } },
    { name: { en: 'Live Dashboard', bn: 'লাইভ ড্যাশবোর্ড' }, icon: Zap, desc: { en: 'Real-time business overview', bn: 'রিয়েল-টাইম বিজনেস ওভারভিউ' } },
    { name: { en: 'Cloud Database', bn: 'ক্লাউড ডাটাবেস' }, icon: Database, desc: { en: 'Secure cloud database', bn: 'নিরাপদ ক্লাউড ডাটাবেস' } },
    { name: { en: 'Activity Logs', bn: 'অ্যাক্টিভিটি লগ' }, icon: SettingsIcon, desc: { en: 'Track all user activities', bn: 'সকল ইউজার কার্যকলাপ ট্র্যাক' } },
    { name: { en: 'Support Center', bn: 'সাপোর্ট সেন্টার' }, icon: HelpCircle, desc: { en: 'Tutorials, FAQ & documentation', bn: 'টিউটোরিয়াল, FAQ ও ডকুমেন্টেশন' } },
    { name: { en: 'Print Templates', bn: 'প্রিন্ট টেমপ্লেট' }, icon: Printer, desc: { en: 'Customizable receipt templates', bn: 'কাস্টমাইজেবল রসিদ টেমপ্লেট' } },
    { name: { en: 'Auto Backup', bn: 'অটো ব্যাকআপ' }, icon: Cloud, desc: { en: 'Daily & monthly backup system', bn: 'দৈনিক ও মাসিক ব্যাকআপ সিস্টেম' } },
    { name: { en: 'Shop Branding', bn: 'শপ ব্র্যান্ডিং' }, icon: Store, desc: { en: 'Custom logo, name & loading screen', bn: 'কাস্টম লোগো, নাম ও লোডিং স্ক্রিন' } },
    { name: { en: 'Due Collection', bn: 'বকেয়া সংগ্রহ' }, icon: Wallet, desc: { en: 'Customer due payment tracking', bn: 'কাস্টমার বকেয়া পেমেন্ট ট্র্যাকিং' } },
    { name: { en: 'Profit Reports', bn: 'লাভের রিপোর্ট' }, icon: BarChart3, desc: { en: 'Detailed profit & loss analysis', bn: 'বিস্তারিত লাভ-ক্ষতি বিশ্লেষণ' } },
    { name: { en: 'Stock Alerts', bn: 'স্টক এলার্ট' }, icon: AlertCircle, desc: { en: 'Low stock notifications', bn: 'স্টক কম হলে নোটিফিকেশন' } },
    { name: { en: 'Footer Management', bn: 'ফুটার ম্যানেজমেন্ট' }, icon: Layout, desc: { en: 'Customize footer links & info', bn: 'ফুটার লিংক ও তথ্য কাস্টমাইজ' } },
  ]
};

// App Config from database (name, version)
interface AppConfig {
  appName: string;
  appVersion: string;
  productionDomain: string;
  releaseYear: string;
}

interface Props {
  settings: AppSettings | null;
  users: User[];
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onAddUser?: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateUser?: (id: string, user: Partial<User>) => void;
  onDeleteUser?: (id: string) => void;
  currentUserRole?: string;
  currentUserPermissions?: Record<string, boolean>;
}

interface UserFormData {
  name: string;
  username: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Manager' | 'Salesman' | 'Viewer';
  password: string;
  permissions: {
    pos: boolean;
    inventory: boolean;
    sales: boolean;
    purchases: boolean;
    customers: boolean;
    suppliers: boolean;
    accounting: boolean;
    reports: boolean;
    settings: boolean;
    users: boolean;
  };
}

const defaultPermissions = {
  pos: true,
  inventory: true,
  sales: true,
  purchases: false,
  customers: true,
  suppliers: false,
  accounting: false,
  reports: true,
  settings: false,
  users: false,
};

const rolePermissions: Record<string, Partial<typeof defaultPermissions>> = {
  Admin: { pos: true, inventory: true, sales: true, purchases: true, customers: true, suppliers: true, accounting: true, reports: true, settings: true, users: true },
  Manager: { pos: true, inventory: true, sales: true, purchases: true, customers: true, suppliers: true, accounting: true, reports: true, settings: false, users: false },
  Salesman: { pos: true, inventory: false, sales: true, purchases: false, customers: true, suppliers: false, accounting: false, reports: true, settings: false, users: false },
  Viewer: { pos: false, inventory: false, sales: true, purchases: false, customers: false, suppliers: false, accounting: false, reports: true, settings: false, users: false },
};

const Settings: React.FC<Props> = ({ 
  settings, 
  users, 
  onUpdateSettings,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUserRole,
  currentUserPermissions
}) => {
  const { lang, t } = useLanguage();
  
  // Permission checks - ONLY Master Admin has full access, all others need explicit permissions
  const canManageUsers = currentUserRole === 'Master Admin' || currentUserPermissions?.users_view === true;
  
  // Check if user can manage print templates
  const canManagePrintTemplates = currentUserRole === 'Master Admin' || currentUserPermissions?.print_templates === true;
  
  // Check if user can edit settings
  const canEditSettings = currentUserRole === 'Master Admin' || currentUserPermissions?.settings_edit === true;
  
  // Check if user can view settings
  const canViewSettings = currentUserRole === 'Master Admin' || currentUserPermissions?.settings_view === true;
  
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'print' | 'pos' | 'backup' | 'config' | 'support' | 'configguide' | 'footer' | 'about'>('profile');
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null);
  const [previewSize, setPreviewSize] = useState<'thermal-58' | 'thermal-80' | 'a4'>('thermal-80');
  
  // App config from database (name, version, etc.)
  const [appConfig, setAppConfig] = useState<AppConfig>({
    appName: VERSION_INFO_DEFAULT.name,
    appVersion: VERSION_INFO_DEFAULT.version,
    productionDomain: VERSION_INFO_DEFAULT.productionDomain || '',
    releaseYear: VERSION_INFO_DEFAULT.releaseYear || '2024',
  });
  
  // Function to refresh app config from database
  const refreshAppConfig = async () => {
    try {
      const res = await fetch('/api/app-config');
      if (res.ok) {
        const data = await res.json();
        setAppConfig({
          appName: data.appName || VERSION_INFO_DEFAULT.name,
          appVersion: data.appVersion || VERSION_INFO_DEFAULT.version,
          productionDomain: data.productionDomain || '',
          releaseYear: data.releaseYear || '2024',
        });
        console.log('App config refreshed:', data);
      }
    } catch (error) {
      console.error('Failed to refresh app config:', error);
    }
  };
  
  // Fetch app config from database on mount
  useEffect(() => {
    const fetchAppConfig = async () => {
      try {
        const res = await fetch('/api/app-config');
        if (res.ok) {
          const data = await res.json();
          setAppConfig({
            appName: data.appName || VERSION_INFO_DEFAULT.name,
            appVersion: data.appVersion || VERSION_INFO_DEFAULT.version,
            productionDomain: data.productionDomain || '',
            releaseYear: data.releaseYear || '2024',
          });
        }
      } catch (error) {
        console.error('Failed to fetch app config:', error);
      }
    };
    fetchAppConfig();
  }, []);
  
  // Version info with database values
  const VERSION_INFO = {
    ...VERSION_INFO_DEFAULT,
    name: appConfig.appName,
    version: appConfig.appVersion,
    productionDomain: appConfig.productionDomain || VERSION_INFO_DEFAULT.productionDomain,
    releaseDate: appConfig.releaseYear || VERSION_INFO_DEFAULT.releaseDate,
  };
  
  // Load templates on mount
  useEffect(() => {
    const loadedTemplates = getTemplates();
    setTemplates(loadedTemplates);
    setSelectedTemplate(getDefaultTemplate());
  }, []);
  
  // Set template as default
  const setAsDefaultTemplate = (templateId: string) => {
    const updated = templates.map(t => ({
      ...t,
      isDefault: t.id === templateId,
    }));
    setTemplates(updated);
    saveTemplates(updated);
    
    // Update selected template to reflect the new default status
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate({ ...selectedTemplate, isDefault: true });
    } else if (selectedTemplate) {
      setSelectedTemplate({ ...selectedTemplate, isDefault: false });
    }
    
    // Show confirmation
    alert(lang === 'bn' ? 'ডিফল্ট টেমপ্লেট সেট করা হয়েছে!' : 'Default template set successfully!');
  };
  
  // Duplicate template
  const duplicateTemplate = (template: PrintTemplate) => {
    const newTemplate: PrintTemplate = {
      ...template,
      id: generateId(),
      name: `${template.name} (Copy)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    saveTemplates(updated);
  };
  
  // Delete template
  const deleteTemplate = (templateId: string) => {
    if (templates.length <= 1) return;
    const updated = templates.filter(t => t.id !== templateId);
    setTemplates(updated);
    saveTemplates(updated);
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(updated[0]);
    }
  };
  
  // Reset to ready-made templates
  const resetTemplates = () => {
    saveTemplates(READY_MADE_TEMPLATES);
    setTemplates(READY_MADE_TEMPLATES);
    setSelectedTemplate(READY_MADE_TEMPLATES.find(t => t.isDefault) || READY_MADE_TEMPLATES[0]);
  };

  // Template Editor State
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PrintTemplate | null>(null);
  const [selectedElement, setSelectedElement] = useState<PrintTemplateElement | null>(null);
  const [showVariableSelector, setShowVariableSelector] = useState(false);

  // Create new template
  const handleCreateTemplate = () => {
    const newTemplate = createTemplate(
      lang === 'bn' ? 'নতুন টেমপ্লেট' : 'New Template',
      'thermal-80'
    );
    setEditingTemplate(newTemplate);
    setSelectedElement(null);
    setShowTemplateEditor(true);
  };

  // Edit existing template
  const handleEditTemplate = (template: PrintTemplate) => {
    setEditingTemplate({ ...template });
    setSelectedElement(null);
    setShowTemplateEditor(true);
  };

  // Save edited template
  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    
    const existingIndex = templates.findIndex(t => t.id === editingTemplate.id);
    let updatedTemplates: PrintTemplate[];
    
    if (existingIndex >= 0) {
      updatedTemplates = [...templates];
      updatedTemplates[existingIndex] = editingTemplate;
    } else {
      updatedTemplates = [...templates, editingTemplate];
    }
    
    setTemplates(updatedTemplates);
    saveTemplates(updatedTemplates);
    setSelectedTemplate(editingTemplate);
    setShowTemplateEditor(false);
    setEditingTemplate(null);
  };

  // Add element to template
  const addElement = (type: PrintTemplateElement['type']) => {
    if (!editingTemplate) return;
    
    const newElement: PrintTemplateElement = {
      id: generateId(),
      type,
      content: type === 'text' ? '{{shop_name}}' : type === 'table' ? '{{items_table}}' : '',
      style: type === 'text' ? { fontSize: '12px', textAlign: 'left' } : 
             type === 'spacer' ? { height: '10px' } : {},
    };
    
    setEditingTemplate({
      ...editingTemplate,
      elements: [...editingTemplate.elements, newElement],
    });
    setSelectedElement(newElement);
  };

  // Update element
  const updateElement = (elementId: string, updates: Partial<PrintTemplateElement>) => {
    if (!editingTemplate) return;
    
    setEditingTemplate({
      ...editingTemplate,
      elements: editingTemplate.elements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      ),
    });
  };

  // Delete element
  const deleteElement = (elementId: string) => {
    if (!editingTemplate) return;
    
    setEditingTemplate({
      ...editingTemplate,
      elements: editingTemplate.elements.filter(el => el.id !== elementId),
    });
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
  };

  // Move element up/down
  const moveElement = (elementId: string, direction: 'up' | 'down') => {
    if (!editingTemplate) return;
    
    const elements = [...editingTemplate.elements];
    const index = elements.findIndex(el => el.id === elementId);
    
    if (direction === 'up' && index > 0) {
      [elements[index - 1], elements[index]] = [elements[index], elements[index - 1]];
    } else if (direction === 'down' && index < elements.length - 1) {
      [elements[index], elements[index + 1]] = [elements[index + 1], elements[index]];
    }
    
    setEditingTemplate({ ...editingTemplate, elements });
  };

  // Insert variable into content
  const insertVariable = (variable: string) => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    
    const currentContent = selectedElement.content || '';
    updateElement(selectedElement.id, {
      content: currentContent + variable,
    });
    setShowVariableSelector(false);
  };

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userForm, setUserForm] = useState<UserFormData>({
    name: '',
    username: '',
    email: '',
    phone: '',
    role: 'Salesman',
    password: '',
    permissions: { ...defaultPermissions },
  });
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    // Only get values that exist in the form
    const updateData: Record<string, string> = {};
    
    const shopName = fd.get('shopName') as string;
    const shopLogo = fd.get('shopLogo') as string;
    const shopBio = fd.get('shopBio') as string;
    const shopAddress = fd.get('shopAddress') as string;
    const loadingText = fd.get('loadingText') as string;
    const shopPhone = fd.get('shopPhone') as string;
    const shopEmail = fd.get('shopEmail') as string;
    
    if (shopName) updateData.shopName = shopName;
    if (shopLogo) updateData.shopLogo = shopLogo;
    if (shopBio) updateData.shopBio = shopBio;
    if (shopAddress) updateData.shopAddress = shopAddress;
    if (loadingText) updateData.loadingText = loadingText;
    if (shopPhone) updateData.shopPhone = shopPhone;
    if (shopEmail) updateData.shopEmail = shopEmail;
    
    console.log('handleProfileUpdate - sending:', updateData);
    
    try {
      // Call the API directly to ensure it saves
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      const result = await res.json();
      console.log('API response:', result);
      
      if (res.ok) {
        // Also call onUpdateSettings to update local state
        onUpdateSettings(updateData);
        alert(lang === 'bn' ? 'শপ প্রোফাইল আপডেট সম্পন্ন হয়েছে!' : 'Shop Profile Updated Successfully!');
      } else {
        console.error('Save failed:', result);
        alert(lang === 'bn' ? 'সংরক্ষণ ব্যর্থ হয়েছে!' : 'Failed to save settings!');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert(lang === 'bn' ? 'সংরক্ষণে সমস্যা হয়েছে!' : 'Error saving settings!');
    }
  };

  const openAddUserModal = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      username: '',
      email: '',
      phone: '',
      role: 'Salesman',
      password: '',
      permissions: { ...rolePermissions.Salesman, ...defaultPermissions },
    });
    setShowUserModal(true);
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      role: (user.role as 'Admin' | 'Manager' | 'Salesman' | 'Viewer') || 'Salesman',
      password: '',
      permissions: user.permissions || { ...rolePermissions[user.role || 'Salesman'] },
    });
    setShowUserModal(true);
  };

  const handleRoleChange = (role: 'Admin' | 'Manager' | 'Salesman' | 'Viewer') => {
    setUserForm(prev => ({
      ...prev,
      role,
      permissions: { ...defaultPermissions, ...rolePermissions[role] },
    }));
  };

  const handlePermissionChange = (key: keyof typeof defaultPermissions) => {
    setUserForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  };

  const handleSaveUser = () => {
    if (!userForm.name || !userForm.username) {
      alert(lang === 'bn' ? 'নাম এবং ইউজারনেম প্রয়োজন' : 'Name and Username are required');
      return;
    }

    if (editingUser) {
      // Update existing user
      onUpdateUser?.(editingUser.id, {
        name: userForm.name,
        username: userForm.username,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        permissions: userForm.permissions,
      });
    } else {
      // Add new user - include password
      onAddUser?.({
        name: userForm.name,
        username: userForm.username,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        password: userForm.password || '123456', // Default password if not provided
        isActive: true,
        permissions: userForm.permissions,
      });
    }
    setShowUserModal(false);
    setEditingUser(null);
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      onDeleteUser?.(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Manager': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Salesman': return 'bg-green-100 text-green-700 border-green-200';
      case 'Viewer': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header Tabs */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('profile')} 
          className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
            activeTab === 'profile' 
              ? 'bg-slate-900 text-white shadow-lg' 
              : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span className="hidden sm:inline">{lang === 'bn' ? 'শপ প্রোফাইল' : 'Shop Profile'}</span>
          <span className="sm:hidden">Profile</span>
        </button>
        {canManageUsers && (
          <button 
            onClick={() => setActiveTab('users')} 
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              activeTab === 'users' 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'ইউজার ম্যানেজমেন্ট' : 'User Management'}</span>
            <span className="sm:hidden">Users</span>
          </button>
        )}
        {canManagePrintTemplates && (
          <button 
            onClick={() => setActiveTab('print')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              activeTab === 'print'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'প্রিন্ট টেমপ্লেট' : 'Print Templates'}</span>
            <span className="sm:hidden">Print</span>
          </button>
        )}
        {/* POS Settings Tab - Master Admin Only */}
        {currentUserRole === 'Master Admin' && (
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              activeTab === 'pos'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'পিওএস সেটিংস' : 'POS Settings'}</span>
            <span className="sm:hidden">POS</span>
          </button>
        )}
        {/* Backup Tab - Master Admin Only */}
        {currentUserRole === 'Master Admin' && (
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              activeTab === 'backup'
                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30'
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'ব্যাকআপ' : 'Backup'}</span>
            <span className="sm:hidden">Backup</span>
          </button>
        )}
        {/* Configuration Tab - Master Admin Only */}
        {currentUserRole === 'Master Admin' && (
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              activeTab === 'config'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'কনফিগারেশন' : 'Config'}</span>
            <span className="sm:hidden">Config</span>
          </button>
        )}
        {/* Support Tab - Master Admin Only */}
        {currentUserRole === 'Master Admin' && (
          <button
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              activeTab === 'support'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30'
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'সাপোর্ট' : 'Support'}</span>
            <span className="sm:hidden">Support</span>
          </button>
        )}
        {/* Config Guide Tab - Master Admin Only */}
        {currentUserRole === 'Master Admin' && (
          <button
            onClick={() => setActiveTab('configguide')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              activeTab === 'configguide'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'কনফিগ গাইড' : 'Config Guide'}</span>
            <span className="sm:hidden">Guide</span>
          </button>
        )}
        {/* Footer Tab - Master Admin Only */}
        {currentUserRole === 'Master Admin' && (
          <button
            onClick={() => setActiveTab('footer')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              activeTab === 'footer'
                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30'
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'ফুটার' : 'Footer'}</span>
            <span className="sm:hidden">Footer</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('about')} 
          className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
            activeTab === 'about' 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30' 
              : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Info className="w-4 h-4" />
          <span className="hidden sm:inline">{lang === 'bn' ? 'সিস্টেম তথ্য' : 'System Info'}</span>
          <span className="sm:hidden">Info</span>
        </button>
      </div>

      {/* Access Denied Message */}
      {!canManageUsers && activeTab === 'users' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-700">{lang === 'bn' ? 'অ্যাক্সেস প্রত্যাখ্যাত' : 'Access Denied'}</h3>
          <p className="text-red-600 text-sm mt-2">{lang === 'bn' ? 'আপনার ইউজার ম্যানেজ করার অনুমতি নেই।' : "You don't have permission to manage users."}</p>
          <button 
            onClick={() => setActiveTab('profile')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all"
          >
            {lang === 'bn' ? 'প্রোফাইলে যান' : 'Go to Profile'}
          </button>
        </div>
      )}

      {/* Support Management Tab */}
      {activeTab === 'support' && (
        <SupportManagement />
      )}

      {/* Configuration Guide Tab */}
      {activeTab === 'configguide' && (
        <ConfigurationGuide />
      )}

      {/* Footer Management Tab */}
      {activeTab === 'footer' && (
        <FooterManagement />
      )}

      {/* System Info Tab */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          {/* Version Header Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <span className="text-5xl font-black text-white">D</span>
              </div>
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h2 className="text-3xl font-black text-white tracking-tight">{VERSION_INFO.name}</h2>
                  <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    PRO
                  </span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-4 text-slate-400">
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    {VERSION_INFO.version}
                  </span>
                  <span>•</span>
                  <span>{VERSION_INFO.edition}</span>
                  <span>•</span>
                  <span>{VERSION_INFO.releaseDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-emerald-500" />
                {lang === 'bn' ? 'অন্তর্ভুক্ত ফিচারসমূহ' : 'Included Features'}
              </h3>
              <p className="text-slate-500 text-sm mt-1">{lang === 'bn' ? 'এই ভার্সনে যা যা আছে' : 'Everything included in this version'}</p>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {VERSION_INFO.features.map((feature, index) => {
                const Icon = feature.icon;
                const featureName = typeof feature.name === 'string' ? feature.name : feature.name[lang as 'en' | 'bn'];
                const featureDesc = typeof feature.desc === 'string' ? feature.desc : feature.desc[lang as 'en' | 'bn'];
                return (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100 hover:border-emerald-200 hover:from-emerald-50/50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{featureName}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{featureDesc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Shop Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{lang === 'bn' ? 'শপ পরিচয়' : 'Shop Identity'}</h3>
            <p className="text-slate-400 text-sm mt-1">{lang === 'bn' ? 'আপনার দোকানের তথ্য কনফিগার করুন' : "Configure your shop's public information"}</p>
          </div>
          <form onSubmit={handleProfileUpdate} className="p-6 sm:p-8 space-y-8">
            {/* Logo Section */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <ImageIcon className="w-3 h-3" />
                {lang === 'bn' ? 'শপ লোগো URL' : 'Shop Logo URL'}
              </label>
              <input 
                name="shopLogo" 
                defaultValue={settings?.shopLogo || ''} 
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-slate-900 transition-all" 
                placeholder="https://example.com/logo.png"
              />
              {settings?.shopLogo && (
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-50">
                  <ClickableImage src={settings.shopLogo} alt="Shop Logo" className="w-full h-full object-contain" />
                </div>
              )}
              <p className="text-xs text-slate-400">{lang === 'bn' ? 'এই লোগো লোডিং স্ক্রিন ও মেনুবারে দেখাবে' : 'This logo will show in loading screen and menu bar'}</p>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4" />
                {lang === 'bn' ? 'মৌলিক তথ্য' : 'Basic Information'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">{lang === 'bn' ? 'দোকানের নাম' : 'Shop Name'} *</label>
                  <input 
                    name="shopName" 
                    defaultValue={settings?.shopName || ''} 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-slate-900 transition-all" 
                    placeholder={lang === 'bn' ? 'আপনার দোকানের নাম' : 'Your Shop Name'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">{lang === 'bn' ? 'ট্যাগলাইন / স্লোগান' : 'Tagline / Slogan'}</label>
                  <input 
                    name="shopBio" 
                    defaultValue={settings?.shopBio || ''} 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-slate-900 transition-all" 
                    placeholder={lang === 'bn' ? 'স্মার্ট শপ ম্যানেজমেন্ট' : 'Smart Shop Management'}
                  />
                  <p className="text-xs text-slate-400">{lang === 'bn' ? 'লোডিং স্ক্রিনে দোকানের নামের নিচে দেখাবে' : 'Shows below shop name in loading screen'}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">{lang === 'bn' ? 'ঠিকানা' : 'Address'}</label>
              <input 
                name="shopAddress" 
                defaultValue={settings?.shopAddress || ''} 
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-slate-900 transition-all" 
                placeholder={lang === 'bn' ? '১২৩ ব্যবসা স্ট্রিট, শহর' : '123 Business Street, City'}
              />
            </div>

            {/* Loading Screen Text */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                {lang === 'bn' ? 'লোডিং টেক্সট' : 'Loading Screen Text'}
              </label>
              <input 
                name="loadingText" 
                defaultValue={settings?.loadingText || 'Loading...'} 
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-slate-900 transition-all" 
                placeholder={lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
              />
              <p className="text-xs text-slate-400">{lang === 'bn' ? 'লোডিং স্ক্রিনে নিচে দেখাবে' : 'Shows at the bottom of loading screen'}</p>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {lang === 'bn' ? 'যোগাযোগ' : 'Contact Information'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">{lang === 'bn' ? 'ফোন' : 'Phone'}</label>
                  <input 
                    name="shopPhone" 
                    defaultValue={settings?.shopPhone || ''} 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-slate-900 transition-all" 
                    placeholder="+880 1234 567890"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1"><Mail className="w-3 h-3" /> {lang === 'bn' ? 'ইমেইল' : 'Email'}</label>
                  <input 
                    name="shopEmail" 
                    type="email"
                    defaultValue={settings?.shopEmail || ''} 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 text-slate-900 transition-all" 
                    placeholder="info@shop.com"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={!canEditSettings}
              className={`flex items-center gap-2 px-8 py-4 font-bold rounded-2xl uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all ${
                canEditSettings 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/25 hover:shadow-xl' 
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              {canEditSettings 
                ? (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes')
                : (lang === 'bn' ? 'সম্পাদনার অনুমতি নেই' : 'No Edit Permission')
              }
            </button>
            {!canEditSettings && (
              <p className="text-amber-600 text-sm mt-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {lang === 'bn' ? 'আপনার সেটিংস সম্পাদনা করার অনুমতি নেই।' : "You don't have permission to edit settings."}
              </p>
            )}
          </form>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && canManageUsers && (
        <UserManagement
          users={users}
          currentUserRole={currentUserRole}
          currentUserPermissions={currentUserPermissions}
          onAddUser={onAddUser || (() => {})}
          onUpdateUser={onUpdateUser || (() => {})}
          onDeleteUser={onDeleteUser || (() => {})}
        />
      )}

      {/* Print Templates Tab */}
      {activeTab === 'print' && canManagePrintTemplates && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Printer className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black">{lang === 'bn' ? 'প্রিন্ট টেমপ্লেট সেটিংস' : 'Print Template Settings'}</h3>
                  <p className="text-orange-100 text-sm">{lang === 'bn' ? 'ইনভয়েস ও রিসিপ্টের জন্য টেমপ্লেট কাস্টমাইজ করুন' : 'Customize templates for invoices and receipts'}</p>
                </div>
              </div>
              <button
                onClick={handleCreateTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-all"
              >
                <Plus className="w-4 h-4" />
                {lang === 'bn' ? 'নতুন টেমপ্লেট' : 'New Template'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template List */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold text-slate-900">{lang === 'bn' ? 'টেমপ্লেট তালিকা' : 'Templates'} ({templates.length})</h4>
                <button
                  onClick={resetTemplates}
                  className="text-xs text-slate-500 hover:text-orange-600 transition-all"
                >
                  {lang === 'bn' ? 'রিসেট' : 'Reset'}
                </button>
              </div>
              <div className="p-3 max-h-[450px] overflow-y-auto space-y-2">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-100 hover:border-orange-200'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate">{template.name}</span>
                          {template.isDefault && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full shrink-0">
                              {lang === 'bn' ? 'ডিফল্ট' : 'Default'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">{template.paperSize}</span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-500">{template.elements?.length || 0} {lang === 'bn' ? 'এলিমেন্ট' : 'elements'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditTemplate(template); }}
                          className="p-1.5 hover:bg-orange-100 rounded-lg transition-all"
                          title={lang === 'bn' ? 'এডিট করুন' : 'Edit'}
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-400 hover:text-orange-600" />
                        </button>
                        {!template.isDefault && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setAsDefaultTemplate(template.id); }}
                            className="p-1.5 hover:bg-orange-100 rounded-lg transition-all"
                            title={lang === 'bn' ? 'ডিফল্ট করুন' : 'Set as Default'}
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-slate-400 hover:text-orange-600" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); duplicateTemplate(template); }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                          title={lang === 'bn' ? 'কপি করুন' : 'Duplicate'}
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        {template.id.startsWith('custom-') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id); }}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-all"
                            title={lang === 'bn' ? 'মুছুন' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-2">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold text-slate-900">{lang === 'bn' ? 'প্রিভিউ' : 'Live Preview'}</h4>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => setPreviewSize('thermal-58')}
                      className={`p-1.5 rounded-md transition-all ${previewSize === 'thermal-58' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
                      title="58mm"
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPreviewSize('thermal-80')}
                      className={`p-1.5 rounded-md transition-all ${previewSize === 'thermal-80' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
                      title="80mm"
                    >
                      <Tablet className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPreviewSize('a4')}
                      className={`p-1.5 rounded-md transition-all ${previewSize === 'a4' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
                      title="A4"
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => selectedTemplate && handleEditTemplate(selectedTemplate)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-200 transition-all"
                  >
                    <Edit className="w-3 h-3" />
                    {lang === 'bn' ? 'এডিট' : 'Edit'}
                  </button>
                </div>
              </div>
              <div className="p-4 bg-slate-100 flex justify-center overflow-auto">
                <div 
                  className="bg-white shadow-lg transition-all duration-300"
                  style={{ 
                    width: previewSize === 'thermal-58' ? '58mm' : previewSize === 'thermal-80' ? '80mm' : '210mm',
                    maxWidth: '100%',
                    fontFamily: 'Courier New, monospace',
                    fontSize: '10px',
                    padding: '10px',
                    minHeight: '200px'
                  }}
                >
                  {selectedTemplate ? (
                    <div className="space-y-1">
                      {selectedTemplate.elements.map((el, idx) => {
                        const previewStyle = {
                          ...el.style,
                          fontSize: el.style?.fontSize || '10px',
                          textAlign: el.style?.textAlign as React.CSSProperties['textAlign'],
                          fontWeight: el.style?.fontWeight as React.CSSProperties['fontWeight'],
                          color: el.style?.color,
                        };
                        
                        return (
                          <div key={idx}>
                            {el.type === 'text' && (
                              <div style={previewStyle}>
                                {el.content?.replace(/\{\{shop_name\}\}/g, settings?.shopName || 'My Shop')
                                  .replace(/\{\{shop_address\}\}/g, settings?.shopAddress || '123 Business St')
                                  .replace(/\{\{shop_phone\}\}/g, settings?.shopPhone || '+880 1234567890')
                                  .replace(/\{\{invoice_number\}\}/g, 'INV-001')
                                  .replace(/\{\{invoice_date\}\}/g, new Date().toLocaleDateString())
                                  .replace(/\{\{invoice_time\}\}/g, new Date().toLocaleTimeString())
                                  .replace(/\{\{customer_name\}\}/g, 'John Doe')
                                  .replace(/\{\{total\}\}/g, '৳1,250.00')
                                  .replace(/\{\{subtotal\}\}/g, '৳1,300.00')
                                  .replace(/\{\{discount\}\}/g, '৳50.00')
                                  .replace(/\{\{paid\}\}/g, '৳1,300.00')
                                  .replace(/\{\{due\}\}/g, '৳0.00')
                                  .replace(/\{\{payment_method\}\}/g, 'Cash')
                                  .replace(/\{\{footer_text\}\}/g, 'Thank you for shopping!')
                                  .replace(/\{\{served_by\}\}/g, 'System')
                                  .replace(/\{\{print_date\}\}/g, new Date().toLocaleDateString())
                                  .replace(/\{\{print_time\}\}/g, new Date().toLocaleTimeString())
                                  .replace(/\{\{items_count\}\}/g, '3')
                                  .replace(/\{\{total_quantity\}\}/g, '5')
                                  .replace(/\{\{tax\}\}/g, '৳0.00')
                                  .replace(/\{\{change\}\}/g, '৳50.00')
                                  .replace(/\{\{.*?\}\}/g, '---')}
                              </div>
                            )}
                            {el.type === 'line' && (
                              <div className="border-t border-dashed border-gray-300 my-1" />
                            )}
                            {el.type === 'spacer' && (
                              <div style={{ height: el.style?.height || '10px' }} />
                            )}
                            {el.type === 'table' && (
                              <div className="text-xs">
                                <div className="flex justify-between border-b border-dashed py-1 font-bold">
                                  <span className="flex-1">Item</span>
                                  <span className="w-8 text-center">Qty</span>
                                  <span className="w-12 text-right">Price</span>
                                  <span className="w-12 text-right">Total</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-dashed border-gray-100">
                                  <span className="flex-1">Sample Product</span>
                                  <span className="w-8 text-center">2</span>
                                  <span className="w-12 text-right">500</span>
                                  <span className="w-12 text-right">1000</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-dashed border-gray-100">
                                  <span className="flex-1">Another Item</span>
                                  <span className="w-8 text-center">1</span>
                                  <span className="w-12 text-right">250</span>
                                  <span className="w-12 text-right">250</span>
                                </div>
                              </div>
                            )}
                            {el.type === 'barcode' && (
                              <div className="text-center py-2">
                                <div className="font-mono text-xs tracking-tighter">|||| |||| |||| ||||</div>
                                <div className="text-xs">INV-001</div>
                              </div>
                            )}
                            {el.type === 'image' && (
                              <div className="text-center py-2">
                                <div className="w-12 h-12 bg-gray-100 rounded mx-auto flex items-center justify-center text-gray-400 text-xs">Logo</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <Printer className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>{lang === 'bn' ? 'টেমপ্লেট নির্বাচন করুন' : 'Select a template'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-100">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <h5 className="font-bold text-orange-900 text-sm">{lang === 'bn' ? 'টেমপ্লেট সম্পর্কে তথ্য' : 'About Templates'}</h5>
                <p className="text-orange-700 text-xs mt-1">
                  {lang === 'bn' 
                    ? 'এই টেমপ্লেটগুলো সকল প্রিন্ট (ইনভয়েস, রিসিপ্ট, পারচেজ) এ ব্যবহার হবে। ডিফল্ট টেমপ্লেট সব জায়গায় প্রযোজ্য হবে। প্রতিটি টেমপ্লেটে শপ নাম, ঠিকানা, ফোন, প্রিন্ট তারিখ ও সময় অটোমেটিক যোগ হবে।'
                    : 'These templates will be used for all prints (invoices, receipts, purchases). The default template applies everywhere. Shop name, address, phone, print date & time are automatically included.'}
                </p>
              </div>
            </div>
          </div>

          {/* Auto Print Settings */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                {lang === 'bn' ? 'অটো প্রিন্ট সেটিংস' : 'Auto Print Settings'}
              </h4>
              <p className="text-slate-500 text-sm mt-1">
                {lang === 'bn' ? 'সেল বা পারচেজ সম্পন্ন হলে অটোমেটিক প্রিন্ট করুন' : 'Automatically print when sale or purchase is completed'}
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {/* Auto Print on Sale */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-bold text-slate-900">{lang === 'bn' ? 'সেলে অটো প্রিন্ট' : 'Auto Print on Sale'}</p>
                  <p className="text-slate-500 text-sm">{lang === 'bn' ? 'নতুন সেল হলে অটোমেটিক প্রিন্ট হবে' : 'Automatically print when a new sale is made'}</p>
                </div>
                <button
                  onClick={() => onUpdateSettings({ autoPrintOnSale: !settings?.autoPrintOnSale })}
                  className={`w-14 h-8 rounded-full transition-all ${settings?.autoPrintOnSale ? 'bg-purple-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${settings?.autoPrintOnSale ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Auto Print on Purchase */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-bold text-slate-900">{lang === 'bn' ? 'পারচেজে অটো প্রিন্ট' : 'Auto Print on Purchase'}</p>
                  <p className="text-slate-500 text-sm">{lang === 'bn' ? 'নতুন পারচেজ হলে অটোমেটিক প্রিন্ট হবে' : 'Automatically print when a new purchase is made'}</p>
                </div>
                <button
                  onClick={() => onUpdateSettings({ autoPrintOnPurchase: !settings?.autoPrintOnPurchase })}
                  className={`w-14 h-8 rounded-full transition-all ${settings?.autoPrintOnPurchase ? 'bg-purple-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${settings?.autoPrintOnPurchase ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Print Type Selection */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-900 mb-3">{lang === 'bn' ? 'প্রিন্ট টাইপ' : 'Print Type'}</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onUpdateSettings({ autoPrintType: 'thermal' })}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      settings?.autoPrintType === 'thermal' 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-slate-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <Tablet className="w-5 h-5" />
                    <span className="text-xs font-bold">{lang === 'bn' ? 'থার্মাল' : 'Thermal'}</span>
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ autoPrintType: 'full' })}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      settings?.autoPrintType === 'full' 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-slate-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <Monitor className="w-5 h-5" />
                    <span className="text-xs font-bold">{lang === 'bn' ? 'ফুল ইনভয়েস' : 'Full Invoice'}</span>
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ autoPrintType: 'both' })}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      settings?.autoPrintType === 'both' 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-slate-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <Copy className="w-5 h-5" />
                    <span className="text-xs font-bold">{lang === 'bn' ? 'উভয়' : 'Both'}</span>
                  </button>
                </div>
              </div>

              {/* Paper Size Selection */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-900 mb-3">{lang === 'bn' ? 'থার্মাল পেপার সাইজ' : 'Thermal Paper Size'}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateSettings({ autoPrintPaperSize: 'thermal-58' })}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                      settings?.autoPrintPaperSize === 'thermal-58' 
                        ? 'border-purple-500 bg-purple-50 text-purple-700' 
                        : 'border-slate-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="text-sm font-bold">58mm</span>
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ autoPrintPaperSize: 'thermal-80' })}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                      settings?.autoPrintPaperSize === 'thermal-80'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-slate-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <Tablet className="w-5 h-5" />
                    <span className="text-sm font-bold">80mm</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POS Settings Tab - Master Admin Only */}
      {activeTab === 'pos' && currentUserRole === 'Master Admin' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-xl" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {lang === 'bn' ? 'পিওএস সেটিংস' : 'POS Settings'}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {lang === 'bn' ? 'পয়েন্ট অফ সেল সেটিংস কনফিগার করুন' : 'Configure Point of Sale settings'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Settings */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {lang === 'bn' ? 'কাস্টমার সেটিংস' : 'Customer Settings'}
              </h4>
              <p className="text-slate-500 text-sm mt-1">
                {lang === 'bn' ? 'সেলে কাস্টমার নির্বাচন সংক্রান্ত সেটিংস' : 'Settings related to customer selection during sales'}
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              {/* Allow Walk-in Customer */}
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-lg">{lang === 'bn' ? 'ওয়াক-ইন কাস্টমার অনুমোদন' : 'Allow Walk-in Customer'}</p>
                  <p className="text-slate-500 text-sm mt-1">
                    {lang === 'bn'
                      ? 'বন্ধ করলে প্রতিটি সেলে কাস্টমার নির্বাচন বাধ্যতামূলক হবে'
                      : 'If disabled, customer selection will be mandatory for every sale'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const currentValue = settings?.allowWalkInCustomer !== false;
                    const newValue = !currentValue;
                    console.log('Toggle clicked - Current:', currentValue, 'New:', newValue);
                    onUpdateSettings({ allowWalkInCustomer: newValue });
                  }}
                  className={`w-16 h-9 rounded-full transition-all relative cursor-pointer ${
                    settings?.allowWalkInCustomer !== false ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-7 h-7 bg-white rounded-full shadow-lg transition-all duration-300 absolute top-1 ${
                    settings?.allowWalkInCustomer !== false ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Status Display */}
              <div className={`p-4 rounded-xl border-2 ${
                settings?.allowWalkInCustomer !== false
                  ? 'bg-green-50 border-green-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center gap-3">
                  {settings?.allowWalkInCustomer !== false ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-bold text-green-800">
                          {lang === 'bn' ? 'ওয়াক-ইন কাস্টমার অনুমোদিত' : 'Walk-in Customer Allowed'}
                        </p>
                        <p className="text-green-600 text-sm">
                          {lang === 'bn'
                            ? 'কাস্টমার ছাড়াও সেল করা যাবে'
                            : 'Sales can be made without selecting a customer'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-6 h-6 text-amber-600" />
                      <div>
                        <p className="font-bold text-amber-800">
                          {lang === 'bn' ? 'কাস্টমার নির্বাচন বাধ্যতামূলক' : 'Customer Selection Mandatory'}
                        </p>
                        <p className="text-amber-600 text-sm">
                          {lang === 'bn'
                            ? 'প্রতিটি সেলে কাস্টমার নির্বাচন করতে হবে'
                            : 'Every sale requires a customer to be selected'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Info Box */}
              <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-800">{lang === 'bn' ? 'কিভাবে কাজ করে' : 'How It Works'}</p>
                    <ul className="text-blue-700 text-sm mt-2 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                        {lang === 'bn'
                          ? 'Walk-in Customer OFF করলে Standard POS এবং Scanner POS উভয় জায়গায় কাস্টমার নির্বাচন বাধ্যতামূলক হবে'
                          : 'When Walk-in Customer is OFF, customer selection becomes mandatory in both Standard POS and Scanner POS'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                        {lang === 'bn'
                          ? 'কাস্টমার নির্বাচন ছাড়া Checkout button disabled থাকবে'
                          : 'Checkout button will be disabled without customer selection'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                        {lang === 'bn'
                          ? 'কাস্টমার Name অথবা Phone Number দিয়ে সার্চ করা যাবে'
                          : 'Customers can be searched by Name or Phone Number'}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backup & Restore Tab - Master Admin Only */}
      {activeTab === 'backup' && currentUserRole === 'Master Admin' && (
        <BackupSettings lang={lang} />
      )}

      {/* Configuration Tab - Master Admin Only */}
      {activeTab === 'config' && currentUserRole === 'Master Admin' && (
        <ConfigSettings lang={lang} onConfigChange={refreshAppConfig} />
      )}

      {/* Template Editor Modal */}
      {showTemplateEditor && editingTemplate && (
        <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-6xl shadow-2xl rounded-3xl overflow-hidden my-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 sm:p-6 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {lang === 'bn' ? 'টেমপ্লেট এডিটর' : 'Template Editor'}
                </h3>
                <p className="text-orange-100 text-sm mt-1">
                  {editingTemplate.name}
                </p>
              </div>
              <button 
                onClick={() => setShowTemplateEditor(false)}
                className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Template Settings & Elements */}
                <div className="space-y-4">
                  {/* Template Info */}
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm">{lang === 'bn' ? 'টেমপ্লেট সেটিংস' : 'Template Settings'}</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-slate-600">{lang === 'bn' ? 'নাম' : 'Name'}</label>
                        <input
                          value={editingTemplate.name}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">{lang === 'bn' ? 'পেপার সাইজ' : 'Paper Size'}</label>
                        <select
                          value={editingTemplate.paperSize}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, paperSize: e.target.value as any, width: e.target.value === 'thermal-58' ? 58 : e.target.value === 'thermal-80' ? 80 : e.target.value === 'a5' ? 148 : 210 })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                        >
                          <option value="thermal-58">Thermal 58mm</option>
                          <option value="thermal-80">Thermal 80mm</option>
                          <option value="a4">A4</option>
                          <option value="a5">A5</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Add Elements */}
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <h4 className="font-bold text-slate-900 text-sm mb-3">{lang === 'bn' ? 'এলিমেন্ট যোগ করুন' : 'Add Element'}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { type: 'text' as const, label: lang === 'bn' ? 'টেক্সট' : 'Text', icon: '📝' },
                        { type: 'line' as const, label: lang === 'bn' ? 'লাইন' : 'Line', icon: '➖' },
                        { type: 'spacer' as const, label: lang === 'bn' ? 'স্পেস' : 'Spacer', icon: '⬜' },
                        { type: 'table' as const, label: lang === 'bn' ? 'টেবিল' : 'Table', icon: '📊' },
                        { type: 'barcode' as const, label: lang === 'bn' ? 'বারকোড' : 'Barcode', icon: '📶' },
                        { type: 'image' as const, label: lang === 'bn' ? 'লোগো' : 'Logo', icon: '🖼️' },
                      ].map(item => (
                        <button
                          key={item.type}
                          onClick={() => addElement(item.type)}
                          className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:border-orange-300 hover:bg-orange-50 transition-all"
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Elements List */}
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <h4 className="font-bold text-slate-900 text-sm mb-3">
                      {lang === 'bn' ? 'এলিমেন্ট তালিকা' : 'Elements'} ({editingTemplate.elements?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {editingTemplate.elements?.map((el, idx) => (
                        <div
                          key={el.id}
                          className={`p-2 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedElement?.id === el.id
                              ? 'border-orange-500 bg-white'
                              : 'border-transparent bg-white hover:border-orange-200'
                          }`}
                          onClick={() => setSelectedElement(el)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}</span>
                              <span className="text-xs font-medium capitalize">{el.type}</span>
                              {el.type === 'text' && (
                                <span className="text-xs text-slate-400 truncate max-w-[100px]">
                                  {el.content?.substring(0, 20)}...
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); moveElement(el.id, 'up'); }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400"
                                disabled={idx === 0}
                              >
                                ↑
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); moveElement(el.id, 'down'); }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400"
                                disabled={idx === editingTemplate.elements.length - 1}
                              >
                                ↓
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                                className="p-1 hover:bg-red-50 rounded text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Center: Element Editor */}
                <div className="space-y-4">
                  {selectedElement ? (
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {lang === 'bn' ? 'এলিমেন্ট এডিট করুন' : 'Edit Element'}: <span className="capitalize">{selectedElement.type}</span>
                      </h4>
                      
                      {/* Text Content */}
                      {selectedElement.type === 'text' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-slate-600">{lang === 'bn' ? 'কন্টেন্ট' : 'Content'}</label>
                            <button
                              onClick={() => setShowVariableSelector(!showVariableSelector)}
                              className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                            >
                              {lang === 'bn' ? 'ভেরিয়েবল যোগ করুন' : '+ Variable'}
                            </button>
                          </div>
                          <textarea
                            value={selectedElement.content || ''}
                            onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-mono"
                            rows={3}
                          />
                          
                          {/* Variable Selector Dropdown */}
                          {showVariableSelector && (
                            <div className="bg-white border border-slate-200 rounded-xl p-3 max-h-[250px] overflow-y-auto">
                              {Object.entries(TEMPLATE_VARIABLES).map(([category, variables]) => (
                                <div key={category} className="mb-3">
                                  <h5 className="text-xs font-bold text-slate-500 uppercase mb-1 capitalize">{category}</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {variables.map((v) => (
                                      <button
                                        key={v.key}
                                        onClick={() => insertVariable(v.key)}
                                        className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded hover:bg-orange-100 transition-all"
                                        title={v.label}
                                      >
                                        {v.key}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Style Options */}
                      {selectedElement.type === 'text' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-slate-600">{lang === 'bn' ? 'ফন্ট সাইজ' : 'Font Size'}</label>
                            <select
                              value={selectedElement.style?.fontSize || '12px'}
                              onChange={(e) => updateElement(selectedElement.id, { style: { ...selectedElement.style, fontSize: e.target.value } })}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                            >
                              <option value="8px">8px</option>
                              <option value="9px">9px</option>
                              <option value="10px">10px</option>
                              <option value="11px">11px</option>
                              <option value="12px">12px</option>
                              <option value="14px">14px</option>
                              <option value="16px">16px</option>
                              <option value="18px">18px</option>
                              <option value="20px">20px</option>
                              <option value="24px">24px</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600">{lang === 'bn' ? 'অ্যালাইন' : 'Align'}</label>
                            <select
                              value={selectedElement.style?.textAlign || 'left'}
                              onChange={(e) => updateElement(selectedElement.id, { style: { ...selectedElement.style, textAlign: e.target.value } })}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600">{lang === 'bn' ? 'ওয়েট' : 'Weight'}</label>
                            <select
                              value={selectedElement.style?.fontWeight || 'normal'}
                              onChange={(e) => updateElement(selectedElement.id, { style: { ...selectedElement.style, fontWeight: e.target.value } })}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                            >
                              <option value="normal">Normal</option>
                              <option value="bold">Bold</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600">{lang === 'bn' ? 'রঙ' : 'Color'}</label>
                            <input
                              type="text"
                              value={selectedElement.style?.color || '#000'}
                              onChange={(e) => updateElement(selectedElement.id, { style: { ...selectedElement.style, color: e.target.value } })}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                              placeholder="#000 or gray"
                            />
                          </div>
                        </div>
                      )}

                      {/* Spacer Height */}
                      {selectedElement.type === 'spacer' && (
                        <div>
                          <label className="text-xs font-medium text-slate-600">{lang === 'bn' ? 'উচ্চতা' : 'Height'}</label>
                          <select
                            value={selectedElement.style?.height || '10px'}
                            onChange={(e) => updateElement(selectedElement.id, { style: { ...selectedElement.style, height: e.target.value } })}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                          >
                            <option value="5px">5px</option>
                            <option value="10px">10px</option>
                            <option value="15px">15px</option>
                            <option value="20px">20px</option>
                            <option value="30px">30px</option>
                          </select>
                        </div>
                      )}

                      {/* Table Info */}
                      {selectedElement.type === 'table' && (
                        <div className="text-xs text-slate-500 bg-orange-50 p-3 rounded-lg">
                          <p className="font-medium mb-1">{lang === 'bn' ? 'আইটেম টেবিল' : 'Items Table'}</p>
                          <p>{lang === 'bn' ? 'এই এলিমেন্ট স্বয়ংক্রিয়ভাবে আইটেমের তালিকা প্রদর্শন করবে।' : 'This element will automatically display the items list.'}</p>
                        </div>
                      )}

                      {/* Barcode Info */}
                      {selectedElement.type === 'barcode' && (
                        <div className="text-xs text-slate-500 bg-orange-50 p-3 rounded-lg">
                          <p className="font-medium mb-1">{lang === 'bn' ? 'বারকোড' : 'Barcode'}</p>
                          <p>{lang === 'bn' ? 'ইনভয়েস নম্বর বারকোড হিসেবে প্রদর্শিত হবে।' : 'Invoice number will be displayed as barcode.'}</p>
                        </div>
                      )}

                      {/* Image Info */}
                      {selectedElement.type === 'image' && (
                        <div className="text-xs text-slate-500 bg-orange-50 p-3 rounded-lg">
                          <p className="font-medium mb-1">{lang === 'bn' ? 'শপ লোগো' : 'Shop Logo'}</p>
                          <p>{lang === 'bn' ? 'শপ সেটিংস থেকে লোগো স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।' : 'Logo from shop settings will be displayed automatically.'}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-8 text-center">
                      <div className="text-slate-300 text-4xl mb-3">📝</div>
                      <p className="text-slate-500 text-sm">{lang === 'bn' ? 'এডিট করতে এলিমেন্ট নির্বাচন করুন' : 'Select an element to edit'}</p>
                    </div>
                  )}

                  {/* Available Variables */}
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <h4 className="font-bold text-slate-900 text-sm mb-3">{lang === 'bn' ? 'উপলব্ধ ভেরিয়েবলসমূহ' : 'Available Variables'}</h4>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto text-xs">
                      <div>
                        <p className="font-medium text-slate-600 mb-1">{lang === 'bn' ? 'শপ তথ্য:' : 'Shop:'}</p>
                        <code className="text-orange-600">{'{{shop_name}}, {{shop_address}}, {{shop_phone}}, {{shop_email}}, {{shop_tagline}}'}</code>
                      </div>
                      <div>
                        <p className="font-medium text-slate-600 mb-1">{lang === 'bn' ? 'ইনভয়েস:' : 'Invoice:'}</p>
                        <code className="text-orange-600">{'{{invoice_number}}, {{invoice_date}}, {{invoice_time}}, {{print_date}}, {{print_time}}'}</code>
                      </div>
                      <div>
                        <p className="font-medium text-slate-600 mb-1">{lang === 'bn' ? 'কাস্টমার:' : 'Customer:'}</p>
                        <code className="text-orange-600">{'{{customer_name}}, {{customer_phone}}'}</code>
                      </div>
                      <div>
                        <p className="font-medium text-slate-600 mb-1">{lang === 'bn' ? 'টোটাল:' : 'Totals:'}</p>
                        <code className="text-orange-600">{'{{subtotal}}, {{discount}}, {{tax}}, {{total}}, {{paid}}, {{due}}, {{change}}'}</code>
                      </div>
                      <div>
                        <p className="font-medium text-slate-600 mb-1">{lang === 'bn' ? 'অন্যান্য:' : 'Other:'}</p>
                        <code className="text-orange-600">{'{{footer_text}}, {{served_by}}, {{payment_method}}, {{items_count}}, {{total_quantity}}'}</code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Live Preview */}
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <h4 className="font-bold text-slate-900 text-sm mb-3">{lang === 'bn' ? 'লাইভ প্রিভিউ' : 'Live Preview'}</h4>
                    <div className="flex justify-center bg-slate-200 rounded-xl p-4">
                      <div 
                        className="bg-white shadow-lg overflow-hidden"
                        style={{ 
                          width: editingTemplate.paperSize === 'thermal-58' ? '58mm' : 
                                 editingTemplate.paperSize === 'thermal-80' ? '80mm' : 
                                 editingTemplate.paperSize === 'a5' ? '148mm' : '210mm',
                          maxWidth: '100%',
                          fontFamily: 'Courier New, monospace',
                          fontSize: '9px',
                          padding: '8px',
                          minHeight: '300px',
                          maxHeight: '500px',
                          overflowY: 'auto'
                        }}
                      >
                        {editingTemplate.elements?.map((el, idx) => (
                          <div key={el.id}>
                            {el.type === 'text' && (
                              <div style={{
                                ...el.style,
                                fontSize: el.style?.fontSize || '10px',
                                padding: '1px 0'
                              }}>
                                {el.content?.replace(/\{\{shop_name\}\}/g, settings?.shopName || 'My Shop')
                                  .replace(/\{\{shop_address\}\}/g, settings?.shopAddress || '123 Business St')
                                  .replace(/\{\{shop_phone\}\}/g, settings?.shopPhone || '+880 1234567890')
                                  .replace(/\{\{invoice_number\}\}/g, 'INV-001')
                                  .replace(/\{\{invoice_date\}\}/g, new Date().toLocaleDateString())
                                  .replace(/\{\{invoice_time\}\}/g, new Date().toLocaleTimeString())
                                  .replace(/\{\{customer_name\}\}/g, 'John Doe')
                                  .replace(/\{\{total\}\}/g, '৳1,250.00')
                                  .replace(/\{\{subtotal\}\}/g, '৳1,300.00')
                                  .replace(/\{\{discount\}\}/g, '৳50.00')
                                  .replace(/\{\{paid\}\}/g, '৳1,300.00')
                                  .replace(/\{\{due\}\}/g, '৳0.00')
                                  .replace(/\{\{footer_text\}\}/g, 'Thank you for shopping!')
                                  .replace(/\{\{served_by\}\}/g, 'System')
                                  .replace(/\{\{print_date\}\}/g, new Date().toLocaleDateString())
                                  .replace(/\{\{print_time\}\}/g, new Date().toLocaleTimeString())
                                  .replace(/\{\{.*?\}\}/g, '---')}
                              </div>
                            )}
                            {el.type === 'line' && <div className="border-t border-dashed border-gray-300 my-1" />}
                            {el.type === 'spacer' && <div style={{ height: el.style?.height || '10px' }} />}
                            {el.type === 'table' && (
                              <div className="text-xs">
                                <div className="flex justify-between border-b border-dashed py-0.5 font-bold text-[8px]">
                                  <span>Item</span><span>Qty</span><span>Total</span>
                                </div>
                                <div className="flex justify-between py-0.5 text-[8px]">
                                  <span>Sample</span><span>2</span><span>1000</span>
                                </div>
                              </div>
                            )}
                            {el.type === 'barcode' && (
                              <div className="text-center py-1">
                                <div className="text-[8px] tracking-tighter">|||| ||||</div>
                                <div className="text-[8px]">INV-001</div>
                              </div>
                            )}
                            {el.type === 'image' && (
                              <div className="text-center py-1">
                                <div className="w-8 h-8 bg-gray-100 rounded mx-auto text-[6px] flex items-center justify-center text-gray-400">Logo</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setShowTemplateEditor(false)}
                className="px-6 py-2.5 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Save className="w-4 h-4 inline mr-2" />
                {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl shadow-2xl rounded-3xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {editingUser ? (lang === 'bn' ? 'ইউজার সম্পাদনা' : 'Edit User') : (lang === 'bn' ? 'নতুন ইউজার' : 'Add New User')}
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  {editingUser ? (lang === 'bn' ? 'ইউজার তথ্য ও পারমিশন আপডেট করুন' : 'Update user information and permissions') : (lang === 'bn' ? 'নতুন স্টাফ অ্যাকাউন্ট তৈরি করুন' : 'Create a new staff account')}
                </p>
              </div>
              <button 
                onClick={() => setShowUserModal(false)}
                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <UserCheck className="w-3 h-3" />
                      {lang === 'bn' ? 'পুরো নাম *' : 'Full Name *'}
                    </label>
                    <input 
                      value={userForm.name}
                      onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-emerald-500 font-medium"
                      placeholder={lang === 'bn' ? 'নাম লিখুন' : 'John Doe'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <AtSign className="w-3 h-3" />
                      {lang === 'bn' ? 'ইউজারনেম *' : 'Username *'}
                    </label>
                    <input 
                      value={userForm.username}
                      onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-emerald-500 font-medium"
                      placeholder="johndoe"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {lang === 'bn' ? 'ইমেইল' : 'Email'}
                    </label>
                    <input 
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-emerald-500 font-medium"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {lang === 'bn' ? 'ফোন' : 'Phone'}
                    </label>
                    <input 
                      value={userForm.phone}
                      onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-emerald-500 font-medium"
                      placeholder="+880 1234 567890"
                    />
                  </div>
                </div>

                {!editingUser && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                      <Key className="w-3 h-3" />
                      {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={userForm.password}
                        onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-emerald-500 font-medium pr-12"
                        placeholder={lang === 'bn' ? 'পাসওয়ার্ড লিখুন' : 'Enter password'}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Role Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    {lang === 'bn' ? 'ভূমিকা' : 'Role'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Admin', 'Manager', 'Salesman', 'Viewer'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleChange(role)}
                        className={`p-3 rounded-xl font-bold text-sm border-2 transition-all ${
                          userForm.role === role 
                            ? `${getRoleColor(role)} border-current` 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Permissions */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    {lang === 'bn' ? 'পারমিশন' : 'Permissions'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(userForm.permissions).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handlePermissionChange(key as keyof typeof defaultPermissions)}
                        className={`p-3 rounded-xl font-medium text-sm border-2 transition-all flex items-center gap-2 ${
                          value 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {value ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setShowUserModal(false)}
                className="flex-1 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button 
                onClick={handleSaveUser}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingUser ? (lang === 'bn' ? 'আপডেট করুন' : 'Update User') : (lang === 'bn' ? 'তৈরি করুন' : 'Create User')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md shadow-2xl rounded-3xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserX className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{lang === 'bn' ? 'ইউজার মুছবেন?' : 'Delete User?'}</h3>
              <p className="text-slate-500">
                {lang === 'bn' ? 'আপনি কি নিশ্চিত' : 'Are you sure you want to delete'} <span className="font-bold text-slate-700">{userToDelete.name}</span>? {lang === 'bn' ? 'এটি পূর্বাবস্থায় ফেরানো যাবে না।' : 'This action cannot be undone.'}
              </p>
            </div>
            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button 
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button 
                onClick={handleDeleteUser}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all"
              >
                {lang === 'bn' ? 'মুছে ফেলুন' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Backup Settings Component with Google Drive Integration
interface BackupRecord {
  id: string;
  file_name: string;
  file_size: number;
  backup_type: string;
  tables_included: string[];
  status: string;
  created_at: string;
  cloud_file_id?: string;
  cloud_provider?: string;
}

interface CloudBackupFile {
  id: string;
  name: string;
  size?: number;
  createdTime: string;
  webViewLink?: string;
  isCloudBackup?: boolean;
  source?: string;
}

const BackupSettings: React.FC<{ lang: string }> = ({ lang }) => {
  // Local backup state
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  
  // Selected backups for bulk restore
  const [selectedCloudBackups, setSelectedCloudBackups] = useState<Set<string>>(new Set());
  const [isBulkRestoring, setIsBulkRestoring] = useState(false);
  
  // Google Drive state
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [cloudBackups, setCloudBackups] = useState<CloudBackupFile[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
  const [isRestoringFromCloud, setIsRestoringFromCloud] = useState(false);
  
  // File restore state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<{
    metadata: { version: string; createdAt: string; tables: string[]; totalRecords: number; app: string };
    data: Record<string, unknown[]>;
  } | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreResults, setRestoreResults] = useState<Record<string, { success: boolean; count: number; error?: string }> | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  
  // Cloud restore preview
  const [cloudRestorePreview, setCloudRestorePreview] = useState<{
    fileId: string;
    fileName: string;
    metadata: { version: string; createdAt: string; tables: string[]; totalRecords: number; app: string };
    data: Record<string, unknown[]>;
  } | null>(null);
  const [showCloudRestoreModal, setShowCloudRestoreModal] = useState(false);

  // API Token Management State
  const [apiTokens, setApiTokens] = useState<Array<{
    id: string;
    name: string;
    token: string;
    backup_type: string;
    validity_days: number | null;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
    last_used_at: string | null;
  }>>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [newToken, setNewToken] = useState({
    name: '',
    backupType: 'all',
    validityDays: 0, // 0 = lifetime
  });
  const [generatedToken, setGeneratedToken] = useState<{
    token: string;
    name: string;
    backupType: string;
    apiUrl: string;
  } | null>(null);

  // Get current user
  const getCurrentUser = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('dokan_user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  };

  // Fetch all data on mount
  useEffect(() => {
    fetchBackups();
    fetchStatus();
    checkGoogleConnection();
    fetchApiTokens();
    
    // Check for Google auth callback
    const urlParams = new URLSearchParams(window.location.search);
    const googleAuth = urlParams.get('google_auth');
    if (googleAuth === 'success') {
      // Clear the URL param and refresh connection status
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => checkGoogleConnection(), 1000);
    } else if (googleAuth === 'error') {
      const message = urlParams.get('message') || 'Unknown error';
      alert(lang === 'bn' ? `Google সংযোগ ব্যর্থ: ${message}` : `Google connection failed: ${message}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Get base URL for API
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  // Fetch API Tokens
  const fetchApiTokens = async () => {
    setIsLoadingTokens(true);
    try {
      const res = await fetch('/api/backup-tokens');
      const data = await res.json();
      setApiTokens(data.tokens || []);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  // Create new API Token
  const createApiToken = async () => {
    if (!newToken.name) {
      alert(lang === 'bn' ? 'টোকেনের নাম দিন' : 'Please enter a token name');
      return;
    }

    try {
      const user = getCurrentUser();
      const res = await fetch('/api/backup-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newToken.name,
          backupType: newToken.backupType,
          validityDays: newToken.validityDays || null,
          createdBy: user?.name || 'Master Admin',
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        // Generate full API URL
        const baseUrl = getBaseUrl();
        const backupType = newToken.backupType === 'all' ? 'daily' : newToken.backupType;
        const apiUrl = `${baseUrl}/api/backup/trigger?type=${backupType}&token=${data.token.token}`;
        
        setGeneratedToken({
          token: data.token.token,
          name: data.token.name,
          backupType: newToken.backupType,
          apiUrl: apiUrl,
        });
        
        setNewToken({ name: '', backupType: 'all', validityDays: 0 });
        fetchApiTokens();
      } else {
        alert(data.error || (lang === 'bn' ? 'টোকেন তৈরি ব্যর্থ' : 'Failed to create token'));
      }
    } catch (error) {
      console.error('Create token error:', error);
      alert(lang === 'bn' ? 'টোকেন তৈরি ব্যর্থ' : 'Failed to create token');
    }
  };

  // Delete API Token
  const deleteApiToken = async (tokenId: string) => {
    if (!confirm(lang === 'bn' ? 'এই টোকেন মুছে ফেলতে চান?' : 'Delete this token?')) return;
    
    try {
      await fetch(`/api/backup-tokens?id=${tokenId}`, { method: 'DELETE' });
      fetchApiTokens();
    } catch (error) {
      console.error('Delete token error:', error);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!');
  };

  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/backup?action=list');
      const data = await res.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error('Failed to fetch backups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/backup?action=status');
      const data = await res.json();
      setLastBackup(data.lastBackup);
    } catch (error) {
      console.error('Failed to fetch backup status:', error);
    }
  };

  // Google Drive functions
  const checkGoogleConnection = async () => {
    try {
      const user = getCurrentUser();
      const res = await fetch(`/api/google-drive?action=status&userId=${user?.id || 'default'}`);
      const data = await res.json();
      setIsGoogleConnected(data.connected || false);
      
      if (data.connected) {
        fetchCloudBackups();
      }
    } catch (error) {
      console.error('Failed to check Google connection:', error);
      setIsGoogleConnected(false);
    }
  };

  const connectGoogle = async () => {
    try {
      const user = getCurrentUser();
      const res = await fetch(`/api/google-drive?action=auth-url&userId=${user?.id || 'default'}`);
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to get Google auth URL:', error);
      alert(lang === 'bn' ? 'Google সংযোগ URL পেতে ব্যর্থ' : 'Failed to get Google auth URL');
    }
  };

  const disconnectGoogle = async () => {
    if (!confirm(lang === 'bn' ? 'আপনি কি Google Drive সংযোগ বিচ্ছিন্ন করতে চান?' : 'Disconnect Google Drive?')) return;
    
    try {
      const user = getCurrentUser();
      await fetch(`/api/google-drive?action=disconnect&userId=${user?.id || 'default'}`);
      setIsGoogleConnected(false);
      setCloudBackups([]);
    } catch (error) {
      console.error('Failed to disconnect Google:', error);
    }
  };

  const fetchCloudBackups = async () => {
    setIsLoadingCloud(true);
    try {
      const user = getCurrentUser();
      const res = await fetch(`/api/google-drive?action=list&userId=${user?.id || 'default'}`);
      const data = await res.json();
      setCloudBackups(data.files || []);
    } catch (error) {
      console.error('Failed to fetch cloud backups:', error);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const createLocalBackup = async () => {
    setIsCreating(true);
    try {
      const user = getCurrentUser();

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId: user?.id,
          userName: user?.name,
          backupType: 'manual',
        }),
      });

      const data = await res.json();

      if (data.success) {
        const link = document.createElement('a');
        link.href = data.backup.downloadUrl;
        link.download = data.backup.fileName;
        link.click();

        fetchBackups();
        setLastBackup(data.backup.createdAt);

        alert(lang === 'bn' 
          ? `ব্যাকআপ সফলভাবে তৈরি হয়েছে!\nফাইল: ${data.backup.fileName}\nআকার: ${data.backup.fileSizeFormatted}\nমোট রেকর্ড: ${data.backup.totalRecords}`
          : `Backup created successfully!\nFile: ${data.backup.fileName}\nSize: ${data.backup.fileSizeFormatted}\nTotal Records: ${data.backup.totalRecords}`
        );
      } else {
        throw new Error(data.error || 'Backup failed');
      }
    } catch (error) {
      console.error('Backup error:', error);
      alert(lang === 'bn' ? 'ব্যাকআপ তৈরি ব্যর্থ হয়েছে' : 'Failed to create backup');
    } finally {
      setIsCreating(false);
    }
  };

  // Daily Backup - Smart backup from last backup to now
  const createDailyCloudBackup = async () => {
    if (!isGoogleConnected) {
      alert(lang === 'bn' ? 'প্রথমে Google Drive সংযুক্ত করুন' : 'Please connect Google Drive first');
      return;
    }

    setIsUploadingToCloud(true);
    try {
      const user = getCurrentUser();

      const res = await fetch('/api/google-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload',
          userId: user?.id || 'default',
          userName: user?.name,
          backupType: 'daily', // Smart daily backup
        }),
      });

      const data = await res.json();

      if (data.success) {
        fetchCloudBackups();
        fetchBackups();
        
        // Format backup period for display
        const periodStart = data.backup.backupPeriod?.start 
          ? new Date(data.backup.backupPeriod.start).toLocaleString()
          : 'N/A';
        const periodEnd = data.backup.backupPeriod?.end
          ? new Date(data.backup.backupPeriod.end).toLocaleString()
          : 'N/A';
        
        alert(lang === 'bn' 
          ? `✅ দৈনিক ব্যাকআপ সফল!\n\n📅 ব্যাকআপ পিরিয়ড:\n   ${periodStart} থেকে\n   ${periodEnd} পর্যন্ত\n\n📁 ফাইল: ${data.backup.fileName}\n📊 আকার: ${data.backup.fileSizeFormatted}\n📝 মোট রেকর্ড: ${data.backup.totalRecords}\n\n☁️ Google Drive এ সংরক্ষিত`
          : `✅ Daily Backup Successful!\n\n📅 Backup Period:\n   ${periodStart} to\n   ${periodEnd}\n\n📁 File: ${data.backup.fileName}\n📊 Size: ${data.backup.fileSizeFormatted}\n📝 Total Records: ${data.backup.totalRecords}\n\n☁️ Saved to Google Drive`
        );
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Daily backup error:', error);
      alert(lang === 'bn' ? 'দৈনিক ব্যাকআপ ব্যর্থ হয়েছে' : 'Failed to create daily backup');
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  // Monthly Full Backup - Smart backup from last backup to now
  const createMonthlyCloudBackup = async () => {
    if (!isGoogleConnected) {
      alert(lang === 'bn' ? 'প্রথমে Google Drive সংযুক্ত করুন' : 'Please connect Google Drive first');
      return;
    }

    setIsUploadingToCloud(true);
    try {
      const user = getCurrentUser();

      const res = await fetch('/api/google-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload',
          userId: user?.id || 'default',
          userName: user?.name,
          backupType: 'monthly', // Smart monthly backup
        }),
      });

      const data = await res.json();

      if (data.success) {
        fetchCloudBackups();
        fetchBackups();
        
        // Format backup period for display
        const periodStart = data.backup.backupPeriod?.start 
          ? new Date(data.backup.backupPeriod.start).toLocaleString()
          : 'শুরু থেকে';
        const periodEnd = data.backup.backupPeriod?.end
          ? new Date(data.backup.backupPeriod.end).toLocaleString()
          : 'N/A';
        
        alert(lang === 'bn' 
          ? `✅ মাসিক ফুল ব্যাকআপ সফল!\n\n📅 ব্যাকআপ পিরিয়ড:\n   ${periodStart} থেকে\n   ${periodEnd} পর্যন্ত\n\n📁 ফাইল: ${data.backup.fileName}\n📊 আকার: ${data.backup.fileSizeFormatted}\n📝 মোট রেকর্ড: ${data.backup.totalRecords}\n\n☁️ Google Drive এ সংরক্ষিত`
          : `✅ Monthly Full Backup Successful!\n\n📅 Backup Period:\n   ${periodStart} to\n   ${periodEnd}\n\n📁 File: ${data.backup.fileName}\n📊 Size: ${data.backup.fileSizeFormatted}\n📝 Total Records: ${data.backup.totalRecords}\n\n☁️ Saved to Google Drive`
        );
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Monthly backup error:', error);
      alert(lang === 'bn' ? 'মাসিক ব্যাকআপ ব্যর্থ হয়েছে' : 'Failed to create monthly backup');
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  // Full System Backup - Complete backup of ALL data
  const createFullSystemBackup = async () => {
    if (!isGoogleConnected) {
      alert(lang === 'bn' ? 'প্রথমে Google Drive সংযুক্ত করুন' : 'Please connect Google Drive first');
      return;
    }

    setIsUploadingToCloud(true);
    try {
      const user = getCurrentUser();

      const res = await fetch('/api/google-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload',
          userId: user?.id || 'default',
          userName: user?.name,
          backupType: 'full', // COMPLETE system backup - ALL data
        }),
      });

      const data = await res.json();

      if (data.success) {
        fetchCloudBackups();
        fetchBackups();
        
        alert(lang === 'bn' 
          ? `✅ সম্পূর্ণ সিস্টেম ব্যাকআপ সফল!\n\n📦 সম্পূর্ণ সফটওয়্যারের সব ডাটা সেভ হয়েছে\n📁 ফাইল: ${data.backup.fileName}\n📊 আকার: ${data.backup.fileSizeFormatted}\n📝 মোট রেকর্ড: ${data.backup.totalRecords}\n📅 টেবিল: ${data.backup.tables?.length || 0}টি\n\n☁️ Google Drive এ সংরক্ষিত`
          : `✅ Full System Backup Successful!\n\n📦 Complete software data saved\n📁 File: ${data.backup.fileName}\n📊 Size: ${data.backup.fileSizeFormatted}\n📝 Total Records: ${data.backup.totalRecords}\n📅 Tables: ${data.backup.tables?.length || 0}\n\n☁️ Saved to Google Drive`
        );
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Full system backup error:', error);
      alert(lang === 'bn' ? 'সম্পূর্ণ ব্যাকআপ ব্যর্থ হয়েছে' : 'Failed to create full system backup');
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  // Generic cloud backup (for backward compatibility)
  const createCloudBackup = createMonthlyCloudBackup;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      previewRestoreFile(file);
    }
  };

  const previewRestoreFile = async (file: File) => {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      if (!backupData.metadata || !backupData.data) {
        throw new Error('Invalid backup file format');
      }

      setRestorePreview(backupData);
      setShowRestoreModal(true);
    } catch (error) {
      console.error('Invalid backup file:', error);
      alert(lang === 'bn' ? 'অবৈধ ব্যাকআপ ফাইল। অনুগ্রহ করে একটি বৈধ JSON ব্যাকআপ ফাইল নির্বাচন করুন।' : 'Invalid backup file. Please select a valid JSON backup file.');
      setSelectedFile(null);
    }
  };

  const performRestore = async () => {
    if (!restorePreview) return;

    setIsRestoring(true);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore',
          backupData: restorePreview,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setRestoreResults(data.results);
        setShowRestoreModal(false);
        setShowResultsModal(true);
        fetchBackups();
      } else {
        throw new Error(data.error || 'Restore failed');
      }
    } catch (error) {
      console.error('Restore error:', error);
      alert(lang === 'bn' ? 'রিস্টোর ব্যর্থ হয়েছে' : 'Failed to restore backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const previewCloudRestore = async (fileId: string, fileName: string) => {
    setIsRestoringFromCloud(true);
    try {
      const user = getCurrentUser();
      const res = await fetch(`/api/google-drive?action=download&fileId=${fileId}&userId=${user?.id || 'default'}`);
      const data = await res.json();

      if (data.content) {
        const backupData = JSON.parse(data.content);
        
        if (!backupData.metadata || !backupData.data) {
          throw new Error('Invalid backup format');
        }

        setCloudRestorePreview({
          fileId,
          fileName,
          metadata: backupData.metadata,
          data: backupData.data,
        });
        setShowCloudRestoreModal(true);
      } else {
        throw new Error(data.error || 'Download failed');
      }
    } catch (error) {
      console.error('Cloud restore preview error:', error);
      alert(lang === 'bn' ? 'ব্যাকআপ প্রিভিউ ব্যর্থ' : 'Failed to preview backup');
    } finally {
      setIsRestoringFromCloud(false);
    }
  };

  const performCloudRestore = async () => {
    if (!cloudRestorePreview) return;

    setIsRestoringFromCloud(true);
    try {
      const user = getCurrentUser();
      const res = await fetch('/api/google-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore',
          fileId: cloudRestorePreview.fileId,
          userId: user?.id || 'default',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setRestoreResults(data.results);
        setShowCloudRestoreModal(false);
        setShowResultsModal(true);
        fetchBackups();
      } else {
        throw new Error(data.error || 'Restore failed');
      }
    } catch (error) {
      console.error('Cloud restore error:', error);
      alert(lang === 'bn' ? 'রিস্টোর ব্যর্থ হয়েছে' : 'Failed to restore from Google Drive');
    } finally {
      setIsRestoringFromCloud(false);
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm(lang === 'bn' ? 'আপনি কি এই ব্যাকআপ রেকর্ড মুছতে চান?' : 'Delete this backup record?')) return;

    try {
      await fetch(`/api/backup?id=${backupId}`, { method: 'DELETE' });
      fetchBackups();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const deleteCloudBackup = async (fileId: string) => {
    if (!confirm(lang === 'bn' ? 'আপনি কি Google Drive থেকে এই ব্যাকআপ মুছতে চান?' : 'Delete this backup from Google Drive?')) return;

    try {
      const user = getCurrentUser();
      await fetch(`/api/google-drive?fileId=${fileId}&userId=${user?.id || 'default'}`, { method: 'DELETE' });
      fetchCloudBackups();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Cloud className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {lang === 'bn' ? 'ব্যাকআপ ও রিস্টোর' : 'Backup & Restore'}
              </h2>
              <p className="text-violet-100 text-sm mt-1">
                {lang === 'bn' ? 'আপনার ডেটা নিরাপদ রাখুন' : 'Keep your data safe'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Google Drive Connection */}
      <div className={`rounded-3xl shadow-sm border overflow-hidden ${isGoogleConnected ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isGoogleConnected ? 'bg-green-500' : 'bg-slate-400'}`}>
                {isGoogleConnected ? (
                  <Check className="w-6 h-6 text-white" />
                ) : (
                  <CloudOff className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  Google Drive
                  {isGoogleConnected && (
                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                      {lang === 'bn' ? 'সংযুক্ত' : 'Connected'}
                    </span>
                  )}
                </h3>
                <p className="text-slate-500 text-sm">
                  {isGoogleConnected 
                    ? (lang === 'bn' ? 'ক্লাউড ব্যাকআপ সক্রিয়' : 'Cloud backup enabled')
                    : (lang === 'bn' ? 'ক্লাউড ব্যাকআপের জন্য সংযুক্ত করুন' : 'Connect for cloud backup')
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isGoogleConnected ? (
                <>
                  <button
                    onClick={fetchCloudBackups}
                    disabled={isLoadingCloud}
                    className="p-2.5 hover:bg-white/50 rounded-xl transition-all"
                    title={lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh'}
                  >
                    <RefreshCw className={`w-5 h-5 text-slate-600 ${isLoadingCloud ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={disconnectGoogle}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-all"
                  >
                    <Unlink className="w-4 h-4" />
                    <span className="hidden sm:inline">{lang === 'bn' ? 'বিচ্ছিন্ন করুন' : 'Disconnect'}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={connectGoogle}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                >
                  <Link className="w-5 h-5" />
                  {lang === 'bn' ? 'Google Drive সংযুক্ত করুন' : 'Connect Google Drive'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Backup Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Backup - Save to Google Drive */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{lang === 'bn' ? '📅 দৈনিক ব্যাকআপ' : '📅 Daily Backup'}</h3>
                <p className="text-slate-500 text-sm">{lang === 'bn' ? 'শেষ ব্যাকআপ থেকে এখন পর্যন্ত' : 'From last backup to now'}</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {/* What gets backed up */}
            <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="font-bold text-amber-800 text-sm mb-2">{lang === 'bn' ? '📦 স্মার্ট ব্যাকআপ:' : '📦 Smart Backup:'}</p>
              <ul className="text-sm text-amber-700 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {lang === 'bn' ? 'শেষ ব্যাকআপের পর থেকে সব ডাটা' : "All data since last backup"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {lang === 'bn' ? 'সেলস, পারচেজ, এক্সপেন্স, স্টক' : "Sales, purchases, expenses, stock"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {lang === 'bn' ? 'প্রথম বার? গত ২৪ ঘন্টা' : "First time? Last 24 hours"}
                </li>
              </ul>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'bn' 
                ? '💡 যেকোনো সময় ব্যাকআপ নিন - শেষ ব্যাকআপের পর থেকে সব ডাটা সেভ হবে। কোনো গ্যাপ থাকবে না!'
                : '💡 Backup anytime - saves all data since last backup. No gaps!'}
            </p>
            {isGoogleConnected ? (
              <>
                <div className="flex items-center gap-2 mb-4 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-xl">
                  <CheckCircle className="w-4 h-4" />
                  <span>{lang === 'bn' ? '☁️ Google Drive সংযুক্ত' : '☁️ Google Drive Connected'}</span>
                </div>
                <button
                  onClick={createDailyCloudBackup}
                  disabled={isUploadingToCloud}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploadingToCloud ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {lang === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Cloud className="w-5 h-5" />
                      {lang === 'bn' ? '☁️ Google Drive এ সেভ করুন' : '☁️ Save to Google Drive'}
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'Google Drive সংযুক্ত নয়' : 'Google Drive not connected'}</span>
                </div>
                <button
                  onClick={connectGoogle}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Link className="w-5 h-5" />
                  {lang === 'bn' ? 'Google Drive সংযুক্ত করুন' : 'Connect Google Drive'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Monthly Full Backup - Save to Google Drive */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{lang === 'bn' ? '📦 মাসিক ফুল ব্যাকআপ' : '📦 Monthly Full Backup'}</h3>
                <p className="text-slate-500 text-sm">{lang === 'bn' ? 'শেষ ব্যাকআপ থেকে এখন পর্যন্ত (সব টেবিল)' : 'From last backup to now (all tables)'}</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {/* What gets backed up */}
            <div className="mb-4 p-4 bg-violet-50 rounded-xl border border-violet-200">
              <p className="font-bold text-violet-800 text-sm mb-2">{lang === 'bn' ? '📦 স্মার্ট ফুল ব্যাকআপ:' : '📦 Smart Full Backup:'}</p>
              <ul className="text-sm text-violet-700 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {lang === 'bn' ? 'শেষ ব্যাকআপের পর থেকে সব ডাটা' : "All data since last backup"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {lang === 'bn' ? 'সব টেবিল: প্রোডাক্ট, কাস্টমার...' : "All tables: products, customers..."}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {lang === 'bn' ? 'প্রথম বার? শুরু থেকে সব' : "First time? All data from start"}
                </li>
              </ul>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'bn' 
                ? '💡 মাসে একবার নিন - শেষ ব্যাকআপের পর থেকে সব ডাটা সেভ হবে। সম্পূর্ণ নিরাপদ!'
                : '💡 Take once a month - saves all data since last backup. Fully safe!'}
            </p>
            {isGoogleConnected ? (
              <>
                <div className="flex items-center gap-2 mb-4 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-xl">
                  <CheckCircle className="w-4 h-4" />
                  <span>{lang === 'bn' ? '☁️ Google Drive সংযুক্ত' : '☁️ Google Drive Connected'}</span>
                </div>
                <button
                  onClick={createMonthlyCloudBackup}
                  disabled={isUploadingToCloud}
                  className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploadingToCloud ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {lang === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Cloud className="w-5 h-5" />
                      {lang === 'bn' ? '☁️ Google Drive এ সেভ করুন' : '☁️ Save to Google Drive'}
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'Google Drive সংযুক্ত নয়' : 'Google Drive not connected'}</span>
                </div>
                <button
                  onClick={connectGoogle}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Link className="w-5 h-5" />
                  {lang === 'bn' ? 'Google Drive সংযুক্ত করুন' : 'Connect Google Drive'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create Local Backup Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <HardDrive className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{lang === 'bn' ? 'লোকাল ব্যাকআপ' : 'Local Backup'}</h3>
                <p className="text-slate-500 text-sm">{lang === 'bn' ? 'ফাইল ডাউনলোড করুন' : 'Download backup file'}</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-slate-600 text-sm mb-4">
              {lang === 'bn' 
                ? 'এক ক্লিকে ব্যাকআপ তৈরি করে ডাউনলোড করুন।'
                : 'Create and download backup with one click.'}
            </p>
            {lastBackup && (
              <p className="text-xs text-slate-500 mb-4">
                {lang === 'bn' ? 'সর্বশেষ ব্যাকআপ:' : 'Last backup:'} {formatDate(lastBackup)}
              </p>
            )}
            <button
              onClick={createLocalBackup}
              disabled={isCreating}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {lang === 'bn' ? 'ব্যাকআপ হচ্ছে...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  {lang === 'bn' ? 'ব্যাকআপ ডাউনলোড করুন' : 'Download Backup'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Google Drive Backup Card - FULL SYSTEM BACKUP */}
        <div className={`rounded-3xl shadow-sm border overflow-hidden ${isGoogleConnected ? 'bg-white border-slate-100' : 'bg-slate-100 border-slate-200'}`}>
          <div className={`p-6 border-b ${isGoogleConnected ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-slate-100' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${isGoogleConnected ? 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/30' : 'bg-slate-300'}`}>
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{lang === 'bn' ? '☁️ ক্লাউড ব্যাকআপ' : '☁️ Cloud Backup'}</h3>
                <p className="text-slate-500 text-sm">{lang === 'bn' ? 'সম্পূর্ণ সিস্টেম ব্যাকআপ' : 'Full System Backup'}</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {isGoogleConnected ? (
              <>
                {/* What gets backed up */}
                <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="font-bold text-blue-800 text-sm mb-2">{lang === 'bn' ? '📦 সম্পূর্ণ সিস্টেম ব্যাকআপ:' : '📦 Complete System Backup:'}</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {lang === 'bn' ? 'সব টেবিল, সব ডাটা' : "All tables, all data"}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {lang === 'bn' ? 'শুরু থেকে এখন পর্যন্ত' : "From beginning to now"}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {lang === 'bn' ? 'কোনো ফিল্টার ছাড়া' : "No filters applied"}
                    </li>
                  </ul>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  {lang === 'bn' 
                    ? '💡 এটা সম্পূর্ণ সফটওয়্যারের ব্যাকআপ - যেকোনো সময় রিস্টোর করতে পারবেন।'
                    : '💡 Complete software backup - restore anytime.'}
                </p>
                <div className="flex items-center gap-2 mb-4 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>{lang === 'bn' ? `${cloudBackups.length}টি ক্লাউড ব্যাকআপ` : `${cloudBackups.length} cloud backups`}</span>
                </div>
                <button
                  onClick={createFullSystemBackup}
                  disabled={isUploadingToCloud}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploadingToCloud ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {lang === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Cloud className="w-5 h-5" />
                      {lang === 'bn' ? '☁️ সম্পূর্ণ ব্যাকআপ করুন' : '☁️ Full System Backup'}
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <CloudOff className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">
                  {lang === 'bn' ? 'Google Drive সংযুক্ত করুন' : 'Connect Google Drive first'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Restore from File */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <FileJson className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">{lang === 'bn' ? 'ফাইল থেকে রিস্টোর' : 'Restore from File'}</h3>
              <p className="text-slate-500 text-sm">{lang === 'bn' ? 'JSON ব্যাকআপ আপলোড করুন' : 'Upload JSON backup file'}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <label className="block cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-full py-8 border-2 border-dashed border-orange-300 rounded-xl text-center hover:border-orange-500 hover:bg-orange-50 transition-all">
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-orange-600">
                  <FileJson className="w-6 h-6" />
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
              ) : (
                <div className="text-slate-500">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <span className="font-medium">{lang === 'bn' ? 'ফাইল নির্বাচন করুন' : 'Select File'}</span>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Cloud Backups List */}
      {isGoogleConnected && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{lang === 'bn' ? 'ক্লাউড ব্যাকআপ' : 'Cloud Backups'}</h3>
                  <p className="text-slate-500 text-sm">{lang === 'bn' ? 'Google Drive থেকে রিস্টোর' : 'Restore from Google Drive'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedCloudBackups.size > 0 && (
                  <button
                    onClick={async () => {
                      if (!confirm(lang === 'bn' 
                        ? `আপনি কি ${selectedCloudBackups.size}টি ব্যাকআপ রিস্টোর করতে চান?` 
                        : `Restore ${selectedCloudBackups.size} selected backups?`
                      )) return;
                      
                      setIsBulkRestoring(true);
                      try {
                        for (const fileId of selectedCloudBackups) {
                          const user = getCurrentUser();
                          const res = await fetch('/api/google-drive', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              action: 'restore',
                              fileId,
                              userId: user?.id || 'default',
                            }),
                          });
                          if (!res.ok) throw new Error('Restore failed');
                        }
                        alert(lang === 'bn' 
                          ? `✅ ${selectedCloudBackups.size}টি ব্যাকআপ সফলভাবে রিস্টোর হয়েছে!` 
                          : `✅ ${selectedCloudBackups.size} backups restored successfully!`
                        );
                        setSelectedCloudBackups(new Set());
                        fetchBackups();
                      } catch (error) {
                        alert(lang === 'bn' ? 'বাল্ক রিস্টোর ব্যর্থ হয়েছে' : 'Bulk restore failed');
                      } finally {
                        setIsBulkRestoring(false);
                      }
                    }}
                    disabled={isBulkRestoring}
                    className="px-4 py-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isBulkRestoring ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {lang === 'bn' ? `রিস্টোর (${selectedCloudBackups.size})` : `Restore (${selectedCloudBackups.size})`}
                  </button>
                )}
                <button
                  onClick={fetchCloudBackups}
                  disabled={isLoadingCloud}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <RefreshCw className={`w-5 h-5 text-slate-500 ${isLoadingCloud ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {isLoadingCloud ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                <p className="text-slate-500">{lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</p>
              </div>
            ) : cloudBackups.length === 0 ? (
              <div className="p-12 text-center">
                <Cloud className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">{lang === 'bn' ? 'কোনো ক্লাউড ব্যাকআপ নেই' : 'No cloud backups yet'}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cloudBackups.map((file, index) => (
                  <div key={file.id} className={`p-4 hover:bg-slate-50 transition-all ${selectedCloudBackups.has(file.id) ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedCloudBackups.has(file.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedCloudBackups);
                            if (e.target.checked) {
                              newSelected.add(file.id);
                            } else {
                              newSelected.delete(file.id);
                            }
                            setSelectedCloudBackups(newSelected);
                          }}
                          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        {/* Serial Number */}
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600">
                          {index + 1}
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <FileJson className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{file.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-500">{file.size ? formatBytes(file.size) : '-'}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{formatDate(file.createdTime)}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              Google Drive
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            title={lang === 'bn' ? 'Google Drive এ দেখুন' : 'View in Google Drive'}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => previewCloudRestore(file.id, file.name)}
                          disabled={isRestoringFromCloud}
                          className="px-3 py-2 bg-blue-100 text-blue-600 font-medium rounded-lg hover:bg-blue-200 transition-all text-sm flex items-center gap-1"
                        >
                          {isRestoringFromCloud ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          {lang === 'bn' ? 'রিস্টোর' : 'Restore'}
                        </button>
                        <button
                          onClick={() => deleteCloudBackup(file.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Local Backup History */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{lang === 'bn' ? 'ব্যাকআপ ইতিহাস' : 'Backup History'}</h3>
                <p className="text-slate-500 text-sm">{lang === 'bn' ? 'সাম্প্রতিক ব্যাকআপসমূহ' : 'Recent backups'}</p>
              </div>
            </div>
            <button
              onClick={fetchBackups}
              disabled={isLoading}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all"
            >
              <RefreshCw className={`w-5 h-5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
              <p className="text-slate-500">{lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="p-12 text-center">
              <HardDrive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">{lang === 'bn' ? 'কোনো ব্যাকআপ নেই' : 'No backups yet'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {backups.map((backup, index) => (
                <div key={backup.id} className="p-4 hover:bg-slate-50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Serial Number */}
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600">
                        {index + 1}
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        backup.status === 'completed' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {backup.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{backup.file_name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-500">{formatBytes(backup.file_size || 0)}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{formatDate(backup.created_at)}</span>
                          {backup.cloud_provider && (
                            <>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                {backup.cloud_provider}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteBackup(backup.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Restore Preview Modal (Local File) */}
      {showRestoreModal && restorePreview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6">
              <h3 className="text-xl font-black text-white">{lang === 'bn' ? 'ব্যাকআপ রিস্টোর করুন?' : 'Restore Backup?'}</h3>
              <p className="text-orange-100 text-sm mt-1">{lang === 'bn' ? 'নিচের তথ্য পুনরুদ্ধার হবে' : 'Following data will be restored'}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">{lang === 'bn' ? 'ভার্সন' : 'Version'}</p>
                    <p className="font-bold text-slate-900">{restorePreview.metadata.version}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">{lang === 'bn' ? 'তৈরির তারিখ' : 'Created At'}</p>
                    <p className="font-bold text-slate-900">{new Date(restorePreview.metadata.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">{lang === 'bn' ? 'মোট রেকর্ড' : 'Total Records'}</p>
                    <p className="font-bold text-slate-900">{restorePreview.metadata.totalRecords}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">{lang === 'bn' ? 'টেবিল সংখ্যা' : 'Tables'}</p>
                    <p className="font-bold text-slate-900">{restorePreview.metadata.tables.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800">{lang === 'bn' ? 'সতর্কীকরণ' : 'Warning'}</p>
                    <p className="text-amber-700 text-sm mt-1">
                      {lang === 'bn' 
                        ? 'রিস্টোর করলে বর্তমান ডেটা মুছে যাবে।'
                        : 'Restoring will replace current data.'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-2">{lang === 'bn' ? 'টেবিলসমূহ:' : 'Tables:'}</p>
                <div className="flex flex-wrap gap-2">
                  {restorePreview.metadata.tables.map((table) => (
                    <span key={table} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                      {table} ({(restorePreview.data[table] as unknown[])?.length || 0})
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button
                onClick={() => { setShowRestoreModal(false); setSelectedFile(null); setRestorePreview(null); }}
                className="flex-1 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={performRestore}
                disabled={isRestoring}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {lang === 'bn' ? 'রিস্টোর হচ্ছে...' : 'Restoring...'}
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {lang === 'bn' ? 'রিস্টোর করুন' : 'Restore Now'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Restore Preview Modal */}
      {showCloudRestoreModal && cloudRestorePreview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6">
              <h3 className="text-xl font-black text-white">{lang === 'bn' ? 'ক্লাউড থেকে রিস্টোর?' : 'Restore from Cloud?'}</h3>
              <p className="text-blue-100 text-sm mt-1">{cloudRestorePreview.fileName}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">{lang === 'bn' ? 'ভার্সন' : 'Version'}</p>
                    <p className="font-bold text-slate-900">{cloudRestorePreview.metadata.version}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">{lang === 'bn' ? 'তৈরির তারিখ' : 'Created At'}</p>
                    <p className="font-bold text-slate-900">{new Date(cloudRestorePreview.metadata.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">{lang === 'bn' ? 'মোট রেকর্ড' : 'Total Records'}</p>
                    <p className="font-bold text-slate-900">{cloudRestorePreview.metadata.totalRecords}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">{lang === 'bn' ? 'টেবিল সংখ্যা' : 'Tables'}</p>
                    <p className="font-bold text-slate-900">{cloudRestorePreview.metadata.tables.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800">{lang === 'bn' ? 'সতর্কীকরণ' : 'Warning'}</p>
                    <p className="text-amber-700 text-sm mt-1">
                      {lang === 'bn' 
                        ? 'রিস্টোর করলে বর্তমান ডেটা মুছে যাবে।'
                        : 'Restoring will replace current data.'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-2">{lang === 'bn' ? 'টেবিলসমূহ:' : 'Tables:'}</p>
                <div className="flex flex-wrap gap-2">
                  {cloudRestorePreview.metadata.tables.map((table) => (
                    <span key={table} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                      {table} ({(cloudRestorePreview.data[table] as unknown[])?.length || 0})
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button
                onClick={() => { setShowCloudRestoreModal(false); setCloudRestorePreview(null); }}
                className="flex-1 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={performCloudRestore}
                disabled={isRestoringFromCloud}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isRestoringFromCloud ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {lang === 'bn' ? 'রিস্টোর হচ্ছে...' : 'Restoring...'}
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {lang === 'bn' ? 'রিস্টোর করুন' : 'Restore Now'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Results Modal */}
      {showResultsModal && restoreResults && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6">
              <h3 className="text-xl font-black text-white">{lang === 'bn' ? 'রিস্টোর সম্পন্ন!' : 'Restore Complete!'}</h3>
              <p className="text-green-100 text-sm mt-1">{lang === 'bn' ? 'ডেটা সফলভাবে পুনরুদ্ধার হয়েছে' : 'Data has been successfully restored'}</p>
            </div>
            <div className="p-6 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {Object.entries(restoreResults).map(([table, result]) => (
                  <div key={table} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="font-medium text-slate-700">{table}</span>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600">{result.count} {lang === 'bn' ? 'রেকর্ড' : 'records'}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-600">{result.error || 'Failed'}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t">
              <button
                onClick={() => { setShowResultsModal(false); setRestoreResults(null); setSelectedFile(null); window.location.reload(); }}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl"
              >
                {lang === 'bn' ? 'ঠিক আছে, পেজ রিফ্রেশ করুন' : 'OK, Refresh Page'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Token Generator - Master Admin Only */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl shadow-sm border border-violet-100 overflow-hidden">
        <div className="p-6 border-b border-violet-100 bg-gradient-to-r from-violet-500 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">
                  {lang === 'bn' ? '🔑 API টোকেন জেনারেটর' : '🔑 API Token Generator'}
                </h3>
                <p className="text-violet-100 text-sm">
                  {lang === 'bn' ? 'ব্যাকআপ API এর জন্য টোকেন তৈরি করুন' : 'Create tokens for backup API access'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTokenModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-violet-600 font-bold rounded-xl hover:bg-violet-50 transition-all"
            >
              <Plus className="w-4 h-4" />
              {lang === 'bn' ? 'নতুন টোকেন' : 'New Token'}
            </button>
          </div>
        </div>
        
        {/* API URL Info */}
        <div className="p-4 bg-violet-100/50 border-b border-violet-100">
          <div className="flex items-center gap-2 text-sm text-violet-700">
            <Globe className="w-4 h-4" />
            <span className="font-medium">{lang === 'bn' ? 'আপনার API URL:' : 'Your API URL:'}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 text-xs bg-white px-3 py-2 rounded-lg border border-violet-200 text-violet-800 overflow-x-auto">
              {getBaseUrl()}/api/backup/trigger?type={'{daily/monthly/full}'}&token=YOUR_TOKEN
            </code>
            <button
              onClick={() => copyToClipboard(`${getBaseUrl()}/api/backup/trigger?type=daily&token=YOUR_TOKEN`)}
              className="p-2 bg-white rounded-lg border border-violet-200 hover:bg-violet-50 transition-all"
              title={lang === 'bn' ? 'কপি করুন' : 'Copy'}
            >
              <Copy className="w-4 h-4 text-violet-600" />
            </button>
          </div>
        </div>

        {/* Tokens List */}
        <div className="p-6">
          {isLoadingTokens ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto" />
            </div>
          ) : apiTokens.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">{lang === 'bn' ? 'কোনো টোকেন নেই' : 'No tokens yet'}</p>
              <p className="text-slate-400 text-sm mt-1">
                {lang === 'bn' ? 'উপরের বাটনে ক্লিক করে টোকেন তৈরি করুন' : 'Click the button above to create a token'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiTokens.map((token, index) => (
                <div key={token.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center text-sm font-bold text-violet-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{token.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{token.token}</code>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          token.backup_type === 'all' ? 'bg-purple-100 text-purple-700' :
                          token.backup_type === 'daily' ? 'bg-amber-100 text-amber-700' :
                          token.backup_type === 'monthly' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {token.backup_type === 'all' ? (lang === 'bn' ? 'সব' : 'All') :
                           token.backup_type === 'daily' ? (lang === 'bn' ? 'দৈনিক' : 'Daily') :
                           token.backup_type === 'monthly' ? (lang === 'bn' ? 'মাসিক' : 'Monthly') :
                           (lang === 'bn' ? 'সম্পূর্ণ' : 'Full')}
                        </span>
                        {token.validity_days ? (
                          <span className="text-xs text-slate-400">
                            {token.validity_days} {lang === 'bn' ? 'দিন' : 'days'}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            {lang === 'bn' ? 'লাইফটাইম' : 'Lifetime'}
                          </span>
                        )}
                        {!token.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            {lang === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const backupType = token.backup_type === 'all' ? 'daily' : token.backup_type;
                        copyToClipboard(`${getBaseUrl()}/api/backup/trigger?type=${backupType}&token=TOKEN_HIDDEN`);
                      }}
                      className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                      title={lang === 'bn' ? 'API URL কপি করুন' : 'Copy API URL'}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteApiToken(token.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6">
              <h3 className="text-xl font-black text-white">
                {lang === 'bn' ? '🔑 নতুন API টোকেন' : '🔑 New API Token'}
              </h3>
              <p className="text-violet-100 text-sm mt-1">
                {lang === 'bn' ? 'ব্যাকআপ API অ্যাক্সেসের জন্য টোকেন তৈরি করুন' : 'Create a token for backup API access'}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {lang === 'bn' ? 'টোকেনের নাম' : 'Token Name'}
                </label>
                <input
                  type="text"
                  value={newToken.name}
                  onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                  placeholder={lang === 'bn' ? 'যেমন: Cron Job Token' : 'e.g., Cron Job Token'}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {lang === 'bn' ? 'ব্যাকআপ টাইপ' : 'Backup Type'}
                </label>
                <select
                  value={newToken.backupType}
                  onChange={(e) => setNewToken({ ...newToken, backupType: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  <option value="all">{lang === 'bn' ? 'সব টাইপ (Daily/Monthly/Full)' : 'All Types (Daily/Monthly/Full)'}</option>
                  <option value="daily">{lang === 'bn' ? 'শুধু দৈনিক' : 'Daily Only'}</option>
                  <option value="monthly">{lang === 'bn' ? 'শুধু মাসিক' : 'Monthly Only'}</option>
                  <option value="full">{lang === 'bn' ? 'শুধু সম্পূর্ণ' : 'Full Only'}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {lang === 'bn' ? 'মেয়াদ (দিন)' : 'Validity (Days)'}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    value={newToken.validityDays}
                    onChange={(e) => setNewToken({ ...newToken, validityDays: parseInt(e.target.value) || 0 })}
                    className="w-32 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                  <span className="text-slate-500 text-sm">
                    {lang === 'bn' ? '(0 = লাইফটাইম)' : '(0 = Lifetime)'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[0, 1, 7, 30, 90, 365].map((days) => (
                    <button
                      key={days}
                      onClick={() => setNewToken({ ...newToken, validityDays: days })}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        newToken.validityDays === days
                          ? 'bg-violet-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {days === 0 ? (lang === 'bn' ? 'লাইফটাইম' : 'Lifetime') :
                       days === 1 ? (lang === 'bn' ? '১ দিন' : '1 Day') :
                       `${days} ${lang === 'bn' ? 'দিন' : 'Days'}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button
                onClick={() => { setShowTokenModal(false); setGeneratedToken(null); }}
                className="flex-1 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={createApiToken}
                className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                {lang === 'bn' ? 'টোকেন তৈরি করুন' : 'Create Token'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Token Display Modal */}
      {generatedToken && (
        <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{lang === 'bn' ? '✅ টোকেন তৈরি হয়েছে!' : '✅ Token Created!'}</h3>
                  <p className="text-green-100 text-sm">{lang === 'bn' ? 'এই তথ্য সংরক্ষণ করুন' : 'Save this information'}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-800">{lang === 'bn' ? '⚠️ গুরুত্বপূর্ণ!' : '⚠️ Important!'}</p>
                    <p className="text-red-700 text-sm mt-1">
                      {lang === 'bn' 
                        ? 'এই টোকেন আর কখনো দেখানো হবে না। এখনই সংরক্ষণ করুন!' 
                        : 'This token will never be shown again. Save it now!'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {lang === 'bn' ? 'টোকেন নাম:' : 'Token Name:'}
                </label>
                <p className="text-slate-900 font-medium">{generatedToken.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {lang === 'bn' ? 'টোকেন:' : 'Token:'}
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 break-all">
                    {generatedToken.token}
                  </code>
                  <button
                    onClick={() => copyToClipboard(generatedToken.token)}
                    className="p-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {lang === 'bn' ? 'সম্পূর্ণ API URL:' : 'Full API URL:'}
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-violet-50 px-3 py-2 rounded-lg border border-violet-200 text-violet-800 break-all">
                    {generatedToken.apiUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(generatedToken.apiUrl)}
                    className="p-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 font-medium mb-2">{lang === 'bn' ? 'ব্যবহারের উদাহরণ:' : 'Usage Examples:'}</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded">{lang === 'bn' ? 'দৈনিক' : 'Daily'}</span>
                    <code className="text-slate-600 break-all">{getBaseUrl()}/api/backup/trigger?type=daily&token={generatedToken.token.substring(0,8)}...</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{lang === 'bn' ? 'মাসিক' : 'Monthly'}</span>
                    <code className="text-slate-600 break-all">{getBaseUrl()}/api/backup/trigger?type=monthly&token={generatedToken.token.substring(0,8)}...</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">{lang === 'bn' ? 'সম্পূর্ণ' : 'Full'}</span>
                    <code className="text-slate-600 break-all">{getBaseUrl()}/api/backup/trigger?type=full&token={generatedToken.token.substring(0,8)}...</code>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t">
              <button
                onClick={() => setGeneratedToken(null)}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                {lang === 'bn' ? 'ঠিক আছে, সংরক্ষণ করেছি' : 'OK, I have saved it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// 🔧 CONFIGURATION SETTINGS COMPONENT
// ============================================
interface ConfigItem {
  key: string;
  value: string;
  category: string;
  description: string;
  is_secret: boolean;
  created_at?: string;
  updated_at?: string;
}

const ConfigSettings: React.FC<{ lang: string; onConfigChange?: () => void }> = ({ lang, onConfigChange }) => {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [rawConfig, setRawConfig] = useState<ConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [newConfigModal, setNewConfigModal] = useState(false);
  const [newConfig, setNewConfig] = useState({
    key: '',
    value: '',
    category: 'general',
    description: '',
    is_secret: false,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data.config || {});
      setRawConfig(data.raw || []);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (key: string, value: string) => {
    setIsSaving(key);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      
      if (res.ok) {
        setConfig(prev => ({ ...prev, [key]: value }));
        setEditingKey(null);
        fetchConfig();
        // Notify parent to refresh app config
        onConfigChange?.();
        // Show success message
        alert(lang === 'bn' 
          ? `✅ "${key}" সফলভাবে সেভ হয়েছে!\n\nপরিবর্তন দেখতে "System Info" ট্যাবে যান।` 
          : `✅ "${key}" saved successfully!\n\nGo to "System Info" tab to see the changes.`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save configuration');
    } finally {
      setIsSaving(null);
    }
  };

  const addNewConfig = async () => {
    if (!newConfig.key || !newConfig.value) {
      alert(lang === 'bn' ? 'Key এবং Value প্রয়োজন' : 'Key and Value are required');
      return;
    }

    setIsSaving('new');
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      
      if (res.ok) {
        setNewConfigModal(false);
        setNewConfig({ key: '', value: '', category: 'general', description: '', is_secret: false });
        fetchConfig();
        // Notify parent to refresh app config
        onConfigChange?.();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add');
      }
    } catch (error) {
      console.error('Add error:', error);
      alert('Failed to add configuration');
    } finally {
      setIsSaving(null);
    }
  };

  const deleteConfig = async (key: string) => {
    if (!confirm(lang === 'bn' ? `আপনি কি "${key}" মুছতে চান?` : `Delete "${key}"?`)) return;
    
    try {
      await fetch(`/api/config?key=${key}`, { method: 'DELETE' });
      fetchConfig();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete');
    }
  };

  const groupedConfig = rawConfig.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ConfigItem[]>);

  const categoryLabels: Record<string, string> = {
    database: lang === 'bn' ? 'ডাটাবেস' : 'Database',
    google: lang === 'bn' ? 'গুগল' : 'Google',
    general: lang === 'bn' ? 'সাধারণ' : 'General',
    api: lang === 'bn' ? 'এপিআই' : 'API',
    email: lang === 'bn' ? 'ইমেইল' : 'Email',
    payment: lang === 'bn' ? 'পেমেন্ট' : 'Payment',
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    database: <Database className="w-5 h-5" />,
    google: <Globe className="w-5 h-5" />,
    general: <SettingsIcon className="w-5 h-5" />,
    api: <Server className="w-5 h-5" />,
    email: <Mail className="w-5 h-5" />,
    payment: <CreditCard className="w-5 h-5" />,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-600 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-xl" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <SettingsIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {lang === 'bn' ? 'সিস্টেম কনফিগারেশন' : 'System Configuration'}
              </h2>
              <p className="text-rose-100 text-sm mt-1">
                {lang === 'bn' ? 'সব সেটিংস এক জায়গায়' : 'All settings in one place'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setNewConfigModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-md text-white font-bold rounded-xl hover:bg-white/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'নতুন যোগ করুন' : 'Add New'}</span>
          </button>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-800">{lang === 'bn' ? 'সতর্কীকরণ' : 'Warning'}</h4>
            <p className="text-amber-700 text-sm mt-1">
              {lang === 'bn' 
                ? 'এই সেটিংস পরিবর্তন করলে সিস্টেমে প্রভাব পড়তে পারে। সাবধানে পরিবর্তন করুন।'
                : 'Changing these settings may affect the system. Modify with caution.'}
            </p>
          </div>
        </div>
      </div>

      {/* Config Groups */}
      {Object.entries(groupedConfig).map(([category, items]) => (
        <div key={category} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                {categoryIcons[category] || <SettingsIcon className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{categoryLabels[category] || category}</h3>
                <p className="text-slate-500 text-sm">{items.length} {lang === 'bn' ? 'টি সেটিং' : 'settings'}</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.key} className="p-4 sm:p-6 hover:bg-slate-50 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                        {item.key}
                      </code>
                      {item.is_secret && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {lang === 'bn' ? 'গোপন' : 'Secret'}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-slate-500 text-sm mt-1">{item.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {editingKey === item.key ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type={item.is_secret && !showSecret[item.key] ? 'password' : 'text'}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 sm:w-64 px-3 py-2 border border-slate-200 rounded-xl text-sm"
                          placeholder={lang === 'bn' ? 'নতুন মান' : 'New value'}
                        />
                        <button
                          onClick={() => saveConfig(item.key, editValue)}
                          disabled={isSaving === item.key}
                          className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all"
                        >
                          {isSaving === item.key ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-1 sm:flex-none">
                          <code className="text-sm bg-slate-100 px-3 py-2 rounded-xl text-slate-600 truncate max-w-xs sm:max-w-md">
                            {item.is_secret && !showSecret[item.key] ? '••••••••••••' : config[item.key]}
                          </code>
                          {item.is_secret && (
                            <button
                              onClick={() => setShowSecret(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                            >
                              {showSecret[item.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setEditingKey(item.key);
                            setEditValue(config[item.key] || '');
                          }}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteConfig(item.key)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {rawConfig.length === 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
          <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-700">{lang === 'bn' ? 'কোনো কনফিগারেশন নেই' : 'No Configuration Found'}</h3>
          <p className="text-slate-500 text-sm mt-2">
            {lang === 'bn' ? 'নতুন কনফিগারেশন যোগ করতে উপরের বাটনে ক্লিক করুন' : 'Click the button above to add configuration'}
          </p>
        </div>
      )}

      {/* New Config Modal */}
      {newConfigModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-6">
              <h3 className="text-xl font-black text-white">{lang === 'bn' ? 'নতুন কনফিগারেশন' : 'New Configuration'}</h3>
              <p className="text-rose-100 text-sm mt-1">{lang === 'bn' ? 'নতুন সেটিং যোগ করুন' : 'Add a new setting'}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">{lang === 'bn' ? 'Key' : 'Key'} *</label>
                <input
                  value={newConfig.key}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, key: e.target.value }))}
                  className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl"
                  placeholder="e.g., google_client_id"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">{lang === 'bn' ? 'Value' : 'Value'} *</label>
                <textarea
                  value={newConfig.value}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl"
                  placeholder="Enter value..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</label>
                <select
                  value={newConfig.category}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl"
                >
                  <option value="general">{lang === 'bn' ? 'সাধারণ' : 'General'}</option>
                  <option value="database">{lang === 'bn' ? 'ডাটাবেস' : 'Database'}</option>
                  <option value="google">{lang === 'bn' ? 'গুগল' : 'Google'}</option>
                  <option value="api">{lang === 'bn' ? 'এপিআই' : 'API'}</option>
                  <option value="email">{lang === 'bn' ? 'ইমেইল' : 'Email'}</option>
                  <option value="payment">{lang === 'bn' ? 'পেমেন্ট' : 'Payment'}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">{lang === 'bn' ? 'বর্ণনা' : 'Description'}</label>
                <input
                  value={newConfig.description}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl"
                  placeholder={lang === 'bn' ? 'এই সেটিং এর বর্ণনা' : 'Description of this setting'}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_secret"
                  checked={newConfig.is_secret}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, is_secret: e.target.checked }))}
                  className="w-4 h-4 text-rose-500 rounded"
                />
                <label htmlFor="is_secret" className="text-sm text-slate-600">
                  {lang === 'bn' ? 'এটি গোপন তথ্য (API Key, Password ইত্যাদি)' : 'This is secret (API Key, Password, etc.)'}
                </label>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button
                onClick={() => setNewConfigModal(false)}
                className="flex-1 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={addNewConfig}
                disabled={isSaving === 'new'}
                className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isSaving === 'new' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    {lang === 'bn' ? 'যোগ করুন' : 'Add'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
