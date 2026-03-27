import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Globe, Database, Cloud, HelpCircle, Code, Layout,
  ChevronDown, ChevronUp, Copy, Check, Search, Info,
  AlertCircle, Eye, EyeOff, Key, FileJson, ToggleLeft, ToggleRight
} from 'lucide-react';
import { CONFIG_KEYS, CONFIG_CATEGORIES, ALL_CONFIG_KEYS } from '@/lib/config-guide';

// ============================================
// CONFIGURATION GUIDE COMPONENT
// ============================================
// Shows all config keys with descriptions, types, defaults
// Master Admin can view all configurations here

const ConfigurationGuide: React.FC = () => {
  const { lang } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Get category icon
  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Globe': <Globe className="w-5 h-5" />,
      'Database': <Database className="w-5 h-5" />,
      'Cloud': <Cloud className="w-5 h-5" />,
      'HelpCircle': <HelpCircle className="w-5 h-5" />,
      'Code': <Code className="w-5 h-5" />,
      'Layout': <Layout className="w-5 h-5" />,
    };
    return icons[iconName] || <Info className="w-5 h-5" />;
  };

  // Get type icon and color
  const getTypeInfo = (type: string) => {
    const types: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
      'text': { icon: <Key className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700', label: 'Text' },
      'url': { icon: <Globe className="w-4 h-4" />, color: 'bg-cyan-100 text-cyan-700', label: 'URL' },
      'email': { icon: <Key className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700', label: 'Email' },
      'tel': { icon: <Key className="w-4 h-4" />, color: 'bg-green-100 text-green-700', label: 'Phone' },
      'textarea': { icon: <FileJson className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700', label: 'Text Area' },
      'json': { icon: <FileJson className="w-4 h-4" />, color: 'bg-rose-100 text-rose-700', label: 'JSON' },
      'boolean': { icon: <ToggleRight className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-700', label: 'Boolean' },
    };
    return types[type] || types['text'];
  };

  // Copy key to clipboard
  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filter keys
  const filteredKeys = ALL_CONFIG_KEYS.filter(config => {
    const matchesCategory = selectedCategory === 'all' || config.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      config.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.labelBn.includes(searchQuery) ||
      config.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.descriptionBn.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Code className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {lang === 'bn' ? 'কনফিগারেশন গাইড' : 'Configuration Guide'}
            </h2>
            <p className="text-slate-400 text-sm">
              {lang === 'bn' 
                ? 'সব কনফিগারেশন কী, তাদের টাইপ এবং ব্যবহারের বিস্তারিত'
                : 'All configuration keys, their types and usage details'}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'bn' ? 'কী সার্চ করুন...' : 'Search keys...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-amber-500 outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {lang === 'bn' ? 'সব' : 'All'}
          </button>
          {CONFIG_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {getCategoryIcon(cat.icon)}
              {lang === 'bn' ? cat.labelBn : cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CONFIG_CATEGORIES.map((cat) => {
          const count = ALL_CONFIG_KEYS.filter(k => k.category === cat.id).length;
          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="bg-white rounded-xl p-4 border border-slate-200 cursor-pointer hover:border-amber-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                  {getCategoryIcon(cat.icon)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{lang === 'bn' ? cat.labelBn : cat.label}</p>
                  <p className="text-slate-500 text-sm">{count} {lang === 'bn' ? 'কী' : 'keys'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Keys List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">
              {lang === 'bn' ? 'কনফিগারেশন কী তালিকা' : 'Configuration Keys List'}
            </h3>
            <span className="text-sm text-slate-500">
              {filteredKeys.length} {lang === 'bn' ? 'টি কী' : 'keys'}
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredKeys.map((config) => {
            const typeInfo = getTypeInfo(config.type);
            const isExpanded = expandedKey === config.key;

            return (
              <div key={config.key} className="p-4 hover:bg-slate-50 transition-all">
                <div 
                  className="flex items-start justify-between gap-4 cursor-pointer"
                  onClick={() => setExpandedKey(isExpanded ? null : config.key)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      {/* Key Name */}
                      <code className="px-3 py-1 bg-slate-900 text-amber-400 rounded-lg text-sm font-mono">
                        {config.key}
                      </code>
                      
                      {/* Category Badge */}
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-medium">
                        {getCategoryIcon(CONFIG_CATEGORIES.find(c => c.id === config.category)?.icon || 'Info')}
                        {lang === 'bn' 
                          ? CONFIG_CATEGORIES.find(c => c.id === config.category)?.labelBn 
                          : CONFIG_CATEGORIES.find(c => c.id === config.category)?.label}
                      </span>
                      
                      {/* Type Badge */}
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.icon}
                        {typeInfo.label}
                      </span>

                      {/* Required Badge */}
                      {config.required && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          {lang === 'bn' ? 'আবশ্যক' : 'Required'}
                        </span>
                      )}

                      {/* Sensitive Badge */}
                      {config.sensitive && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-200 rounded-lg text-xs font-medium">
                          <EyeOff className="w-3 h-3" />
                          {lang === 'bn' ? 'সংবেদনশীল' : 'Sensitive'}
                        </span>
                      )}
                    </div>

                    {/* Labels */}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">{config.label}</span>
                      <span className="text-slate-500 text-sm">({config.labelBn})</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(config.key);
                      }}
                      className="p-2 text-slate-400 hover:text-amber-600 transition-all"
                      title={lang === 'bn' ? 'কপি করুন' : 'Copy key'}
                    >
                      {copiedKey === config.key ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                    {/* Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-400 mb-1">
                          {lang === 'bn' ? 'বিবরণ (ইংরেজি)' : 'Description (English)'}
                        </p>
                        <p className="text-slate-700">{config.description}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-400 mb-1">
                          {lang === 'bn' ? 'বিবরণ (বাংলা)' : 'Description (Bangla)'}
                        </p>
                        <p className="text-slate-700">{config.descriptionBn}</p>
                      </div>
                    </div>

                    {/* Default Value */}
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400 mb-1">
                        {lang === 'bn' ? 'ডিফল্ট মান' : 'Default Value'}
                      </p>
                      <code className="block p-3 bg-slate-100 rounded-lg text-slate-700 font-mono text-sm">
                        {config.defaultValue || <span className="text-slate-400 italic">empty</span>}
                      </code>
                    </div>

                    {/* Usage Example */}
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400 mb-1">
                        {lang === 'bn' ? 'ব্যবহার' : 'Usage'}
                      </p>
                      <div className="p-3 bg-slate-900 rounded-lg overflow-x-auto">
                        <code className="text-sm text-emerald-400 font-mono">
                          {`// ${lang === 'bn' ? 'Database থেকে পড়ুন' : 'Read from Database'}`}
                          <br />
                          {`const { data } = await supabase`}
                          <br />
                          {`  .from('app_config')`}
                          <br />
                          {`  .select('value')`}
                          <br />
                          {`  .eq('key', '${config.key}')`}
                          <br />
                          {`  .single();`}
                        </code>
                      </div>
                    </div>

                    {/* API Endpoint */}
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400 mb-1">
                        {lang === 'bn' ? 'API Endpoint' : 'API Endpoint'}
                      </p>
                      <code className="block p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-mono">
                        GET /api/config?key={config.key}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredKeys.length === 0 && (
          <div className="p-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              {lang === 'bn' ? 'কোনো কী পাওয়া যায়নি' : 'No keys found'}
            </p>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">
              {lang === 'bn' ? 'গুরুত্বপূর্ণ নোট' : 'Important Note'}
            </p>
            <p className="text-amber-700 text-sm mt-1">
              {lang === 'bn' 
                ? 'এই কীগুলো Settings → Configuration ট্যাব থেকে বা সরাসরি database-এ পরিবর্তন করা যায়। ডাটাবেসে থাকা মান config.ts ফাইলের ডিফল্ট মানের চেয়ে বেশি priority পাবে।'
                : 'These keys can be changed from Settings → Configuration tab or directly in the database. Database values take priority over config.ts defaults.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationGuide;
