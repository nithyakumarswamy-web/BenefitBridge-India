import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { LanguageSelector } from './LanguageSelector';
import { Shield, Sparkles, User, Search, MessageSquare, LayoutDashboard, Menu, X, Landmark, LogIn, LogOut } from 'lucide-react';

interface NavbarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate, onOpenAuth }) => {
  const { t } = useLanguage();
  const { profile, currentUser, logout } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: t('nav.home'), icon: Landmark },
    { id: 'discover', label: t('nav.discover'), icon: Search },
    { id: 'chat', label: t('nav.chatbot'), icon: MessageSquare, highlight: true },
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'admin', label: t('nav.admin'), icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Tricolor decorative ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-white to-green-600"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center text-white shadow-md shadow-blue-900/20 group-hover:scale-105 transition-transform">
              <Landmark className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900">BenefitBridge</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  INDIA
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                Govt Welfare AI Guide
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-200/60 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  } ${item.highlight ? 'text-blue-700 bg-blue-50/50' : ''}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-500'}`} />
                  {item.label}
                  {item.highlight && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Language, Citizen Badge & Auth */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector />

            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              {currentUser?.profile_picture ? (
                <img
                  src={currentUser.profile_picture}
                  alt={currentUser.full_name || 'User'}
                  className="w-6 h-6 rounded-full object-cover border border-blue-300"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {profile?.state ? profile.state.charAt(0) : 'C'}
                </div>
              )}
              <div className="text-left">
                <div className="flex items-center gap-1">
                  <span className="block font-semibold text-slate-800 leading-tight">
                    {currentUser?.full_name || profile?.occupation || 'Citizen'}
                  </span>
                  {currentUser?.auth_provider === 'google' && (
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Google Account Verified" />
                  )}
                </div>
                <span className="block text-[10px] text-slate-500 leading-none">
                  {currentUser?.email || profile?.state || 'Set Profile'} ({profile?.completion_percentage || 0}%)
                </span>
              </div>
            </button>

            {currentUser ? (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-semibold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold transition-all shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector className="scale-90" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 text-blue-800" />
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onNavigate('profile');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-50 text-slate-800 font-medium text-sm"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-700" />
                <span>{currentUser?.full_name || profile?.occupation || 'Citizen'} ({profile?.state || 'Profile'})</span>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                {profile?.completion_percentage || 0}% Complete
              </span>
            </button>

            {currentUser ? (
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 mt-1 px-3 py-2.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => { onOpenAuth?.(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-2 mt-1 px-3 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
