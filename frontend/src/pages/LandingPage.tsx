import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import {
  Search,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Users,
  Compass,
  FileCheck,
  ArrowRight,
  Sparkles,
  BookOpen,
  Wheat,
  GraduationCap,
  HeartPulse,
  Home,
  Baby,
  Briefcase,
  TrendingUp,
  Award,
  Globe2,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string, params?: any) => void;
  onOpenVoice: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenVoice }) => {
  const { t, setLanguage } = useLanguage();
  const { updateProfile } = useUser();

  const handleRunDemoScenario = async () => {
    // Switch to Kannada language
    setLanguage('kn');
    // Preload demo Karnataka farmer profile
    await updateProfile({
      state: 'Karnataka',
      district: 'Mandya',
      occupation: 'Farmer',
      age: 42,
      residence_type: 'Rural',
      income_range: '1L - 2.5L',
      annual_family_income: 120000,
      social_category: 'OBC',
      land_holding_acres: 2.5,
    });
    // Navigate straight to chat with prompt
    onNavigate('chat', { initialPrompt: 'ನನಗೆ ಯಾವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ?' });
  };

  const categories = [
    { id: 'Agriculture', label: t('categories.agriculture'), icon: Wheat, color: 'text-amber-600 bg-amber-50' },
    { id: 'Healthcare', label: t('categories.healthcare'), icon: HeartPulse, color: 'text-rose-600 bg-rose-50' },
    { id: 'Education', label: t('categories.education'), icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
    { id: 'Women and Child Welfare', label: t('categories.women'), icon: Baby, color: 'text-pink-600 bg-pink-50' },
    { id: 'Housing', label: t('categories.housing'), icon: Home, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'Business and Entrepreneurship', label: t('categories.business'), icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'Employment', label: t('categories.employment'), icon: Briefcase, color: 'text-cyan-600 bg-cyan-50' },
    { id: 'Pension', label: t('categories.pension'), icon: Award, color: 'text-orange-600 bg-orange-50' },
    { id: 'Social Welfare', label: t('categories.social'), icon: Users, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{t('hero.badge')}</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-none">
            {t('hero.title')}
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-base sm:text-xl text-slate-600 leading-relaxed font-normal">
            {t('hero.subtitle')}
          </p>

          {/* CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => onNavigate('discover')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-900/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
            >
              <Search className="w-5 h-5 text-amber-300" />
              <span>{t('hero.ctaFind')}</span>
            </button>

            <button
              onClick={() => onNavigate('chat')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-blue-900 font-bold text-sm sm:text-base border-2 border-blue-800/80 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
            >
              <MessageSquare className="w-5 h-5 text-blue-700" />
              <span>{t('hero.ctaChat')}</span>
            </button>
          </div>

          {/* Demo Scenario Shortcut Callout */}
          <div className="pt-4">
            <button
              onClick={handleRunDemoScenario}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-900 text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>{t('hero.demoScenario')}</span>
              <ArrowRight className="w-4 h-4 text-orange-600" />
            </button>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 text-white shadow-xl">
          <div className="p-4 text-center border-r border-blue-800/50">
            <div className="text-2xl sm:text-4xl font-extrabold text-amber-400">28 + 8</div>
            <div className="text-xs sm:text-sm text-slate-300 font-medium mt-1">{t('stats.states')}</div>
          </div>
          <div className="p-4 text-center border-r border-blue-800/50">
            <div className="text-2xl sm:text-4xl font-extrabold text-emerald-400">100%</div>
            <div className="text-xs sm:text-sm text-slate-300 font-medium mt-1">{t('stats.sources')}</div>
          </div>
          <div className="p-4 text-center border-r border-blue-800/50">
            <div className="text-2xl sm:text-4xl font-extrabold text-sky-400">₹10 Lakh+</div>
            <div className="text-xs sm:text-sm text-slate-300 font-medium mt-1">Direct Benefit Potential</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-2xl sm:text-4xl font-extrabold text-orange-400">7 Languages</div>
            <div className="text-xs sm:text-sm text-slate-300 font-medium mt-1">{t('stats.languages')}</div>
          </div>
        </div>
      </section>

      {/* Scheme Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('categories.title')}</h2>
          <p className="text-sm text-slate-600">{t('categories.subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => onNavigate('discover', { category: cat.id })}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group flex items-start gap-4"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${cat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-800 transition-colors">
                    {cat.label}
                  </h3>
                  <span className="text-xs text-blue-600 font-medium mt-1 inline-flex items-center gap-1">
                    Explore schemes <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 rounded-3xl bg-slate-100/70 border border-slate-200 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('howItWorks.title')}</h2>
          <p className="text-sm text-slate-600">{t('howItWorks.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-lg">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base">{t('howItWorks.step1Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('howItWorks.step1Desc')}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-lg">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base">{t('howItWorks.step2Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('howItWorks.step2Desc')}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-900 font-bold flex items-center justify-center text-lg">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base">{t('howItWorks.step3Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('howItWorks.step3Desc')}</p>
          </div>
        </div>
      </section>

      {/* 7 Indian Languages Preview Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              <Globe2 className="w-4 h-4" /> Multilingual Pan-India Support
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Speak or Read in 7 Indian Languages
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              English, ಕನ್ನಡ (Kannada), हिन्दी (Hindi), தமிழ் (Tamil), తెలుగు (Telugu), മലയാളം (Malayalam), मराठी (Marathi)
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {['kn', 'hi', 'ta', 'te', 'ml', 'mr', 'en'].map((code) => (
              <button
                key={code}
                onClick={() => {
                  setLanguage(code as any);
                  onNavigate('chat');
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-300 hover:border-blue-400 text-slate-800 text-xs font-bold transition-all shadow-xs"
              >
                {code === 'kn' && 'ಕನ್ನಡ'}
                {code === 'hi' && 'हिन्दी'}
                {code === 'ta' && 'தமிழ்'}
                {code === 'te' && 'తెలుగు'}
                {code === 'ml' && 'മലയാളം'}
                {code === 'mr' && 'मराठी'}
                {code === 'en' && 'English'}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
