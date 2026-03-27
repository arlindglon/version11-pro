'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2, Building2, ChevronDown } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code: string;
  isDefault?: boolean;
}

interface ShopSettings {
  shopName: string;
  shopLogo: string;
  shopBio: string;
}

interface LoginProps {
  onLogin: (user: { id: string; name: string; email: string; role: string; username: string; permissions?: Record<string, boolean>; branchId?: string; branchName?: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<{ id: string; name: string; email: string; role: string; username: string; permissions?: Record<string, boolean> } | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings>({ shopName: '', shopLogo: '', shopBio: '' });

  useEffect(() => {
    // Fetch branches and settings on mount
    const loadInitialData = async () => {
      try {
        // Fetch branches
        const branchesRes = await fetch('/api/branches');
        const branchesData = await branchesRes.json();
        setBranches(branchesData.data || []);
        // Set default branch
        const defaultBranch = (branchesData.data || []).find((b: Branch) => b.isDefault);
        if (defaultBranch) {
          setSelectedBranch(defaultBranch.id);
        } else if (branchesData.data?.length > 0) {
          setSelectedBranch(branchesData.data[0].id);
        }
        
        // Fetch shop settings
        const settingsRes = await fetch('/api/settings');
        const settingsData = await settingsRes.json();
        if (settingsData) {
          setShopSettings({
            shopName: settingsData.shopName || '',
            shopLogo: settingsData.shopLogo || '',
            shopBio: settingsData.shopBio || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };
    loadInitialData();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      // If multiple branches, show branch selector
      if (branches.length > 1 && !selectedBranch) {
        setLoggedInUser(data.user);
        setShowBranchSelector(true);
        setIsLoading(false);
      } else {
        // Single branch or already selected
        completeLogin(data.user, selectedBranch);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const completeLogin = (user: { id: string; name: string; email: string; role: string; username: string; permissions?: Record<string, boolean> }, branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    const userData = {
      ...user,
      branchId: branchId,
      branchName: branch?.name,
    };
    
    // Store user in localStorage
    localStorage.setItem('dokan_user', JSON.stringify(userData));
    localStorage.setItem('dokan_branch', JSON.stringify(branch));
    
    // Log login
    logLogin(user.id, branchId);
    
    onLogin(userData);
  };

  const logLogin = async (userId: string, branchId: string) => {
    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'log_login',
          userId,
          branchId,
          ipAddress: '',
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.error('Failed to log login:', error);
    }
  };

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranch(branchId);
    if (loggedInUser) {
      completeLogin(loggedInUser, branchId);
    }
  };

  // Branch Selector Screen
  if (showBranchSelector && loggedInUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Select Branch</h1>
            <p className="text-slate-400 mt-2">Welcome back, {loggedInUser.name}!</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-2">
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleBranchSelect(branch.id)}
                className="w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {branch.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{branch.name}</p>
                      <p className="text-slate-400 text-sm">{branch.code}</p>
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-white rotate-[-90deg] transition-all" />
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setShowBranchSelector(false);
              setLoggedInUser(null);
            }}
            className="w-full mt-4 py-3 text-slate-400 hover:text-white transition-all text-sm"
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          {shopSettings.shopLogo ? (
            <img 
              src={shopSettings.shopLogo} 
              alt={shopSettings.shopName || 'Shop'} 
              className="w-20 h-20 mx-auto mb-6 rounded-3xl object-contain shadow-2xl shadow-purple-500/30"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30">
              <span className="text-4xl font-black text-white">{shopSettings.shopName?.charAt(0) || 'D'}</span>
            </div>
          )}
          <h1 className="text-3xl font-black text-white tracking-tight">{shopSettings.shopName || t('app.name')}</h1>
          <p className="text-purple-300 mt-2">{shopSettings.shopBio || t('auth.login_subtitle')}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Branch Selector (if multiple branches) */}
            {branches.length > 1 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                  <Building2 className="w-3 h-3" />
                  Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full p-4 bg-slate-800/50 border-2 border-slate-700 rounded-xl outline-none focus:border-purple-500 font-medium text-white transition-all appearance-none cursor-pointer"
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Mail className="w-3 h-3" />
                {t('auth.email')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 bg-slate-800/50 border-2 border-slate-700 rounded-xl outline-none focus:border-purple-500 font-medium text-white placeholder-slate-500 transition-all"
                  placeholder={t('auth.email_placeholder')}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <Lock className="w-3 h-3" />
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 bg-slate-800/50 border-2 border-slate-700 rounded-xl outline-none focus:border-purple-500 font-medium text-white placeholder-slate-500 transition-all pr-12"
                  placeholder={t('auth.password_placeholder')}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl uppercase tracking-wider shadow-lg shadow-purple-500/30 hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('auth.signing_in')}
                </>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          Dokan POS System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Login;
