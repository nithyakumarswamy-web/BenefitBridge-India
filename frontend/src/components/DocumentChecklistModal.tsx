import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DocumentItem } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { FileText, CheckCircle2, Clock, AlertCircle, Upload, X, ShieldCheck } from 'lucide-react';

interface DocumentChecklistModalProps {
  onClose: () => void;
}

export const DocumentChecklistModal: React.FC<DocumentChecklistModalProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      const data = await api.getDocumentChecklist();
      setItems(data.checklist);
      setProgress(data.progress_percentage);
      setReadyCount(data.ready_count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChecklist();
  }, []);

  const handleStatusChange = async (docName: string, newStatus: string) => {
    try {
      await api.updateDocumentStatus(docName, newStatus);
      loadChecklist();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDemoUpload = async (docName: string) => {
    try {
      await api.demoUploadDocument(docName);
      setUploadSuccess(`Demo verification successful for ${docName}!`);
      setTimeout(() => setUploadSuccess(null), 3000);
      loadChecklist();
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
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Citizen Document Readiness
              </span>
              <span className="text-xs font-bold text-slate-700">
                {readyCount} of {items.length} Ready ({progress}%)
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">{t('documents.title')}</h3>
            <p className="text-xs text-slate-500">{t('documents.subtitle')}</p>
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
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {uploadSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Document List */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading document checklist...</div>
          ) : (
            items.map((doc, idx) => {
              const isReady = doc.status === 'READY';
              const isInProgress = doc.status === 'IN_PROGRESS';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isReady
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isInProgress
                      ? 'bg-amber-50/30 border-amber-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isReady
                            ? 'bg-emerald-100 text-emerald-700'
                            : isInProgress
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              doc.is_mandatory
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {doc.is_mandatory ? t('documents.mandatory') : t('documents.conditional')}
                          </span>
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                            {doc.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{doc.reason}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleStatusChange(doc.name, isReady ? 'NOT_READY' : 'READY')}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                          isReady
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isReady ? t('documents.ready') : t('documents.markReady')}</span>
                      </button>

                      <button
                        onClick={() => handleDemoUpload(doc.name)}
                        className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 transition-all"
                        title="Demo Upload"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t('documents.demoUpload')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            *Safe prototype: No actual Aadhaar or confidential documents are uploaded or stored.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
