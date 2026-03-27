import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  HelpCircle, MessageCircle, Video, BookOpen, ChevronDown, ChevronUp,
  Youtube, Mail, Phone, MapPin, Clock, Send, ExternalLink, Play,
  Search, FileText, Users, Zap, Package, ShoppingCart, BarChart3,
  Settings, Database, Cloud, Shield, Globe, CreditCard, Calculator,
  CheckCircle, Star, AlertCircle, Plus, X, Edit, Trash2, Save,
  Facebook, Instagram, Link as LinkIcon, FileVideo, Tv
} from 'lucide-react';
import { getVideoInfo, getPlatformName, isValidVideoUrl, VideoInfo } from '@/lib/video-utils';

// ============================================
// SUPPORT SETTINGS INTERFACE
// ============================================
export interface SupportSettings {
  // Contact Info
  supportEmail: string;
  supportPhone: string;
  supportAddress: string;
  supportHours: string;
  
  // Social Links
  supportFacebook: string;
  supportWhatsapp: string;
  supportYoutube: string;
  
  // Video Tutorials
  tutorials: VideoTutorial[];
  
  // FAQ
  faqs: FAQItem[];
  
  // Custom Categories
  tutorialCategories: TutorialCategory[];
  faqCategories: FAQCategory[];
  
  // Developer Info
  developerName: string;
  developerWebsite: string;
  developerEmail: string;
}

export interface TutorialCategory {
  id: string;
  label: string;
  labelBn: string;
  icon: string;
  order: number;
}

export interface FAQCategory {
  id: string;
  label: string;
  labelBn: string;
  order: number;
}

export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string; // Just paste URL - auto-detected!
  thumbnail?: string;
  category: string;
  duration?: string;
  order: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

// Default categories
const DEFAULT_TUTORIAL_CATEGORIES: TutorialCategory[] = [
  { id: 'all', label: 'All', labelBn: 'সব', icon: 'BookOpen', order: 0 },
  { id: 'basics', label: 'Basics', labelBn: 'বেসিক', icon: 'Zap', order: 1 },
  { id: 'inventory', label: 'Inventory', labelBn: 'ইনভেন্টরি', icon: 'Package', order: 2 },
  { id: 'sales', label: 'Sales', labelBn: 'সেলস', icon: 'ShoppingCart', order: 3 },
  { id: 'reports', label: 'Reports', labelBn: 'রিপোর্ট', icon: 'BarChart3', order: 4 },
  { id: 'settings', label: 'Settings', labelBn: 'সেটিংস', icon: 'Settings', order: 5 },
  { id: 'backup', label: 'Backup', labelBn: 'ব্যাকআপ', icon: 'Cloud', order: 6 },
];

const DEFAULT_FAQ_CATEGORIES: FAQCategory[] = [
  { id: 'general', label: 'General', labelBn: 'সাধারণ', order: 0 },
  { id: 'inventory', label: 'Inventory', labelBn: 'ইনভেন্টরি', order: 1 },
  { id: 'sales', label: 'Sales', labelBn: 'সেলস', order: 2 },
  { id: 'users', label: 'Users', labelBn: 'ইউজার', order: 3 },
  { id: 'backup', label: 'Backup', labelBn: 'ব্যাকআপ', order: 4 },
  { id: 'settings', label: 'Settings', labelBn: 'সেটিংস', order: 5 },
];

// Default tutorials with just URLs
const DEFAULT_TUTORIALS: VideoTutorial[] = [
  {
    id: '1',
    title: 'Getting Started with Dokan POS',
    description: 'Learn the basics of Dokan POS - setting up your shop and first sale',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'basics',
    order: 1,
  },
  {
    id: '2',
    title: 'Inventory Management Guide',
    description: 'How to add products, manage stock, and track inventory',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'inventory',
    order: 2,
  },
  {
    id: '3',
    title: 'Making Sales in POS',
    description: 'Complete guide to processing sales and payments',
    videoUrl: 'https://vimeo.com/123456789',
    category: 'sales',
    order: 3,
  },
];

// Default FAQs
const DEFAULT_FAQS: FAQItem[] = [
  {
    id: '1',
    question: 'How do I add a new product?',
    answer: 'Go to Inventory → Click "Add Product" → Fill in product details like name, price, stock → Save the product.',
    category: 'inventory',
    order: 1,
  },
  {
    id: '2',
    question: 'How do I process a sale?',
    answer: 'Go to POS or Scanner POS → Scan or search products → Add to cart → Select customer → Choose payment method → Complete sale.',
    category: 'sales',
    order: 2,
  },
  {
    id: '3',
    question: 'How do I add a new user?',
    answer: 'Master Admin can go to Settings → User Management → Add new user with appropriate role and permissions.',
    category: 'users',
    order: 3,
  },
  {
    id: '4',
    question: 'How do I backup my data?',
    answer: 'Go to Settings → Backup → Connect Google Drive → Create backup. Your data will be safely stored in the cloud.',
    category: 'backup',
    order: 4,
  },
  {
    id: '5',
    question: 'How do I change shop information?',
    answer: 'Go to Settings → Shop Profile → Update your shop name, logo, address, and other details → Save changes.',
    category: 'settings',
    order: 5,
  },
];

// ============================================
// VIDEO CARD COMPONENT
// ============================================
interface VideoCardProps {
  tutorial: VideoTutorial;
  onClick?: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ tutorial, onClick }) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const videoInfo = getVideoInfo(tutorial.videoUrl);
  
  // Get thumbnail - use custom or auto-generated
  const thumbnailUrl = tutorial.thumbnail || videoInfo.thumbnailUrl;
  
  // Get platform badge color
  const getPlatformColor = (platform: VideoInfo['platform']) => {
    switch (platform) {
      case 'youtube': return 'bg-red-600';
      case 'vimeo': return 'bg-blue-500';
      case 'facebook': return 'bg-blue-600';
      case 'dailymotion': return 'bg-blue-400';
      case 'tiktok': return 'bg-black';
      case 'direct': return 'bg-emerald-600';
      default: return 'bg-slate-600';
    }
  };

  const getPlatformIcon = (platform: VideoInfo['platform']) => {
    switch (platform) {
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'vimeo': return <Tv className="w-4 h-4" />;
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'direct': return <FileVideo className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all group">
      <div className="relative aspect-video bg-slate-900">
        {!showPlayer ? (
          <>
            {/* Thumbnail */}
            <img
              src={imageError ? '/video-placeholder.png' : thumbnailUrl}
              alt={tutorial.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
              <button
                onClick={() => setShowPlayer(true)}
                className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <Play className="w-8 h-8 text-white ml-1" />
              </button>
            </div>
            
            {/* Platform Badge */}
            <div className={`absolute top-3 left-3 ${getPlatformColor(videoInfo.platform)} text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1`}>
              {getPlatformIcon(videoInfo.platform)}
              {getPlatformName(videoInfo.platform)}
            </div>
            
            {/* Duration Badge */}
            {tutorial.duration && (
              <span className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 text-white text-xs rounded font-medium">
                {tutorial.duration}
              </span>
            )}
          </>
        ) : (
          // Video Player
          <div className="w-full h-full">
            {videoInfo.isDirectVideo ? (
              <video
                src={videoInfo.embedUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : (
              <iframe
                src={videoInfo.embedUrl + '?autoplay=1'}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-slate-900 mb-2 line-clamp-2">{tutorial.title}</h3>
        <p className="text-slate-500 text-sm line-clamp-2">{tutorial.description}</p>
      </div>
    </div>
  );
};

// ============================================
// SUPPORT COMPONENT
// ============================================
interface Props {
  currentUserRole?: string;
}

const Support: React.FC<Props> = ({ currentUserRole }) => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'tutorials' | 'faq' | 'contact' | 'docs'>('tutorials');
  const [settings, setSettings] = useState<SupportSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchSupportSettings = async () => {
    try {
      const res = await fetch('/api/support-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch support settings:', error);
    }
  };

  useEffect(() => {
    fetchSupportSettings();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitSuccess(true);
    setIsSubmitting(false);
    setContactForm({ name: '', email: '', subject: '', message: '' });
    
    setTimeout(() => setSubmitSuccess(false), 3000);
  };

  const tutorials = settings?.tutorials || DEFAULT_TUTORIALS;
  const faqs = settings?.faqs || DEFAULT_FAQS;
  const tutorialCategories = settings?.tutorialCategories || DEFAULT_TUTORIAL_CATEGORIES;
  const faqCategories = settings?.faqCategories || DEFAULT_FAQ_CATEGORIES;

  const filteredTutorials = tutorials.filter(t => 
    selectedCategory === 'all' || t.category === selectedCategory
  ).filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFaqs = faqs.filter(f =>
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get icon component from string
  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'BookOpen': <BookOpen className="w-4 h-4" />,
      'Zap': <Zap className="w-4 h-4" />,
      'Package': <Package className="w-4 h-4" />,
      'ShoppingCart': <ShoppingCart className="w-4 h-4" />,
      'BarChart3': <BarChart3 className="w-4 h-4" />,
      'Settings': <Settings className="w-4 h-4" />,
      'Cloud': <Cloud className="w-4 h-4" />,
      'Users': <Users className="w-4 h-4" />,
      'Database': <Database className="w-4 h-4" />,
      'Shield': <Shield className="w-4 h-4" />,
      'CreditCard': <CreditCard className="w-4 h-4" />,
      'Calculator': <Calculator className="w-4 h-4" />,
    };
    return icons[iconName] || <BookOpen className="w-4 h-4" />;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/5 rounded-full blur-xl" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {lang === 'bn' ? 'সাপোর্ট সেন্টার' : 'Support Center'}
              </h1>
              <p className="text-emerald-100 text-sm mt-1">
                {lang === 'bn' ? 'আমরা সাহায্য করতে এখানে আছি' : "We're here to help you"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-white text-sm">
              <Clock className="w-4 h-4" />
              <span>{settings?.supportHours || '24/7 Support'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'tutorials', icon: <Video className="w-4 h-4" />, label: lang === 'bn' ? 'ভিডিও টিউটোরিয়াল' : 'Video Tutorials' },
          { id: 'faq', icon: <HelpCircle className="w-4 h-4" />, label: lang === 'bn' ? 'সাধারণ প্রশ্ন' : 'FAQ' },
          { id: 'contact', icon: <MessageCircle className="w-4 h-4" />, label: lang === 'bn' ? 'যোগাযোগ' : 'Contact Us' },
          { id: 'docs', icon: <FileText className="w-4 h-4" />, label: lang === 'bn' ? 'ডকুমেন্টেশন' : 'Documentation' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 mb-6 border border-slate-200">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'bn' ? 'সার্চ করুন...' : 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-emerald-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === 'tutorials' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {tutorialCategories
              .sort((a, b) => a.order - b.order)
              .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {getIconComponent(cat.icon)}
                  {lang === 'bn' ? cat.labelBn : cat.label}
                </button>
              ))}
          </div>

          {/* Tutorial Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((tutorial) => (
              <VideoCard key={tutorial.id} tutorial={tutorial} />
            ))}
          </div>

          {filteredTutorials.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">{lang === 'bn' ? 'কোনো টিউটোরিয়াল পাওয়া যায়নি' : 'No tutorials found'}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'faq' && (
        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <HelpCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                </div>
                {expandedFaq === faq.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                )}
              </button>
              {expandedFaq === faq.id && (
                <div className="px-5 pb-5 pt-0">
                  <p className="text-slate-600 leading-relaxed pl-13 ml-0" style={{ paddingLeft: '52px' }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">{lang === 'bn' ? 'কোনো প্রশ্ন পাওয়া যায়নি' : 'No questions found'}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                {lang === 'bn' ? 'মেসেজ পাঠান' : 'Send a Message'}
              </h3>
            </div>
            <form onSubmit={handleContactSubmit} className="p-6 space-y-4">
              {submitSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">
                    {lang === 'bn' ? 'মেসেজ পাঠানো হয়েছে!' : 'Message Sent!'}
                  </h4>
                  <p className="text-slate-500 text-sm">
                    {lang === 'bn' ? 'আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব' : "We'll get back to you soon"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        {lang === 'bn' ? 'নাম' : 'Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                        placeholder={lang === 'bn' ? 'আপনার নাম' : 'Your name'}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        {lang === 'bn' ? 'ইমেইল' : 'Email'} *
                      </label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      {lang === 'bn' ? 'বিষয়' : 'Subject'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                      placeholder={lang === 'bn' ? 'মেসেজের বিষয়' : 'Message subject'}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      {lang === 'bn' ? 'মেসেজ' : 'Message'} *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none resize-none"
                      placeholder={lang === 'bn' ? 'আপনার মেসেজ লিখুন...' : 'Write your message...'}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {lang === 'bn' ? 'মেসেজ পাঠান' : 'Send Message'}
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            {/* Quick Contact */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  {lang === 'bn' ? 'দ্রুত যোগাযোগ' : 'Quick Contact'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {settings?.supportEmail && (
                  <a
                    href={`mailto:${settings.supportEmail}`}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{lang === 'bn' ? 'ইমেইল' : 'Email'}</p>
                      <p className="font-semibold text-slate-900">{settings.supportEmail}</p>
                    </div>
                  </a>
                )}
                {settings?.supportPhone && (
                  <a
                    href={`tel:${settings.supportPhone}`}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{lang === 'bn' ? 'ফোন' : 'Phone'}</p>
                      <p className="font-semibold text-slate-900">{settings.supportPhone}</p>
                    </div>
                  </a>
                )}
                {settings?.supportAddress && (
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{lang === 'bn' ? 'ঠিকানা' : 'Address'}</p>
                      <p className="font-semibold text-slate-900">{settings.supportAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-600" />
                  {lang === 'bn' ? 'সোশ্যাল মিডিয়া' : 'Social Media'}
                </h3>
              </div>
              <div className="p-6 grid grid-cols-3 gap-3">
                {settings?.supportFacebook && (
                  <a
                    href={settings.supportFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
                  >
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-blue-700">Facebook</span>
                  </a>
                )}
                {settings?.supportWhatsapp && (
                  <a
                    href={`https://wa.me/${settings.supportWhatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-all"
                  >
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-green-700">WhatsApp</span>
                  </a>
                )}
                {settings?.supportYoutube && (
                  <a
                    href={settings.supportYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-all"
                  >
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                      <Youtube className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-red-700">YouTube</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="space-y-6">
          {/* Documentation Categories */}
          {[
            {
              title: lang === 'bn' ? '🚀 শুরু করুন' : '🚀 Getting Started',
              icon: <Zap className="w-5 h-5" />,
              color: 'emerald',
              articles: [
                { 
                  title: lang === 'bn' ? 'ইনস্টলেশন গাইড' : 'Installation Guide', 
                  desc: lang === 'bn' 
                    ? 'সিস্টেম সেটআপ করুন - লগইন করুন, শপ প্রোফাইল সেট করুন, এবং প্রথম কনফিগারেশন সম্পন্ন করুন'
                    : 'Set up the system - Login, configure shop profile, and complete initial setup' 
                },
                { 
                  title: lang === 'bn' ? 'প্রথম সেল' : 'Your First Sale', 
                  desc: lang === 'bn' 
                    ? 'POS এ যান → প্রোডাক্ট সিলেক্ট করুন → কাস্টমার বেছে নিন → পেমেন্ট সম্পন্ন করুন → রসিদ প্রিন্ট করুন'
                    : 'Go to POS → Select products → Choose customer → Complete payment → Print receipt' 
                },
                { 
                  title: lang === 'bn' ? 'ইউজার ম্যানেজমেন্ট' : 'User Management', 
                  desc: lang === 'bn' 
                    ? 'মাস্টার এডমিন: সেটিংস → ইউজার ম্যানেজমেন্ট → নতুন ইউজার যোগ করুন এবং রোল ও পারমিশন সেট করুন'
                    : 'Master Admin: Settings → User Management → Add new users and set roles & permissions' 
                },
              ]
            },
            {
              title: lang === 'bn' ? '📦 ইনভেন্টরি' : '📦 Inventory',
              icon: <Package className="w-5 h-5" />,
              color: 'amber',
              articles: [
                { 
                  title: lang === 'bn' ? 'প্রোডাক্ট যোগ' : 'Adding Products', 
                  desc: lang === 'bn' 
                    ? 'ইনভেন্টরি → প্রোডাক্ট যোগ করুন → নাম, SKU, ক্যাটাগরি, ক্রয়/বিক্রয় মূল্য, স্টক পূরণ করুন → সংরক্ষণ করুন'
                    : 'Inventory → Add Product → Fill name, SKU, category, buy/sell price, stock → Save' 
                },
                { 
                  title: lang === 'bn' ? 'স্টক ম্যানেজমেন্ট' : 'Stock Management', 
                  desc: lang === 'bn' 
                    ? 'লো স্টক অ্যালার্ট: মিনিমাম স্টক সেট করুন → স্টক কম হলে অটোমেটিক এলার্ট পাবেন → পারচেজ দিয়ে স্টক বাড়ান'
                    : 'Low Stock Alert: Set minimum stock → Get auto alerts when low → Increase stock via Purchase' 
                },
                { 
                  title: lang === 'bn' ? 'ক্যাটাগরি সেটআপ' : 'Categories Setup', 
                  desc: lang === 'bn' 
                    ? 'ইনভেন্টরি → ক্যাটাগরি ম্যানেজ → নতুন ক্যাটাগরি যোগ করুন → প্রোডাক্ট যোগের সময় সিলেক্ট করুন'
                    : 'Inventory → Manage Categories → Add new category → Select when adding products' 
                },
              ]
            },
            {
              title: lang === 'bn' ? '🛒 সেলস' : '🛒 Sales',
              icon: <ShoppingCart className="w-5 h-5" />,
              color: 'green',
              articles: [
                { 
                  title: lang === 'bn' ? 'POS ব্যবহার' : 'Using POS', 
                  desc: lang === 'bn' 
                    ? 'স্ট্যান্ডার্ড POS: প্রোডাক্ট সার্চ করুন → কার্টে যোগ করুন → কাস্টমার সিলেক্ট → পেমেন্ট ও রসিদ'
                    : 'Standard POS: Search products → Add to cart → Select customer → Payment & receipt' 
                },
                { 
                  title: lang === 'bn' ? 'স্ক্যানার POS' : 'Scanner POS', 
                  desc: lang === 'bn' 
                    ? 'বারকোড স্ক্যানার ব্যবহার করুন → স্ক্যান করুন → অটো কার্টে যোগ → দ্রুত চেকআউট'
                    : 'Use barcode scanner → Scan products → Auto add to cart → Quick checkout' 
                },
                { 
                  title: lang === 'bn' ? 'পেমেন্ট মেথড' : 'Payment Methods', 
                  desc: lang === 'bn' 
                    ? 'ক্যাশ, কার্ড, বিকাশ, নগদ, ব্যাংক ট্রান্সফার - যেকোনো পদ্ধতিতে পেমেন্ট নিন এবং ডিউ ট্র্যাক করুন'
                    : 'Cash, Card, bKash, Nagad, Bank Transfer - Accept any payment method & track dues' 
                },
                { 
                  title: lang === 'bn' ? 'সেলস হিস্ট্রি' : 'Sales History', 
                  desc: lang === 'bn' 
                    ? 'সেলস → সব বিক্রয়ের তালিকা দেখুন → ফিল্টার করুন → ডিটেইলস দেখুন → প্রিন্ট বা ডিলিট করুন'
                    : 'Sales → View all sales records → Filter → View details → Print or delete' 
                },
              ]
            },
            {
              title: lang === 'bn' ? '📊 রিপোর্টস' : '📊 Reports',
              icon: <BarChart3 className="w-5 h-5" />,
              color: 'purple',
              articles: [
                { 
                  title: lang === 'bn' ? 'ডেইলি রিপোর্ট' : 'Daily Reports', 
                  desc: lang === 'bn' 
                    ? 'রিপোর্টস → আজকের বিক্রয়, আয়, খরচ, লাভের সামারি দেখুন - এক নজরে সব'
                    : 'Reports → View today\'s sales, income, expenses, profit summary - all at a glance' 
                },
                { 
                  title: lang === 'bn' ? 'প্রফিট রিপোর্ট' : 'Profit Reports', 
                  desc: lang === 'bn' 
                    ? 'রিপোর্টস → প্রফিট অ্যান্ড লস → তারিখ সিলেক্ট করুন → বিক্রয় বনাম খরচ বিশ্লেষণ করুন'
                    : 'Reports → Profit & Loss → Select date range → Analyze sales vs expenses' 
                },
                { 
                  title: lang === 'bn' ? 'স্টক রিপোর্ট' : 'Stock Reports', 
                  desc: lang === 'bn' 
                    ? 'ইনভেন্টরি ভ্যালু, লো স্টক, ডেড স্টক, ফাস্ট মুভিং প্রোডাক্ট - সব রিপোর্ট পাবেন ড্যাশবোর্ডে'
                    : 'Inventory value, low stock, dead stock, fast moving products - all in Dashboard' 
                },
              ]
            },
            {
              title: lang === 'bn' ? '⚙️ সেটিংস' : '⚙️ Settings',
              icon: <Settings className="w-5 h-5" />,
              color: 'blue',
              articles: [
                { 
                  title: lang === 'bn' ? 'শপ প্রোফাইল' : 'Shop Profile', 
                  desc: lang === 'bn' 
                    ? 'সেটিংস → শপ প্রোফাইল → লোগো, নাম, ঠিকানা, ফোন, ইমেইল সেট করুন → লোডিং স্ক্রিনে দেখাবে'
                    : 'Settings → Shop Profile → Set logo, name, address, phone, email → Shows on loading screen' 
                },
                { 
                  title: lang === 'bn' ? 'ব্যাকআপ ও রিস্টোর' : 'Backup & Restore', 
                  desc: lang === 'bn' 
                    ? 'সেটিংস → ব্যাকআপ → গুগল ড্রাইভ কানেক্ট করুন → ব্যাকআপ নিন → প্রয়োজনে রিস্টোর করুন'
                    : 'Settings → Backup → Connect Google Drive → Take backup → Restore when needed' 
                },
                { 
                  title: lang === 'bn' ? 'প্রিন্ট টেমপ্লেট' : 'Print Templates', 
                  desc: lang === 'bn' 
                    ? 'সেটিংস → প্রিন্ট টেমপ্লেট → কাস্টমাইজ করুন → লোগো, ঠিকানা, ফুটার সেট করুন'
                    : 'Settings → Print Templates → Customize → Set logo, address, footer' 
                },
              ]
            },
          ].map((section, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className={`p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100`}>
                <h3 className="text-lg font-bold text-slate-900">
                  {section.title}
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {section.articles.map((article, aIdx) => (
                  <div
                    key={aIdx}
                    className="p-5 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0">
                        {aIdx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 mb-1">{article.title}</p>
                        <p className="text-slate-600 text-sm leading-relaxed">{article.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
            <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-600" />
              {lang === 'bn' ? '💡 দ্রুত টিপস' : '💡 Quick Tips'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/70 rounded-xl p-4">
                <p className="font-medium text-slate-800 mb-1">{lang === 'bn' ? '🔄 দ্রুত সেল' : '🔄 Quick Sale'}</p>
                <p className="text-slate-600 text-sm">{lang === 'bn' ? 'Scanner POS ব্যবহার করুন দ্রুত বিক্রয়ের জন্য' : 'Use Scanner POS for faster checkout'}</p>
              </div>
              <div className="bg-white/70 rounded-xl p-4">
                <p className="font-medium text-slate-800 mb-1">{lang === 'bn' ? '📱 মোবাইল ফ্রেন্ডলি' : '📱 Mobile Friendly'}</p>
                <p className="text-slate-600 text-sm">{lang === 'bn' ? 'যেকোনো ডিভাইসে ব্যবহার করুন' : 'Works on any device'}</p>
              </div>
              <div className="bg-white/70 rounded-xl p-4">
                <p className="font-medium text-slate-800 mb-1">{lang === 'bn' ? '📊 রিয়েল টাইম রিপোর্ট' : '📊 Real-time Reports'}</p>
                <p className="text-slate-600 text-sm">{lang === 'bn' ? 'লাইভ সেলস ও প্রফিট ট্র্যাকিং' : 'Live sales & profit tracking'}</p>
              </div>
              <div className="bg-white/70 rounded-xl p-4">
                <p className="font-medium text-slate-800 mb-1">{lang === 'bn' ? '🔒 সিকিউর' : '🔒 Secure'}</p>
                <p className="text-slate-600 text-sm">{lang === 'bn' ? 'সুরক্ষিত ক্লাউড ডাটাবেস' : 'Secure cloud database'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
