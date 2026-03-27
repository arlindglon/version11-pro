import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Eye, EyeOff, Save, Check, Zap, Globe, Mail, Phone, MapPin,
  Facebook, Instagram, Youtube, MessageCircle, Heart, ExternalLink,
  LayoutDashboard, Package, ShoppingCart, BarChart3, HelpCircle, Settings
} from 'lucide-react';

interface FooterSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  whatsappNumber: string;
  developerName: string;
  developerWebsite: string;
  developerEmail: string;
  showDeveloperCredit: boolean;
  customFooterText: string;
  showFooter: boolean;
  showQuickLinks: boolean;
  showContact: boolean;
  showSupport: boolean;
  showSocialLinks: boolean;
}

const defaultSettings: FooterSettings = {
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  whatsappNumber: '',
  developerName: 'Dokan Team',
  developerWebsite: '',
  developerEmail: '',
  showDeveloperCredit: true,
  customFooterText: '',
  showFooter: true,
  showQuickLinks: true,
  showContact: true,
  showSupport: true,
  showSocialLinks: true,
};

const FooterManagement: React.FC = () => {
  const { lang } = useLanguage();
  const [settings, setSettings] = useState<FooterSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'visibility'>('content');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/footer-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...defaultSettings, ...data });
      }
    } catch (error) {
      console.error('Failed to fetch footer settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/footer-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save footer settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof FooterSettings>(key: K, value: FooterSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {lang === 'bn' ? 'ফুটার ম্যানেজমেন্ট' : 'Footer Management'}
          </h2>
          <p className="text-slate-500 text-sm">
            {lang === 'bn' ? 'ফুটার কাস্টমাইজ করুন এবং দেখান/লুকান' : 'Customize footer and toggle visibility'}
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {lang === 'bn' ? 'সেভ হচ্ছে...' : 'Saving...'}
            </>
          ) : saved ? (
            <>
              <Check className="w-5 h-5" />
              {lang === 'bn' ? 'সেভ হয়েছে!' : 'Saved!'}
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {lang === 'bn' ? 'সেভ করুন' : 'Save Changes'}
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'content', icon: <Zap className="w-4 h-4" />, label: lang === 'bn' ? 'কন্টেন্ট' : 'Content' },
          { id: 'visibility', icon: <Eye className="w-4 h-4" />, label: lang === 'bn' ? 'দেখান/লুকান' : 'Visibility' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Info */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-violet-600" />
                {lang === 'bn' ? 'কোম্পানি তথ্য' : 'Company Info'}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  {lang === 'bn' ? 'কোম্পানি নাম' : 'Company Name'}
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => updateSetting('companyName', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 outline-none"
                  placeholder={lang === 'bn' ? 'আপনার কোম্পানির নাম' : 'Your Company Name'}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  {lang === 'bn' ? 'ঠিকানা' : 'Address'}
                </label>
                <textarea
                  value={settings.companyAddress}
                  onChange={(e) => updateSetting('companyAddress', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 outline-none resize-none"
                  rows={2}
                  placeholder={lang === 'bn' ? 'আপনার ঠিকানা' : 'Your Address'}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">
                    {lang === 'bn' ? 'ফোন' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={settings.companyPhone}
                    onChange={(e) => updateSetting('companyPhone', e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 outline-none"
                    placeholder="+880 1XXX-XXXXXX"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">
                    {lang === 'bn' ? 'ইমেইল' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => updateSetting('companyEmail', e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 outline-none"
                    placeholder="info@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  {lang === 'bn' ? 'কাস্টম টেক্সট' : 'Custom Text'}
                </label>
                <textarea
                  value={settings.customFooterText}
                  onChange={(e) => updateSetting('customFooterText', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 outline-none resize-none"
                  rows={2}
                  placeholder={lang === 'bn' ? 'ফুটারে দেখানোর জন্য কাস্টম টেক্সট' : 'Custom text to display in footer'}
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                {lang === 'bn' ? 'সোশ্যাল লিংক' : 'Social Links'}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1 flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  Facebook
                </label>
                <input
                  type="url"
                  value={settings.facebookUrl}
                  onChange={(e) => updateSetting('facebookUrl', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 outline-none"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1 flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-600" />
                  Instagram
                </label>
                <input
                  type="url"
                  value={settings.instagramUrl}
                  onChange={(e) => updateSetting('instagramUrl', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 outline-none"
                  placeholder="https://instagram.com/yourprofile"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1 flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-600" />
                  YouTube
                </label>
                <input
                  type="url"
                  value={settings.youtubeUrl}
                  onChange={(e) => updateSetting('youtubeUrl', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 outline-none"
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={(e) => updateSetting('whatsappNumber', e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 outline-none"
                  placeholder="+880 1XXX-XXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Developer Info */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-pink-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600" />
                {lang === 'bn' ? 'ডেভেলপার তথ্য' : 'Developer Info'}
              </h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">
                    {lang === 'bn' ? 'ডেভেলপার নাম' : 'Developer Name'}
                  </label>
                  <input
                    type="text"
                    value={settings.developerName}
                    onChange={(e) => updateSetting('developerName', e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 outline-none"
                    placeholder="Dokan Team"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">
                    {lang === 'bn' ? 'ডেভেলপার ওয়েবসাইট' : 'Developer Website'}
                  </label>
                  <input
                    type="url"
                    value={settings.developerWebsite}
                    onChange={(e) => updateSetting('developerWebsite', e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 outline-none"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">
                    {lang === 'bn' ? 'ডেভেলপার ইমেইল' : 'Developer Email'}
                  </label>
                  <input
                    type="email"
                    value={settings.developerEmail}
                    onChange={(e) => updateSetting('developerEmail', e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-violet-500 outline-none"
                    placeholder="dev@example.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visibility Tab */}
      {activeTab === 'visibility' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-600" />
              {lang === 'bn' ? 'ফুটার দেখান/লুকান' : 'Footer Visibility Settings'}
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              {lang === 'bn' ? 'ফুটারের বিভিন্ন সেকশন দেখান বা লুকান' : 'Show or hide different footer sections'}
            </p>
          </div>
          <div className="p-5 space-y-4">
            {/* Main Footer Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${settings.showFooter ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                  {settings.showFooter ? (
                    <Eye className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {lang === 'bn' ? 'ফুটার দেখান' : 'Show Footer'}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {lang === 'bn' ? 'সম্পূর্ণ ফুটার দেখান বা লুকান' : 'Show or hide the entire footer'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('showFooter', !settings.showFooter)}
                className={`w-14 h-8 rounded-full transition-all ${settings.showFooter ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${settings.showFooter ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Quick Links Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${settings.showQuickLinks ? 'bg-violet-100' : 'bg-slate-200'}`}>
                  <LayoutDashboard className={`w-5 h-5 ${settings.showQuickLinks ? 'text-violet-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {lang === 'bn' ? 'দ্রুত লিংক' : 'Quick Links'}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {lang === 'bn' ? 'Dashboard, Inventory, Sales, Reports' : 'Dashboard, Inventory, Sales, Reports'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('showQuickLinks', !settings.showQuickLinks)}
                className={`w-14 h-8 rounded-full transition-all ${settings.showQuickLinks ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${settings.showQuickLinks ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Contact Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${settings.showContact ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                  <Mail className={`w-5 h-5 ${settings.showContact ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {lang === 'bn' ? 'যোগাযোগ' : 'Contact'}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {lang === 'bn' ? 'ঠিকানা, ফোন, ইমেইল' : 'Address, Phone, Email'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('showContact', !settings.showContact)}
                className={`w-14 h-8 rounded-full transition-all ${settings.showContact ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${settings.showContact ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Support Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${settings.showSupport ? 'bg-rose-100' : 'bg-slate-200'}`}>
                  <HelpCircle className={`w-5 h-5 ${settings.showSupport ? 'text-rose-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {lang === 'bn' ? 'সাপোর্ট' : 'Support'}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {lang === 'bn' ? 'Help Center, Tutorials, FAQ' : 'Help Center, Tutorials, FAQ'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('showSupport', !settings.showSupport)}
                className={`w-14 h-8 rounded-full transition-all ${settings.showSupport ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${settings.showSupport ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Social Links Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${settings.showSocialLinks ? 'bg-blue-100' : 'bg-slate-200'}`}>
                  <Globe className={`w-5 h-5 ${settings.showSocialLinks ? 'text-blue-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {lang === 'bn' ? 'সোশ্যাল লিংক' : 'Social Links'}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {lang === 'bn' ? 'Facebook, Instagram, YouTube, WhatsApp' : 'Facebook, Instagram, YouTube, WhatsApp'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('showSocialLinks', !settings.showSocialLinks)}
                className={`w-14 h-8 rounded-full transition-all ${settings.showSocialLinks ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${settings.showSocialLinks ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Developer Credit Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${settings.showDeveloperCredit ? 'bg-pink-100' : 'bg-slate-200'}`}>
                  <Heart className={`w-5 h-5 ${settings.showDeveloperCredit ? 'text-pink-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {lang === 'bn' ? 'ডেভেলপার ক্রেডিট' : 'Developer Credit'}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {lang === 'bn' ? '"Developed by" দেখান' : 'Show "Developed by" credit'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('showDeveloperCredit', !settings.showDeveloperCredit)}
                className={`w-14 h-8 rounded-full transition-all ${settings.showDeveloperCredit ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${settings.showDeveloperCredit ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-600" />
            {lang === 'bn' ? 'ফুটার প্রিভিউ' : 'Footer Preview'}
          </h3>
        </div>
        <div className="bg-slate-900 p-6">
          {settings.showFooter ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-white">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="font-bold">{settings.companyName || 'Your Shop'}</span>
                </div>
                <p className="text-slate-400 text-xs">
                  {settings.customFooterText || (lang === 'bn' ? 'আপনার ব্যবসার সম্পূর্ণ সমাধান' : 'Complete solution for your business')}
                </p>
              </div>
              
              {/* Quick Links */}
              {settings.showQuickLinks && (
                <div>
                  <p className="font-bold text-sm mb-2">{lang === 'bn' ? 'দ্রুত লিংক' : 'Quick Links'}</p>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p>{lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</p>
                    <p>{lang === 'bn' ? 'ইনভেন্টরি' : 'Inventory'}</p>
                    <p>{lang === 'bn' ? 'সেলস' : 'Sales'}</p>
                    <p>{lang === 'bn' ? 'রিপোর্টস' : 'Reports'}</p>
                  </div>
                </div>
              )}
              
              {/* Contact */}
              {settings.showContact && (
                <div>
                  <p className="font-bold text-sm mb-2">{lang === 'bn' ? 'যোগাযোগ' : 'Contact'}</p>
                  <div className="space-y-1 text-xs text-slate-400">
                    {settings.companyAddress && <p>{settings.companyAddress}</p>}
                    {settings.companyPhone && <p>{settings.companyPhone}</p>}
                  </div>
                </div>
              )}
              
              {/* Support */}
              {settings.showSupport && (
                <div>
                  <p className="font-bold text-sm mb-2">{lang === 'bn' ? 'সাপোর্ট' : 'Support'}</p>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p>{lang === 'bn' ? 'সাহায্য কেন্দ্র' : 'Help Center'}</p>
                    <p>{lang === 'bn' ? 'টিউটোরিয়াল' : 'Tutorials'}</p>
                    <p>{lang === 'bn' ? 'প্রায়শই জিজ্ঞাসিত' : 'FAQ'}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <EyeOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{lang === 'bn' ? 'ফুটার লুকানো আছে' : 'Footer is hidden'}</p>
            </div>
          )}
          
          {/* Copyright Bar */}
          {settings.showFooter && (
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>© {new Date().getFullYear()} | {settings.companyName || 'Your Shop'} | {lang === 'bn' ? 'সর্বস্বত্ব সংরক্ষিত' : 'All Rights Reserved'}</span>
              {settings.showDeveloperCredit && (
                <span className="flex items-center gap-1">
                  {lang === 'bn' ? 'ডেভেলপড বাই' : 'Developed by'} <Heart className="w-3 h-3 text-rose-500" /> {settings.developerName}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FooterManagement;
