import React from 'react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { SupportedLanguage } from '../types';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <Globe className="w-4 h-4 text-blue-800" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
        className="bg-white border border-slate-300 text-slate-800 text-sm font-medium rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer shadow-sm hover:border-blue-500 transition-all"
        aria-label="Select Language"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="py-1">
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );
};
