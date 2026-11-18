import React from 'react';
import { Scheme } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  FileCheck,
} from 'lucide-react';

interface SchemeCardProps {
  scheme: Scheme;
  onViewDetails?: (schemeId: number) => void;
  onCheckEligibility?: (schemeId: number) => void;
  onOpenActionPlan?: (schemeId: number) => void;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  onViewDetails,
  onCheckEligibility,
  onOpenActionPlan,
}) => {
  const { t } = useLanguage();
  const { isSchemeSaved, toggleSaveScheme } = useUser();
  const saved = isSchemeSaved(scheme.id);

  const title = scheme.translated_name || scheme.name;
  const description = scheme.translated_short_description || scheme.short_description;
  const benefits = scheme.translated_benefits || scheme.benefits;

  const isPassed = scheme.eligibility_status === 'PASSED';
  const isFailed = scheme.eligibility_status === 'FAILED';
  const isUnknown = scheme.eligibility_status === 'UNKNOWN';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Top bar: Category + Level + Save Button */}
        <div className="p-5 pb-3 flex items-start justify-between gap-2 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
              {scheme.category}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                scheme.level === 'Central'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {scheme.level === 'Central' ? 'Central Scheme' : `State: ${scheme.applicable_state || 'State'}`}
            </span>
          </div>

          <button
            onClick={() => toggleSaveScheme(scheme.id)}
            className="text-slate-400 hover:text-blue-700 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
            title={saved ? 'Remove from saved' : 'Save scheme'}
          >
            {saved ? (
              <BookmarkCheck className="w-5 h-5 text-blue-700 fill-current" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3">
          {/* Authority */}
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block truncate">
            {scheme.authority}
          </span>

          {/* Title */}
          <h3
            onClick={() => onViewDetails && onViewDetails(scheme.id)}
            className="text-base font-bold text-slate-900 group-hover:text-blue-800 transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {title}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{description}</p>

          {/* Benefit Highlight Badge */}
          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1"></div>
            <p className="text-xs font-semibold text-emerald-950 line-clamp-2 leading-snug">
              {benefits}
            </p>
          </div>

          {/* Target Beneficiaries */}
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">For: {scheme.target_beneficiaries}</span>
          </div>

          {/* Eligibility Status Pill */}
          {scheme.eligibility_status && (
            <div className="pt-1">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                  isPassed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isFailed
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isPassed && <CheckCircle2 className="w-3.5 h-3.5" />}
                {isFailed && <XCircle className="w-3.5 h-3.5" />}
                {isUnknown && <HelpCircle className="w-3.5 h-3.5" />}
                <span>
                  {isPassed
                    ? t('eligibility.passed')
                    : isFailed
                    ? t('eligibility.failed')
                    : t('eligibility.unknown')}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            Verified: {scheme.last_verified_date}
          </span>
          {scheme.official_source_url && (
            <a
              href={scheme.official_source_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
            >
              <span>Source</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pt-1">
          {onCheckEligibility && (
            <button
              onClick={() => onCheckEligibility(scheme.id)}
              className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-1"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{t('chat.checkEligibility')}</span>
            </button>
          )}

          {onOpenActionPlan && (
            <button
              onClick={() => onOpenActionPlan(scheme.id)}
              className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <span>Action Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {scheme.official_apply_url && (
            <a
              href={scheme.official_apply_url}
              target="_blank"
              rel="noreferrer"
              className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
              title="Visit official portal to apply"
            >
              <span>Apply</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
