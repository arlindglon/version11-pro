import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Heart, ExternalLink, Globe, Mail, Phone, MapPin,
  Facebook, Instagram, Youtube, MessageCircle, Zap, HelpCircle,
  LayoutDashboard, Package, ShoppingCart, BarChart3, Settings, Eye, EyeOff
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
  showDeveloperCredit: boolean;
  customFooterText: string;
  showFooter: boolean;
  showQuickLinks: boolean;
  showContact: boolean;
  showSupport: boolean;
  showSocialLinks: boolean;
}

interface Props {
  settings?: {
    shopName?: string;
    shopAddress?: string;
    shopPhone?: string;
    shopEmail?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    whatsappNumber?: string;
  } | null;
  onNavigate?: (view: string) => void;
}

const AppFooter: React.FC<Props> = ({ settings, onNavigate }) => {
  const { lang } = useLanguage();
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(null);
  const [appConfig, setAppConfig] = useState({
    appName: 'Dokan POS Pro',
    appVersion: 'v6.1.0',
    releaseYear: '2024',
  });

  const fetchFooterSettings = async () => {
    try {
      const res = await fetch('/api/footer-settings');
      if (res.ok) {
        const data = await res.json();
        setFooterSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch footer settings:', error);
    }
  };

  const fetchAppConfig = async () => {
    try {
      const res = await fetch('/api/app-config');
      if (res.ok) {
        const data = await res.json();
        setAppConfig({
          appName: data.appName || 'Dokan POS Pro',
          appVersion: data.appVersion || 'v6.1.0',
          releaseYear: data.releaseYear || '2024',
        });
      }
    } catch (error) {
      console.error('Failed to fetch app config:', error);
    }
  };

  useEffect(() => {
    fetchFooterSettings();
    fetchAppConfig();
  }, []);

  // Check if footer should be shown
  if (footerSettings?.showFooter === false) {
    return null;
  }

  // Use settings from props or footer settings from API
  const shopName = settings?.shopName || footerSettings?.companyName || appConfig.appName;
  const address = settings?.shopAddress || footerSettings?.companyAddress || '';
  const phone = settings?.shopPhone || footerSettings?.companyPhone || '';
  const email = settings?.shopEmail || footerSettings?.companyEmail || '';
  const facebook = settings?.facebookUrl || footerSettings?.facebookUrl || '';
  const instagram = settings?.instagramUrl || footerSettings?.instagramUrl || '';
  const youtube = settings?.youtubeUrl || footerSettings?.youtubeUrl || '';
  const whatsapp = settings?.whatsappNumber || footerSettings?.whatsappNumber || '';

  const currentYear = new Date().getFullYear();
  const displayYear = appConfig.releaseYear || currentYear.toString();

  // Navigation handler
  const handleNavigate = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
    }
  };

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{shopName}</h3>
                <p className="text-slate-400 text-xs">{appConfig.appVersion}</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              {footerSettings?.customFooterText || 
                (lang === 'bn' 
                  ? 'আপনার ব্যবসার জন্য সম্পূর্ণ সমাধান। ইনভেন্টরি, সেলস, এবং একাউন্টিং এক জায়গায়।'
                  : 'Complete solution for your business. Inventory, Sales, and Accounting in one place.')
              }
            </p>
            {/* Social Links */}
            {footerSettings?.showSocialLinks !== false && (
              <div className="flex items-center gap-2">
                {facebook && (
                  <a
                    href={facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all"
                    title="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-slate-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-all"
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {youtube && (
                  <a
                    href={youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-slate-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all"
                    title="YouTube"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-slate-800 hover:bg-green-600 rounded-lg flex items-center justify-center transition-all"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          {footerSettings?.showQuickLinks !== false && (
            <div>
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-violet-400" />
                {lang === 'bn' ? 'দ্রুত লিংক' : 'Quick Links'}
              </h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => handleNavigate('dashboard')}
                    className="text-slate-400 hover:text-white text-sm transition-all flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                    {lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNavigate('inventory')}
                    className="text-slate-400 hover:text-white text-sm transition-all flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                    {lang === 'bn' ? 'ইনভেন্টরি' : 'Inventory'}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNavigate('pos')}
                    className="text-slate-400 hover:text-white text-sm transition-all flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                    {lang === 'bn' ? 'সেলস' : 'Sales'}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNavigate('reports')}
                    className="text-slate-400 hover:text-white text-sm transition-all flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                    {lang === 'bn' ? 'রিপোর্টস' : 'Reports'}
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* Contact Info */}
          {footerSettings?.showContact !== false && (
            <div>
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                {lang === 'bn' ? 'যোগাযোগ' : 'Contact'}
              </h4>
              <ul className="space-y-3">
                {address && (
                  <li className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <span className="text-slate-400 text-sm">{address}</span>
                  </li>
                )}
                {phone && (
                  <li>
                    <a href={`tel:${phone}`} className="flex items-center gap-3 text-slate-400 hover:text-white text-sm transition-all">
                      <Phone className="w-4 h-4 shrink-0" />
                      {phone}
                    </a>
                  </li>
                )}
                {email && (
                  <li>
                    <a href={`mailto:${email}`} className="flex items-center gap-3 text-slate-400 hover:text-white text-sm transition-all">
                      <Mail className="w-4 h-4 shrink-0" />
                      {email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Support */}
          {footerSettings?.showSupport !== false && (
            <div>
              <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-rose-400" />
                {lang === 'bn' ? 'সাপোর্ট' : 'Support'}
              </h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => handleNavigate('support')}
                    className="text-slate-400 hover:text-white text-sm transition-all flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                    {lang === 'bn' ? 'সাহায্য কেন্দ্র' : 'Help Center'}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNavigate('support')}
                    className="text-slate-400 hover:text-white text-sm transition-all flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                    {lang === 'bn' ? 'টিউটোরিয়াল' : 'Tutorials'}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => handleNavigate('support')}
                    className="text-slate-400 hover:text-white text-sm transition-all flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                    {lang === 'bn' ? 'প্রায়শই জিজ্ঞাসিত' : 'FAQ'}
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span>© {displayYear === currentYear.toString() ? currentYear : `${displayYear} - ${currentYear}`}</span>
              <span className="text-slate-600">|</span>
              <span className="font-semibold text-white">{shopName}</span>
              <span className="text-slate-600">|</span>
              <span>{lang === 'bn' ? 'সর্বস্বত্ব সংরক্ষিত' : 'All Rights Reserved'}</span>
            </div>

            {/* Developer Credit */}
            {(footerSettings?.showDeveloperCredit !== false) && (
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <span>{lang === 'bn' ? 'ডেভেলপড বাই' : 'Developed by'}</span>
                <Heart className="w-3 h-3 text-rose-500 animate-pulse" />
                <a
                  href={footerSettings?.developerWebsite || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-violet-400 hover:text-violet-300 transition-all flex items-center gap-1"
                >
                  {footerSettings?.developerName || 'Dokan Team'}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
