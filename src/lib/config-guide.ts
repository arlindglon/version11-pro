/**
 * ================================================
 * 📋 CONFIGURATION GUIDE
 * ================================================
 * 
 * এই ফাইলে সব Configuration Keys এবং তাদের ব্যবহারের গাইড আছে।
 * 
 * 🔧 Configuration কোথা থেকে করবেন?
 * 1. Settings → Configuration Tab (Master Admin Only)
 * 2. `/src/lib/config.ts` ফাইলে default value পরিবর্তন
 * 
 * 📊 Priority: Database Value > config.ts Default
 * ================================================
 */

// ============================================
// APP CONFIG KEYS (app_config table)
// ============================================

export const CONFIG_KEYS = {
  // ==========================================
  // 🌐 APP SETTINGS
  // ==========================================
  app: {
    app_name: {
      key: 'app_name',
      label: 'App Name',
      labelBn: 'অ্যাপের নাম',
      description: 'Application display name shown in header, footer, and title',
      descriptionBn: 'হেডার, ফুটার এবং টাইটেলে দেখানো অ্যাপের নাম',
      defaultValue: 'Dokan POS Pro',
      category: 'app',
      type: 'text',
      required: true,
    },
    app_version: {
      key: 'app_version',
      label: 'App Version',
      labelBn: 'অ্যাপ ভার্সন',
      description: 'Version number displayed in system info',
      descriptionBn: 'সিস্টেম তথ্যে দেখানো ভার্সন নম্বর',
      defaultValue: 'v6.1.0',
      category: 'app',
      type: 'text',
    },
    release_year: {
      key: 'release_year',
      label: 'Release Year',
      labelBn: 'রিলিজ ইয়ার',
      description: 'Copyright year shown in footer',
      descriptionBn: 'ফুটারে দেখানো কপিরাইট ইয়ার',
      defaultValue: '2024',
      category: 'app',
      type: 'text',
    },
    production_domain: {
      key: 'production_domain',
      label: 'Production Domain',
      labelBn: 'প্রোডাকশন ডোমেইন',
      description: 'Main production domain URL',
      descriptionBn: 'মূল প্রোডাকশন ডোমেইন URL',
      defaultValue: 'https://shopv9.vercel.app',
      category: 'app',
      type: 'url',
    },
  },

  // ==========================================
  // 🔐 SUPABASE DATABASE
  // ==========================================
  supabase: {
    supabase_url: {
      key: 'supabase_url',
      label: 'Supabase URL',
      labelBn: 'সুপাবেস URL',
      description: 'Supabase project URL',
      descriptionBn: 'সুপাবেস প্রজেক্ট URL',
      defaultValue: '',
      category: 'supabase',
      type: 'url',
      required: true,
      sensitive: true,
    },
    supabase_anon_key: {
      key: 'supabase_anon_key',
      label: 'Supabase Anon Key',
      labelBn: 'সুপাবেস অ্যানন কী',
      description: 'Supabase anonymous/public key',
      descriptionBn: 'সুপাবেস পাবলিক কী',
      defaultValue: '',
      category: 'supabase',
      type: 'text',
      required: true,
      sensitive: true,
    },
  },

  // ==========================================
  // 🔗 GOOGLE DRIVE (Backup)
  // ==========================================
  google: {
    google_client_id: {
      key: 'google_client_id',
      label: 'Google Client ID',
      labelBn: 'গুগল ক্লায়েন্ট ID',
      description: 'Google OAuth Client ID for Drive backup',
      descriptionBn: 'ড্রাইভ ব্যাকআপের জন্য গুগল OAuth ক্লায়েন্ট ID',
      defaultValue: '',
      category: 'google',
      type: 'text',
      sensitive: true,
    },
    google_client_secret: {
      key: 'google_client_secret',
      label: 'Google Client Secret',
      labelBn: 'গুগল ক্লায়েন্ট সিক্রেট',
      description: 'Google OAuth Client Secret',
      descriptionBn: 'গুগল OAuth ক্লায়েন্ট সিক্রেট',
      defaultValue: '',
      category: 'google',
      type: 'text',
      sensitive: true,
    },
    google_redirect_uri: {
      key: 'google_redirect_uri',
      label: 'Google Redirect URI',
      labelBn: 'গুগল রিডাইরেক্ট URI',
      description: 'OAuth callback URL for Google authentication',
      descriptionBn: 'গুগল অথেন্টিকেশনের কলব্যাক URL',
      defaultValue: '',
      category: 'google',
      type: 'url',
      sensitive: true,
    },
  },

  // ==========================================
  // 💬 SUPPORT SETTINGS
  // ==========================================
  support: {
    support_email: {
      key: 'support_email',
      label: 'Support Email',
      labelBn: 'সাপোর্ট ইমেইল',
      description: 'Support contact email address',
      descriptionBn: 'সাপোর্ট যোগাযোগের ইমেইল',
      defaultValue: '',
      category: 'support',
      type: 'email',
    },
    support_phone: {
      key: 'support_phone',
      label: 'Support Phone',
      labelBn: 'সাপোর্ট ফোন',
      description: 'Support contact phone number',
      descriptionBn: 'সাপোর্ট যোগাযোগের ফোন নম্বর',
      defaultValue: '',
      category: 'support',
      type: 'tel',
    },
    support_address: {
      key: 'support_address',
      label: 'Support Address',
      labelBn: 'সাপোর্ট ঠিকানা',
      description: 'Support office address',
      descriptionBn: 'সাপোর্ট অফিসের ঠিকানা',
      defaultValue: '',
      category: 'support',
      type: 'textarea',
    },
    support_hours: {
      key: 'support_hours',
      label: 'Support Hours',
      labelBn: 'সাপোর্ট সময়',
      description: 'Support availability hours',
      descriptionBn: 'সাপোর্ট সেবার সময়',
      defaultValue: '24/7 Support',
      category: 'support',
      type: 'text',
    },
    support_facebook: {
      key: 'support_facebook',
      label: 'Support Facebook',
      labelBn: 'সাপোর্ট ফেসবুক',
      description: 'Facebook page URL for support',
      descriptionBn: 'সাপোর্টের ফেসবুক পেজ URL',
      defaultValue: '',
      category: 'support',
      type: 'url',
    },
    support_whatsapp: {
      key: 'support_whatsapp',
      label: 'Support WhatsApp',
      labelBn: 'সাপোর্ট হোয়াটসঅ্যাপ',
      description: 'WhatsApp number for support',
      descriptionBn: 'সাপোর্টের হোয়াটসঅ্যাপ নম্বর',
      defaultValue: '',
      category: 'support',
      type: 'tel',
    },
    support_youtube: {
      key: 'support_youtube',
      label: 'Support YouTube',
      labelBn: 'সাপোর্ট ইউটিউব',
      description: 'YouTube channel URL for tutorials',
      descriptionBn: 'টিউটোরিয়ালের ইউটিউব চ্যানেল URL',
      defaultValue: '',
      category: 'support',
      type: 'url',
    },
    support_tutorials: {
      key: 'support_tutorials',
      label: 'Video Tutorials',
      labelBn: 'ভিডিও টিউটোরিয়াল',
      description: 'JSON array of tutorial videos',
      descriptionBn: 'টিউটোরিয়াল ভিডিওর JSON অ্যারে',
      defaultValue: '[]',
      category: 'support',
      type: 'json',
    },
    support_faqs: {
      key: 'support_faqs',
      label: 'FAQs',
      labelBn: 'FAQ',
      description: 'JSON array of FAQ items',
      descriptionBn: 'FAQ আইটেমের JSON অ্যারে',
      defaultValue: '[]',
      category: 'support',
      type: 'json',
    },
    tutorial_categories: {
      key: 'tutorial_categories',
      label: 'Tutorial Categories',
      labelBn: 'টিউটোরিয়াল ক্যাটাগরি',
      description: 'JSON array of tutorial categories',
      descriptionBn: 'টিউটোরিয়াল ক্যাটাগরির JSON অ্যারে',
      defaultValue: '[]',
      category: 'support',
      type: 'json',
    },
    faq_categories: {
      key: 'faq_categories',
      label: 'FAQ Categories',
      labelBn: 'FAQ ক্যাটাগরি',
      description: 'JSON array of FAQ categories',
      descriptionBn: 'FAQ ক্যাটাগরির JSON অ্যারে',
      defaultValue: '[]',
      category: 'support',
      type: 'json',
    },
  },

  // ==========================================
  // 👨‍💻 DEVELOPER INFO
  // ==========================================
  developer: {
    developer_name: {
      key: 'developer_name',
      label: 'Developer Name',
      labelBn: 'ডেভেলপার নাম',
      description: 'Developer/Company name shown in footer',
      descriptionBn: 'ফুটারে দেখানো ডেভেলপার/কোম্পানির নাম',
      defaultValue: 'Dokan Team',
      category: 'developer',
      type: 'text',
    },
    developer_website: {
      key: 'developer_website',
      label: 'Developer Website',
      labelBn: 'ডেভেলপার ওয়েবসাইট',
      description: 'Developer website URL',
      descriptionBn: 'ডেভেলপার ওয়েবসাইট URL',
      defaultValue: '',
      category: 'developer',
      type: 'url',
    },
    developer_email: {
      key: 'developer_email',
      label: 'Developer Email',
      labelBn: 'ডেভেলপার ইমেইল',
      description: 'Developer contact email',
      descriptionBn: 'ডেভেলপার যোগাযোগের ইমেইল',
      defaultValue: '',
      category: 'developer',
      type: 'email',
    },
  },

  // ==========================================
  // 🦶 FOOTER SETTINGS
  // ==========================================
  footer: {
    footer_show_developer_credit: {
      key: 'footer_show_developer_credit',
      label: 'Show Developer Credit',
      labelBn: 'ডেভেলপার ক্রেডিট দেখান',
      description: 'Show/hide developer credit in footer',
      descriptionBn: 'ফুটারে ডেভেলপার ক্রেডিট দেখান/লুকান',
      defaultValue: 'true',
      category: 'footer',
      type: 'boolean',
    },
    footer_custom_text: {
      key: 'footer_custom_text',
      label: 'Custom Footer Text',
      labelBn: 'কাস্টম ফুটার টেক্সট',
      description: 'Custom text to display in footer',
      descriptionBn: 'ফুটারে দেখানোর জন্য কাস্টম টেক্সট',
      defaultValue: '',
      category: 'footer',
      type: 'textarea',
    },
  },
};

// Flatten all keys for easy access
export const ALL_CONFIG_KEYS = Object.values(CONFIG_KEYS).flatMap(category => 
  Object.values(category)
);

// Get keys by category
export const getKeysByCategory = (category: string) => {
  return ALL_CONFIG_KEYS.filter(key => key.category === category);
};

// Categories list
export const CONFIG_CATEGORIES = [
  { id: 'app', label: 'App Settings', labelBn: 'অ্যাপ সেটিংস', icon: 'Globe' },
  { id: 'supabase', label: 'Database', labelBn: 'ডাটাবেস', icon: 'Database' },
  { id: 'google', label: 'Google Drive', labelBn: 'গুগল ড্রাইভ', icon: 'Cloud' },
  { id: 'support', label: 'Support', labelBn: 'সাপোর্ট', icon: 'HelpCircle' },
  { id: 'developer', label: 'Developer', labelBn: 'ডেভেলপার', icon: 'Code' },
  { id: 'footer', label: 'Footer', labelBn: 'ফুটার', icon: 'Layout' },
];

// ============================================
// VIDEO TUTORIAL FORMAT
// ============================================
export const TUTORIAL_FORMAT = {
  id: 'string (unique)',
  title: 'string',
  description: 'string',
  videoUrl: 'string (YouTube, Vimeo, Facebook, Direct video URL)',
  thumbnail: 'string (optional, auto-generated from URL)',
  category: 'string (must match category id)',
  duration: 'string (optional, e.g., "5:30")',
  order: 'number',
};

export const TUTORIAL_EXAMPLE = {
  id: 'abc123',
  title: 'Getting Started with POS',
  description: 'Learn how to make your first sale',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  category: 'basics',
  duration: '5:30',
  order: 1,
};

// ============================================
// FAQ FORMAT
// ============================================
export const FAQ_FORMAT = {
  id: 'string (unique)',
  question: 'string',
  answer: 'string',
  category: 'string (must match category id)',
  order: 'number',
};

export const FAQ_EXAMPLE = {
  id: 'faq1',
  question: 'How do I add a new product?',
  answer: 'Go to Inventory → Click "Add Product" → Fill details → Save',
  category: 'inventory',
  order: 1,
};

// ============================================
// CATEGORY FORMAT
// ============================================
export const TUTORIAL_CATEGORY_FORMAT = {
  id: 'string (unique, lowercase)',
  label: 'string (English)',
  labelBn: 'string (Bangla)',
  icon: 'string (Lucide icon name)',
  order: 'number',
};

export const TUTORIAL_CATEGORY_EXAMPLE = {
  id: 'basics',
  label: 'Basics',
  labelBn: 'বেসিক',
  icon: 'Zap',
  order: 1,
};

export default CONFIG_KEYS;
