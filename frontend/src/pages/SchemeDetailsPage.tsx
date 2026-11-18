import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SchemeDetail } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Calendar,
  Layers,
  Award,
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Building,
  HelpCircle,
  XCircle,
} from 'lucide-react';

interface SchemeDetailsPageProps {
  schemeId: number;
  onBack: () => void;
  onCheckEligibility: (schemeId: number) => void;
  onOpenActionPlan: (schemeId: number) => void;
}

export const SchemeDetailsPage: React.FC<SchemeDetailsPageProps> = ({
  schemeId,
  onBack,
  onCheckEligibility,
  onOpenActionPlan,
}) => {
  const { language, t } = useLanguage();
  const { isSchemeSaved, toggleSaveScheme } = useUser();
  const [scheme, setScheme] = useState<SchemeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await api.getSchemeDetail(schemeId, language);
        setScheme(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [schemeId, language]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        Loading official scheme details...
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-700 font-bold">Scheme not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold"
        >
          Back to Schemes
        </button>
      </div>
    );
  }

  const saved = isSchemeSaved(scheme.id);
  const title = scheme.translated_name || scheme.name;
  const shortDesc = scheme.translated_short_description || scheme.short_description;
  const benefits = scheme.translated_benefits || scheme.benefits;

  const isPassed = scheme.eligibility_status === 'PASSED';
  const isFailed = scheme.eligibility_status === 'FAILED';
  const isUnknown = scheme.eligibility_status === 'UNKNOWN';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Scheme Catalog</span>
      </button>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                {scheme.category}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                {scheme.level === 'Central' ? 'Central Scheme' : `State: ${scheme.applicable_state}`}
              </span>
              <span className="text-xs text-slate-500 font-medium">Code: {scheme.code}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-blue-800 uppercase tracking-wide">
              {scheme.authority}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toggleSaveScheme(scheme.id)}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-700 transition-colors"
              title="Save Scheme"
            >
              {saved ? (
                <BookmarkCheck className="w-5 h-5 text-blue-700 fill-current" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => onCheckEligibility(scheme.id)}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Check Eligibility</span>
            </button>
            <button
              onClick={() => onOpenActionPlan(scheme.id)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Create Action Plan</span>
            </button>
          </div>
        </div>

        {/* Benefits Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Scheme Benefits Overview</span>
          </div>
          <p className="text-sm font-bold text-emerald-950 leading-relaxed">{benefits}</p>
        </div>

        {/* Overview Description */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900">About the Scheme</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{scheme.full_description}</p>
        </div>

        {/* Target Beneficiaries */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
          <span className="font-bold text-slate-900 block">Target Beneficiaries:</span>
          <p>{scheme.target_beneficiaries}</p>
        </div>
      </div>

      {/* Grid: Eligibility Criteria & Required Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Eligibility Rules */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-700" />
              <span>Eligibility Rules</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Deterministic Rules</span>
          </div>

          <div className="space-y-3">
            {scheme.rules && scheme.rules.length > 0 ? (
              scheme.rules.map((rule, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{rule.description}</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase">
                      {rule.field}
                    </span>
                  </div>
                  <p className="text-slate-500">
                    Rule Operator: <code className="font-mono text-slate-700">{rule.operator}</code> • Value:{' '}
                    <strong className="text-slate-700">{rule.value}</strong>
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">Standard welfare rules apply.</p>
            )}
          </div>
        </div>

        {/* Required Documents */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              <span>Required Documents</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Verify before apply</span>
          </div>

          <div className="space-y-3">
            {scheme.documents && scheme.documents.length > 0 ? (
              scheme.documents.map((doc, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{doc.document_name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        doc.is_mandatory ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {doc.is_mandatory ? 'Mandatory' : 'Optional'}
                    </span>
                  </div>
                  {doc.description && <p className="text-slate-500">{doc.description}</p>}
                  {doc.issuing_authority && (
                    <span className="text-[10px] text-slate-400 block">
                      Issuing Authority: {doc.issuing_authority}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">Standard KYC documents required.</p>
            )}
          </div>
        </div>
      </div>

      {/* Application Procedure & Guidelines */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Official Application Procedure & Important Guidelines
        </h3>

        {scheme.application_procedure && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">How to Apply:</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {scheme.application_procedure}
            </p>
          </div>
        )}

        {scheme.important_conditions && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Important Conditions & Exclusions:</span>
            </h4>
            <p className="text-xs sm:text-sm text-amber-950 leading-relaxed bg-amber-50/70 p-4 rounded-xl border border-amber-200">
              {scheme.important_conditions}
            </p>
          </div>
        )}

        {/* Verification and Portal Links */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified against official gazettes and portals</span>
            </div>
            <p>Last Verified Date: <strong>{scheme.last_verified_date}</strong></p>
          </div>

          <div className="flex items-center gap-3">
            {scheme.official_source_url && (
              <a
                href={scheme.official_source_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>View Source Guidelines</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {scheme.official_apply_url && (
              <a
                href={scheme.official_apply_url}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Go to Official Apply Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
