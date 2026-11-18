import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ActionPlan } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, Circle, ArrowRight, ExternalLink, X, ListOrdered, Calendar, ShieldCheck } from 'lucide-react';

interface ActionPlanModalProps {
  schemeId: number;
  onClose: () => void;
  onOpenDocuments?: () => void;
}

export const ActionPlanModal: React.FC<ActionPlanModalProps> = ({
  schemeId,
  onClose,
  onOpenDocuments,
}) => {
  const { t } = useLanguage();
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const data = await api.generateActionPlan(schemeId);
      setPlan(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, [schemeId]);

  const toggleStep = async (stepId: number, currentCompleted: boolean) => {
    try {
      const res = await api.updateActionStep(stepId, !currentCompleted);
      if (plan) {
        const updatedSteps = plan.steps.map((s) =>
          s.id === stepId ? { ...s, is_completed: !currentCompleted } : s
        );
        setPlan({
          ...plan,
          progress_percentage: res.plan_progress,
          status: res.plan_status,
          steps: updatedSteps,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Application Roadmap
              </span>
              <span className="text-xs font-bold text-slate-700">
                {plan?.progress_percentage || 0}% Completed
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {plan?.scheme_name || t('actionPlan.title')}
            </h3>
            <p className="text-xs text-slate-500">{t('actionPlan.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${plan?.progress_percentage || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Steps List */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Generating your personalized action plan...</div>
          ) : plan?.steps && plan.steps.length > 0 ? (
            plan.steps.map((step, idx) => (
              <div
                key={step.id}
                className={`p-4 rounded-xl border transition-all ${
                  step.is_completed
                    ? 'bg-blue-50/30 border-blue-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => toggleStep(step.id, step.is_completed)}
                    className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                  >
                    {step.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-sm font-bold ${
                          step.is_completed ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        Step {step.step_number}: {step.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {step.is_completed ? 'Done' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>

                    {/* Action buttons if applicable */}
                    <div className="pt-2 flex items-center gap-2">
                      {step.step_number === 2 && onOpenDocuments && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenDocuments();
                          }}
                          className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1"
                        >
                          <span>Open Document Checklist</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {step.action_url && (
                        <a
                          href={step.action_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                        >
                          <span>Visit Official Application Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-400 text-sm">No steps available.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official Government Portal Guidance</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
          >
            Close Roadmap
          </button>
        </div>
      </div>
    </div>
  );
};
