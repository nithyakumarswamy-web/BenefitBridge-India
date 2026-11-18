import React from 'react';
import { EligibilityEvaluation } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, XCircle, HelpCircle, X, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

interface EligibilityModalProps {
  evaluation: EligibilityEvaluation | null;
  onClose: () => void;
  onOpenActionPlan?: (schemeId: number) => void;
}

export const EligibilityModal: React.FC<EligibilityModalProps> = ({
  evaluation,
  onClose,
  onOpenActionPlan,
}) => {
  const { t } = useLanguage();
  if (!evaluation) return null;

  const isPassed = evaluation.overall_status === 'PASSED';
  const isFailed = evaluation.overall_status === 'FAILED';
  const isUnknown = evaluation.overall_status === 'UNKNOWN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Deterministic Rules Engine
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
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
                {isPassed ? t('eligibility.passed') : isFailed ? t('eligibility.failed') : t('eligibility.unknown')}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{evaluation.scheme_name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Summary Banner */}
          <div
            className={`p-4 rounded-xl border text-sm leading-relaxed ${
              isPassed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : isFailed
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <p className="font-semibold mb-1">Evaluation Outcome:</p>
            <p>{evaluation.summary_explanation}</p>
          </div>

          {/* Criteria Breakdown */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
              Criterion-by-Criterion Verification
            </h4>
            <div className="space-y-3">
              {/* Passed criteria */}
              {evaluation.passed_criteria.map((c, i) => (
                <div
                  key={`passed-${i}`}
                  className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{c.description}</span>
                      <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
                        PASSED
                      </span>
                    </div>
                    <p className="text-slate-600">
                      <strong>Your Detail:</strong> {String(c.user_value || 'Present')} •{' '}
                      <strong>Condition:</strong> {c.required_value}
                    </p>
                    <p className="text-emerald-700 text-[11px]">{c.explanation}</p>
                  </div>
                </div>
              ))}

              {/* Unknown criteria (missing info) */}
              {evaluation.unknown_criteria.map((c, i) => (
                <div
                  key={`unknown-${i}`}
                  className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-start gap-3"
                >
                  <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{c.description}</span>
                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
                        UNKNOWN (INFO MISSING)
                      </span>
                    </div>
                    <p className="text-slate-600">
                      <strong>Requirement:</strong> {c.required_value}
                    </p>
                    <p className="text-amber-800 font-medium text-[11px]">{c.explanation}</p>
                  </div>
                </div>
              ))}

              {/* Failed criteria */}
              {evaluation.failed_criteria.map((c, i) => (
                <div
                  key={`failed-${i}`}
                  className="p-3.5 rounded-xl border border-red-200 bg-red-50/40 flex items-start gap-3"
                >
                  <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{c.description}</span>
                      <span className="bg-red-100 text-red-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
                        FAILED
                      </span>
                    </div>
                    <p className="text-slate-600">
                      <strong>Your Profile:</strong> {String(c.user_value)} •{' '}
                      <strong>Required:</strong> {c.required_value}
                    </p>
                    <p className="text-red-700 text-[11px]">{c.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block">Next Steps Recommended:</span>
            <p>{evaluation.next_steps}</p>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-100/70 p-3 rounded-lg">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>{t('eligibility.disclaimer')}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Close
          </button>
          {onOpenActionPlan && (
            <button
              onClick={() => {
                onClose();
                onOpenActionPlan(evaluation.scheme_id);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <span>{t('chat.generatePlan')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
