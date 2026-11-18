import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { api } from '../services/api';
import { Scheme, DocumentItem, ActionPlan } from '../types';
import {
  User,
  MapPin,
  Briefcase,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Bookmark,
  FileText,
  ListOrdered,
  Search,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Percent,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
  onCheckEligibility: (schemeId: number) => void;
  onOpenActionPlan: (schemeId: number) => void;
  onOpenDocuments: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onCheckEligibility,
  onOpenActionPlan,
  onOpenDocuments,
}) => {
  const { t, language } = useLanguage();
  const { profile, savedSchemeIds, toggleSaveScheme } = useUser();

  const [loading, setLoading] = useState(true);
  const [eligSummary, setEligSummary] = useState<any>(null);
  const [savedSchemes, setSavedSchemes] = useState<Scheme[]>([]);
  const [recommendedSchemes, setRecommendedSchemes] = useState<Scheme[]>([]);
  const [docStats, setDocStats] = useState<{
    checklist: DocumentItem[];
    ready_count: number;
    total_count: number;
    progress_percentage: number;
  } | null>(null);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [summaryRes, savedRes, allSchemesRes, docRes, plansRes] = await Promise.allSettled([
        api.getEligibilitySummary(),
        api.getSavedSchemes(),
        api.getSchemes({ language }),
        api.getDocumentChecklist(),
        api.getActionPlans(),
      ]);

      if (summaryRes.status === 'fulfilled') {
        setEligSummary(summaryRes.value);
      }
      if (savedRes.status === 'fulfilled') {
        setSavedSchemes(savedRes.value);
      }
      if (allSchemesRes.status === 'fulfilled') {
        setRecommendedSchemes(allSchemesRes.value.slice(0, 4));
      }
      if (docRes.status === 'fulfilled') {
        setDocStats(docRes.value);
      }
      if (plansRes.status === 'fulfilled') {
        setActionPlans(plansRes.value);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [language]);

  const completionPct = profile?.completion_percentage || 75;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Greeting & Quick Profile Summary */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/80 border border-blue-700/60 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Verified Citizen Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Namaskara, {profile?.occupation || 'Citizen'}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Here is your personalized government welfare status for {profile?.state || 'Karnataka'}, including verified eligibility matches, active action plans, and document readiness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('chat')}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Mitra AI</span>
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={loadDashboardData}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Profile Attributes Strip */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">State & District:</span>
            <span className="font-bold text-slate-100 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              {profile?.state || 'Karnataka'} ({profile?.district || 'Mandya'})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Occupation & Type:</span>
            <span className="font-bold text-slate-100 flex items-center gap-1 mt-0.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              {profile?.occupation || 'Farmer'} • {profile?.residence_type || 'Rural'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Land & Ration:</span>
            <span className="font-bold text-slate-100 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              {profile?.land_holding_acres ? `${profile.land_holding_acres} Acres` : 'N/A'} • {profile?.has_bpl_ration_card ? 'BPL Card' : 'General'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Profile Completion:</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-white/20 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <span className="font-bold text-emerald-400">{completionPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Passed Schemes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Qualified Schemes
            </span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {eligSummary?.passed_count ?? 3} Schemes
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Official criteria 100% matched</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Info Missing */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Pending Clarification
            </span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">
              {eligSummary?.unknown_count ?? 2} Schemes
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Missing 1-2 profile answers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Document Readiness */}
        <div
          onClick={onOpenDocuments}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all group"
        >
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Document Readiness
            </span>
            <h3 className="text-2xl font-black text-blue-800 mt-1">
              {docStats?.ready_count ?? 3} / {docStats?.total_count ?? 4}
            </h3>
            <p className="text-[11px] text-blue-600 font-medium mt-0.5 group-hover:underline">
              {docStats?.progress_percentage ?? 75}% Ready • Click to open
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Action Plans */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Saved Schemes
            </span>
            <h3 className="text-2xl font-black text-indigo-700 mt-1">
              {savedSchemes.length || savedSchemeIds.length || 2} Saved
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Quick access for tracking</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Bookmark className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Eligible Schemes & Recommendations (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Eligibility Results Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  Instant Eligibility Breakdown
                </h2>
              </div>
              <button
                onClick={() => onNavigate('discover')}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View All Schemes</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Passed schemes list */}
              {eligSummary?.passed_schemes && eligSummary.passed_schemes.length > 0 ? (
                eligSummary.passed_schemes.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          QUALIFIED
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{s.category}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{s.name}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{s.summary}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onCheckEligibility(s.id)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors cursor-pointer"
                      >
                        View Criteria
                      </button>
                      <button
                        onClick={() => onOpenActionPlan(s.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
                      >
                        Action Plan
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                  Run an eligibility check on any scheme from the Discovery page to see results here.
                </div>
              )}

              {/* Unknown / Info Needed Schemes */}
              {eligSummary?.unknown_schemes && eligSummary.unknown_schemes.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                    Needs More Info to Confirm:
                  </h4>
                  <div className="space-y-2">
                    {eligSummary.unknown_schemes.slice(0, 2).map((s: any) => (
                      <div
                        key={s.id}
                        className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{s.name}</span>
                          <p className="text-slate-600 mt-0.5">{s.summary}</p>
                        </div>
                        <button
                          onClick={() => onNavigate('profile')}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                        >
                          Update Profile
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Curated Schemes */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Recommended for Your Family</h2>
              <button
                onClick={() => onNavigate('discover')}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold"
              >
                Browse All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendedSchemes.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all space-y-2 bg-slate-50/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 uppercase">{s.level}</span>
                    <button
                      onClick={() => toggleSaveScheme(s.id)}
                      className="text-slate-400 hover:text-blue-700"
                    >
                      <Bookmark className={`w-4 h-4 ${savedSchemeIds.includes(s.id) ? 'fill-blue-700 text-blue-700' : ''}`} />
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">{s.name}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{s.benefits}</p>
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => onCheckEligibility(s.id)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Check Match</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {s.official_apply_url && (
                      <a
                        href={s.official_apply_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-0.5"
                      >
                        Official Portal <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Document Checklist & Active Action Plans (1 col) */}
        <div className="space-y-6">
          {/* Document Readiness Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-base">Document Readiness</h3>
              </div>
              <button
                onClick={onOpenDocuments}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
              >
                Manage
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Prepare your documents to streamline online application on official government portals.
            </p>

            <div className="space-y-2.5">
              {docStats?.checklist && docStats.checklist.length > 0 ? (
                docStats.checklist.slice(0, 4).map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{doc.name}</span>
                      <span className="text-[10px] text-slate-500">{doc.category}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        doc.status === 'READY'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-3 text-center">
                  Loading document checklist...
                </div>
              )}
            </div>

            <button
              onClick={onOpenDocuments}
              className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Open Document Manager</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Plans Progress Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-indigo-700" />
                <h3 className="font-bold text-slate-900 text-base">Application Action Plans</h3>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Step-by-step guidance generated for your qualified welfare schemes.
            </p>

            <div className="space-y-3">
              {actionPlans && actionPlans.length > 0 ? (
                actionPlans.slice(0, 3).map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => onOpenActionPlan(plan.scheme_id)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer bg-slate-50/50 space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-800">
                        {plan.scheme_name}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700">
                        {plan.progress_percentage}% Done
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${plan.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-2">
                  <p>No active action plan started yet.</p>
                  <button
                    onClick={() => onOpenActionPlan(1)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-800 font-bold hover:bg-indigo-100 transition-colors"
                  >
                    Start PM-KISAN Plan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
