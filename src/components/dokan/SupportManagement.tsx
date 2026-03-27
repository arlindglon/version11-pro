import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Video, HelpCircle, Plus, Edit, Trash2, Save, X, Youtube,
  GripVertical, Play, ExternalLink, Check, AlertCircle, Link,
  Youtube as YoutubeIcon, Tv, Facebook, FileVideo, Globe
} from 'lucide-react';
import { isValidVideoUrl, getVideoInfo, getPlatformName, VideoInfo } from '@/lib/video-utils';

// ============================================
// INTERFACES
// ============================================
interface TutorialCategory {
  id: string;
  label: string;
  labelBn: string;
  icon: string;
  order: number;
}

interface FAQCategory {
  id: string;
  label: string;
  labelBn: string;
  order: number;
}

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail?: string;
  category: string;
  duration?: string;
  order: number;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

interface SupportSettingsData {
  supportEmail: string;
  supportPhone: string;
  supportAddress: string;
  supportHours: string;
  supportFacebook: string;
  supportWhatsapp: string;
  supportYoutube: string;
  tutorials: VideoTutorial[];
  faqs: FAQItem[];
  tutorialCategories: TutorialCategory[];
  faqCategories: FAQCategory[];
  developerName: string;
  developerWebsite: string;
  developerEmail: string;
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

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// ============================================
// SUPPORT MANAGEMENT COMPONENT
// ============================================
interface Props {
  // None - this is a self-contained component
}

const SupportManagement: React.FC<Props> = () => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'tutorials' | 'faqs' | 'categories' | 'contact'>('tutorials');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Data
  const [settings, setSettings] = useState<SupportSettingsData>({
    supportEmail: '',
    supportPhone: '',
    supportAddress: '',
    supportHours: '',
    supportFacebook: '',
    supportWhatsapp: '',
    supportYoutube: '',
    tutorials: [],
    faqs: [],
    tutorialCategories: DEFAULT_TUTORIAL_CATEGORIES,
    faqCategories: DEFAULT_FAQ_CATEGORIES,
    developerName: 'Dokan Team',
    developerWebsite: '',
    developerEmail: '',
  });
  
  // Editing state
  const [editingTutorial, setEditingTutorial] = useState<VideoTutorial | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [editingTutorialCategory, setEditingTutorialCategory] = useState<TutorialCategory | null>(null);
  const [editingFaqCategory, setEditingFaqCategory] = useState<FAQCategory | null>(null);
  
  // Video URL preview
  const [videoPreview, setVideoPreview] = useState<VideoInfo | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/support-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          supportEmail: data.supportEmail || '',
          supportPhone: data.supportPhone || '',
          supportAddress: data.supportAddress || '',
          supportHours: data.supportHours || '',
          supportFacebook: data.supportFacebook || '',
          supportWhatsapp: data.supportWhatsapp || '',
          supportYoutube: data.supportYoutube || '',
          tutorials: data.tutorials || [],
          faqs: data.faqs || [],
          tutorialCategories: data.tutorialCategories?.length > 0 ? data.tutorialCategories : DEFAULT_TUTORIAL_CATEGORIES,
          faqCategories: data.faqCategories?.length > 0 ? data.faqCategories : DEFAULT_FAQ_CATEGORIES,
          developerName: data.developerName || 'Dokan Team',
          developerWebsite: data.developerWebsite || '',
          developerEmail: data.developerEmail || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch support settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/support-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save support settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Video URL change handler with auto-preview
  const handleVideoUrlChange = (url: string) => {
    setEditingTutorial(prev => prev ? { ...prev, videoUrl: url } : null);
    if (url && isValidVideoUrl(url)) {
      setVideoPreview(getVideoInfo(url));
    } else {
      setVideoPreview(null);
    }
  };

  // Get platform icon
  const getPlatformIcon = (platform: VideoInfo['platform']) => {
    switch (platform) {
      case 'youtube': return <YoutubeIcon className="w-4 h-4 text-red-600" />;
      case 'vimeo': return <Tv className="w-4 h-4 text-blue-500" />;
      case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'direct': return <FileVideo className="w-4 h-4 text-emerald-600" />;
      default: return <Globe className="w-4 h-4 text-slate-500" />;
    }
  };

  // Tutorial CRUD
  const addTutorial = () => {
    const newTutorial: VideoTutorial = {
      id: generateId(),
      title: '',
      description: '',
      videoUrl: '',
      category: 'basics',
      order: settings.tutorials.length + 1,
    };
    setEditingTutorial(newTutorial);
    setVideoPreview(null);
  };

  const saveTutorial = () => {
    if (!editingTutorial) return;
    if (!editingTutorial.title || !editingTutorial.videoUrl) {
      alert(lang === 'bn' ? 'টাইটেল এবং ভিডিও URL প্রয়োজন' : 'Title and Video URL are required');
      return;
    }

    const existingIndex = settings.tutorials.findIndex(t => t.id === editingTutorial.id);
    if (existingIndex >= 0) {
      const updated = [...settings.tutorials];
      updated[existingIndex] = editingTutorial;
      setSettings({ ...settings, tutorials: updated });
    } else {
      setSettings({ ...settings, tutorials: [...settings.tutorials, editingTutorial] });
    }
    setEditingTutorial(null);
    setVideoPreview(null);
  };

  const deleteTutorial = (id: string) => {
    if (confirm(lang === 'bn' ? 'এই টিউটোরিয়াল মুছে ফেলতে চান?' : 'Delete this tutorial?')) {
      setSettings({ ...settings, tutorials: settings.tutorials.filter(t => t.id !== id) });
    }
  };

  // FAQ CRUD
  const addFaq = () => {
    const newFaq: FAQItem = {
      id: generateId(),
      question: '',
      answer: '',
      category: 'general',
      order: settings.faqs.length + 1,
    };
    setEditingFaq(newFaq);
  };

  const saveFaq = () => {
    if (!editingFaq) return;
    if (!editingFaq.question || !editingFaq.answer) {
      alert(lang === 'bn' ? 'প্রশ্ন এবং উত্তর প্রয়োজন' : 'Question and Answer are required');
      return;
    }

    const existingIndex = settings.faqs.findIndex(f => f.id === editingFaq.id);
    if (existingIndex >= 0) {
      const updated = [...settings.faqs];
      updated[existingIndex] = editingFaq;
      setSettings({ ...settings, faqs: updated });
    } else {
      setSettings({ ...settings, faqs: [...settings.faqs, editingFaq] });
    }
    setEditingFaq(null);
  };

  const deleteFaq = (id: string) => {
    if (confirm(lang === 'bn' ? 'এই প্রশ্ন মুছে ফেলতে চান?' : 'Delete this question?')) {
      setSettings({ ...settings, faqs: settings.faqs.filter(f => f.id !== id) });
    }
  };

  // Category CRUD
  const addTutorialCategory = () => {
    const newCat: TutorialCategory = {
      id: generateId(),
      label: '',
      labelBn: '',
      icon: 'BookOpen',
      order: settings.tutorialCategories.length,
    };
    setEditingTutorialCategory(newCat);
  };

  const saveTutorialCategory = () => {
    if (!editingTutorialCategory) return;
    if (!editingTutorialCategory.label || !editingTutorialCategory.labelBn) {
      alert(lang === 'bn' ? 'ইংরেজি এবং বাংলা লেবেল প্রয়োজন' : 'English and Bangla labels are required');
      return;
    }

    const existingIndex = settings.tutorialCategories.findIndex(c => c.id === editingTutorialCategory.id);
    if (existingIndex >= 0) {
      const updated = [...settings.tutorialCategories];
      updated[existingIndex] = editingTutorialCategory;
      setSettings({ ...settings, tutorialCategories: updated });
    } else {
      setSettings({ ...settings, tutorialCategories: [...settings.tutorialCategories, editingTutorialCategory] });
    }
    setEditingTutorialCategory(null);
  };

  const deleteTutorialCategory = (id: string) => {
    if (id === 'all') {
      alert(lang === 'bn' ? '"সব" ক্যাটাগরি মুছে ফেলা যাবে না' : 'Cannot delete "All" category');
      return;
    }
    if (confirm(lang === 'bn' ? 'এই ক্যাটাগরি মুছে ফেলতে চান?' : 'Delete this category?')) {
      setSettings({ ...settings, tutorialCategories: settings.tutorialCategories.filter(c => c.id !== id) });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {lang === 'bn' ? 'সাপোর্ট ম্যানেজমেন্ট' : 'Support Management'}
          </h2>
          <p className="text-slate-500 text-sm">
            {lang === 'bn' ? 'টিউটোরিয়াল, FAQ এবং যোগাযোগের তথ্য পরিচালনা করুন' : 'Manage tutorials, FAQs, and contact information'}
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
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
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'tutorials', icon: <Video className="w-4 h-4" />, label: lang === 'bn' ? 'ভিডিও টিউটোরিয়াল' : 'Video Tutorials' },
          { id: 'faqs', icon: <HelpCircle className="w-4 h-4" />, label: lang === 'bn' ? 'FAQ' : 'FAQ' },
          { id: 'categories', icon: <GripVertical className="w-4 h-4" />, label: lang === 'bn' ? 'ক্যাটাগরি' : 'Categories' },
          { id: 'contact', icon: <Link className="w-4 h-4" />, label: lang === 'bn' ? 'যোগাযোগ' : 'Contact' },
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

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Tutorials Tab */}
        {activeTab === 'tutorials' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">
                {lang === 'bn' ? 'ভিডিও টিউটোরিয়াল তালিকা' : 'Video Tutorials List'}
              </h3>
              <button
                onClick={addTutorial}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                {lang === 'bn' ? 'নতুন টিউটোরিয়াল' : 'Add Tutorial'}
              </button>
            </div>

            {/* Tutorial List */}
            <div className="space-y-3">
              {settings.tutorials.map((tutorial) => {
                const videoInfo = getVideoInfo(tutorial.videoUrl);
                return (
                  <div
                    key={tutorial.id}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    {/* Thumbnail */}
                    <div className="w-24 h-16 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={videoInfo.thumbnailUrl}
                        alt={tutorial.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(videoInfo.platform)}
                        <span className="font-semibold text-slate-900 truncate">{tutorial.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{getPlatformName(videoInfo.platform)}</span>
                        <span>•</span>
                        <span>{tutorial.category}</span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <a
                        href={tutorial.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-blue-600 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => {
                          setEditingTutorial(tutorial);
                          setVideoPreview(getVideoInfo(tutorial.videoUrl));
                        }}
                        className="p-2 text-slate-400 hover:text-emerald-600 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTutorial(tutorial.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {settings.tutorials.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{lang === 'bn' ? 'কোনো টিউটোরিয়াল নেই' : 'No tutorials yet'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FAQs Tab */}
        {activeTab === 'faqs' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">
                {lang === 'bn' ? 'FAQ তালিকা' : 'FAQ List'}
              </h3>
              <button
                onClick={addFaq}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                {lang === 'bn' ? 'নতুন প্রশ্ন' : 'Add FAQ'}
              </button>
            </div>

            <div className="space-y-3">
              {settings.faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{faq.question}</p>
                      <p className="text-slate-500 text-sm mt-1 line-clamp-2">{faq.answer}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setEditingFaq(faq)}
                        className="p-2 text-slate-400 hover:text-emerald-600 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteFaq(faq.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {settings.faqs.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{lang === 'bn' ? 'কোনো FAQ নেই' : 'No FAQs yet'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="p-6 space-y-8">
            {/* Tutorial Categories */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">
                  {lang === 'bn' ? 'টিউটোরিয়াল ক্যাটাগরি' : 'Tutorial Categories'}
                </h3>
                <button
                  onClick={addTutorialCategory}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  {lang === 'bn' ? 'নতুন ক্যাটাগরি' : 'Add Category'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {settings.tutorialCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{cat.label}</p>
                      <p className="text-slate-500 text-xs">{cat.labelBn}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingTutorialCategory(cat)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {cat.id !== 'all' && (
                        <button
                          onClick={() => deleteTutorialCategory(cat.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Categories */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">
                  {lang === 'bn' ? 'FAQ ক্যাটাগরি' : 'FAQ Categories'}
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {settings.faqCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <p className="font-semibold text-slate-900">{cat.label}</p>
                    <p className="text-slate-500 text-xs">{cat.labelBn}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900">
                  {lang === 'bn' ? 'যোগাযোগের তথ্য' : 'Contact Information'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      {lang === 'bn' ? 'সাপোর্ট ইমেইল' : 'Support Email'}
                    </label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                      placeholder="support@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      {lang === 'bn' ? 'সাপোর্ট ফোন' : 'Support Phone'}
                    </label>
                    <input
                      type="tel"
                      value={settings.supportPhone}
                      onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                      placeholder="+880 1XXX-XXXXXX"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      {lang === 'bn' ? 'সাপোর্ট সময়' : 'Support Hours'}
                    </label>
                    <input
                      type="text"
                      value={settings.supportHours}
                      onChange={(e) => setSettings({ ...settings, supportHours: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                      placeholder="24/7 Support"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">
                      {lang === 'bn' ? 'ঠিকানা' : 'Address'}
                    </label>
                    <textarea
                      value={settings.supportAddress}
                      onChange={(e) => setSettings({ ...settings, supportAddress: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900">
                  {lang === 'bn' ? 'সোশ্যাল মিডিয়া' : 'Social Media'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">Facebook</label>
                    <input
                      type="url"
                      value={settings.supportFacebook}
                      onChange={(e) => setSettings({ ...settings, supportFacebook: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={settings.supportWhatsapp}
                      onChange={(e) => setSettings({ ...settings, supportWhatsapp: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                      placeholder="+880 1XXX-XXXXXX"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 block mb-1">YouTube</label>
                    <input
                      type="url"
                      value={settings.supportYoutube}
                      onChange={(e) => setSettings({ ...settings, supportYoutube: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                      placeholder="https://youtube.com/@yourchannel"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">
                {lang === 'bn' ? 'ডেভেলপার তথ্য' : 'Developer Info'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">
                    {lang === 'bn' ? 'ডেভেলপার নাম' : 'Developer Name'}
                  </label>
                  <input
                    type="text"
                    value={settings.developerName}
                    onChange={(e) => setSettings({ ...settings, developerName: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">
                    {lang === 'bn' ? 'ডেভেলপার ওয়েবসাইট' : 'Developer Website'}
                  </label>
                  <input
                    type="url"
                    value={settings.developerWebsite}
                    onChange={(e) => setSettings({ ...settings, developerWebsite: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
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
                    onChange={(e) => setSettings({ ...settings, developerEmail: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tutorial Edit Modal */}
      {editingTutorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'bn' ? 'টিউটোরিয়াল সম্পাদনা' : 'Edit Tutorial'}
                </h3>
                <button
                  onClick={() => {
                    setEditingTutorial(null);
                    setVideoPreview(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  {lang === 'bn' ? 'টাইটেল' : 'Title'} *
                </label>
                <input
                  type="text"
                  value={editingTutorial.title}
                  onChange={(e) => setEditingTutorial({ ...editingTutorial, title: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                  placeholder={lang === 'bn' ? 'টিউটোরিয়ালের শিরোনাম' : 'Tutorial title'}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  {lang === 'bn' ? 'ভিডিও URL *' : 'Video URL *'}
                </label>
                <input
                  type="url"
                  value={editingTutorial.videoUrl}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                  placeholder="https://youtube.com/watch?v=... অথবা অন্য কোনো ভিডিও লিংক"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'bn' 
                    ? 'YouTube, Vimeo, Facebook, Dailymotion, TikTok অথবা সরাসরি ভিডিও লিংক দিন'
                    : 'Paste YouTube, Vimeo, Facebook, Dailymotion, TikTok or direct video link'}
                </p>
              </div>
              
              {/* Video Preview */}
              {videoPreview && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    {getPlatformIcon(videoPreview.platform)}
                    <span className="font-semibold text-emerald-700">
                      {getPlatformName(videoPreview.platform)} {lang === 'bn' ? 'ডিটেক্টেড' : 'Detected'}
                    </span>
                  </div>
                  {videoPreview.thumbnailUrl && (
                    <img
                      src={videoPreview.thumbnailUrl}
                      alt="Video thumbnail"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                </div>
              )}

              {!videoPreview && editingTutorial.videoUrl && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {lang === 'bn' ? 'সঠিক ভিডিও URL দিন' : 'Please enter a valid video URL'}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  {lang === 'bn' ? 'বিবরণ' : 'Description'}
                </label>
                <textarea
                  value={editingTutorial.description}
                  onChange={(e) => setEditingTutorial({ ...editingTutorial, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">
                    {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                  </label>
                  <select
                    value={editingTutorial.category}
                    onChange={(e) => setEditingTutorial({ ...editingTutorial, category: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                  >
                    {settings.tutorialCategories
                      .filter(c => c.id !== 'all')
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {lang === 'bn' ? cat.labelBn : cat.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 block mb-1">
                    {lang === 'bn' ? 'সময়কাল' : 'Duration'}
                  </label>
                  <input
                    type="text"
                    value={editingTutorial.duration || ''}
                    onChange={(e) => setEditingTutorial({ ...editingTutorial, duration: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                    placeholder="5:30"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingTutorial(null);
                  setVideoPreview(null);
                }}
                className="px-4 py-2 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={saveTutorial}
                className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all"
              >
                {lang === 'bn' ? 'সেভ করুন' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Edit Modal */}
      {editingFaq && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'bn' ? 'FAQ সম্পাদনা' : 'Edit FAQ'}
                </h3>
                <button
                  onClick={() => setEditingFaq(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  {lang === 'bn' ? 'প্রশ্ন *' : 'Question *'}
                </label>
                <input
                  type="text"
                  value={editingFaq.question}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  {lang === 'bn' ? 'উত্তর *' : 'Answer *'}
                </label>
                <textarea
                  value={editingFaq.answer}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none resize-none"
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                </label>
                <select
                  value={editingFaq.category}
                  onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                >
                  {settings.faqCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {lang === 'bn' ? cat.labelBn : cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setEditingFaq(null)}
                className="px-4 py-2 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={saveFaq}
                className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all"
              >
                {lang === 'bn' ? 'সেভ করুন' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Edit Modal */}
      {editingTutorialCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'bn' ? 'ক্যাটাগরি সম্পাদনা' : 'Edit Category'}
                </h3>
                <button
                  onClick={() => setEditingTutorialCategory(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  {lang === 'bn' ? 'ইংরেজি লেবেল' : 'English Label'}
                </label>
                <input
                  type="text"
                  value={editingTutorialCategory.label}
                  onChange={(e) => setEditingTutorialCategory({ ...editingTutorialCategory, label: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  {lang === 'bn' ? 'বাংলা লেবেল' : 'Bangla Label'}
                </label>
                <input
                  type="text"
                  value={editingTutorialCategory.labelBn}
                  onChange={(e) => setEditingTutorialCategory({ ...editingTutorialCategory, labelBn: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">
                  {lang === 'bn' ? 'আইকন' : 'Icon'}
                </label>
                <select
                  value={editingTutorialCategory.icon}
                  onChange={(e) => setEditingTutorialCategory({ ...editingTutorialCategory, icon: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none"
                >
                  <option value="BookOpen">BookOpen</option>
                  <option value="Zap">Zap</option>
                  <option value="Package">Package</option>
                  <option value="ShoppingCart">ShoppingCart</option>
                  <option value="BarChart3">BarChart3</option>
                  <option value="Settings">Settings</option>
                  <option value="Cloud">Cloud</option>
                  <option value="Users">Users</option>
                  <option value="Database">Database</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setEditingTutorialCategory(null)}
                className="px-4 py-2 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={saveTutorialCategory}
                className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all"
              >
                {lang === 'bn' ? 'সেভ করুন' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportManagement;
