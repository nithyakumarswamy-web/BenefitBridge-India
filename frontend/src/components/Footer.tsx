import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, PhoneCall, ExternalLink, Heart, Landmark } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-green-600"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: About */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Landmark className="w-4 h-4 text-amber-300" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">BenefitBridge India</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering Indian citizens across all 28 States and 8 Union Territories with verified, deterministic government welfare discovery and multilingual AI guidance.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Verified Official Sources</span>
            </div>
          </div>

          {/* Col 2: Essential Helplines */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-orange-400" /> National Helplines
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><strong className="text-slate-200">Kisan Call Centre:</strong> 1800-180-1551</li>
              <li><strong className="text-slate-200">Ayushman Bharat (PM-JAY):</strong> 14555</li>
              <li><strong className="text-slate-200">National Scholarship Portal:</strong> 0120-6619540</li>
              <li><strong className="text-slate-200">Women Helpline (Pan-India):</strong> 1091 / 181</li>
              <li><strong className="text-slate-200">Senior Citizens (Elderline):</strong> 14567</li>
            </ul>
          </div>

          {/* Col 3: Official Portals */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-100">Official Portals</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="https://pmkisan.gov.in" target="_blank" rel="noreferrer" className="hover:text-blue-400 flex items-center gap-1">
                  PM-KISAN Portal <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://beneficiary.nha.gov.in" target="_blank" rel="noreferrer" className="hover:text-blue-400 flex items-center gap-1">
                  Ayushman Bharat PM-JAY <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://sevasindhugs.karnataka.gov.in" target="_blank" rel="noreferrer" className="hover:text-blue-400 flex items-center gap-1">
                  Karnataka Seva Sindhu <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://scholarships.gov.in" target="_blank" rel="noreferrer" className="hover:text-blue-400 flex items-center gap-1">
                  National Scholarship Portal <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://www.myscheme.gov.in" target="_blank" rel="noreferrer" className="hover:text-blue-400 flex items-center gap-1">
                  MyScheme India <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Privacy & Security */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-100">Citizen Privacy</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              We never collect or store Aadhaar OTPs, bank passwords, or biometric secrets. BenefitBridge provides purely informational eligibility evaluation and directs citizens to official portals.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-left max-w-2xl">{t('footer.disclaimer')}</p>
          <p className="whitespace-nowrap flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-current" /> for Indian Citizens
          </p>
        </div>
      </div>
    </footer>
  );
};
