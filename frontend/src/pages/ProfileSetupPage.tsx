import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { CitizenProfile } from '../types';
import {
  User,
  MapPin,
  Briefcase,
  Wallet,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building,
  LogOut,
} from 'lucide-react';

interface ProfileSetupPageProps {
  onNavigate: (page: string) => void;
}

export const ProfileSetupPage: React.FC<ProfileSetupPageProps> = ({ onNavigate }) => {
  const { profile, updateProfile, currentUser, logout } = useUser();
  const { t } = useLanguage();
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form local state
  const [formData, setFormData] = useState<Partial<CitizenProfile>>({
    state: profile?.state || 'Karnataka',
    district: profile?.district || 'Mandya',
    occupation: profile?.occupation || 'Farmer',
    age: profile?.age || 42,
    gender: profile?.gender || 'Male',
    residence_type: profile?.residence_type || 'Rural',
    income_range: profile?.income_range || '1L - 2.5L',
    annual_family_income: profile?.annual_family_income || 120000,
    social_category: profile?.social_category || 'OBC',
    disability_status: profile?.disability_status || 'None',
    education_level: profile?.education_level || '10th pass',
    marital_status: profile?.marital_status || 'Married',
    land_holding_acres: profile?.land_holding_acres || 2.5,
    has_bpl_ration_card: profile?.has_bpl_ration_card ?? true,
  });

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const data = await api.getStates();
        setStates(data);
        const curState = data.find((s: any) => s.name === formData.state);
        if (curState && curState.districts) {
          setDistricts(curState.districts.map((d: any) => d.name));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchStates();
  }, []);

  const handleStateChange = (stateName: string) => {
    setFormData((prev) => ({ ...prev, state: stateName, district: '' }));
    const found = states.find((s) => s.name === stateName);
    if (found && found.districts) {
      setDistricts(found.districts.map((d: any) => d.name));
    } else {
      setDistricts([]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onNavigate('discover');
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const loadDemoFarmerProfile = () => {
    setFormData({
      state: 'Karnataka',
      district: 'Mandya',
      occupation: 'Farmer',
      age: 42,
      gender: 'Male',
      residence_type: 'Rural',
      income_range: '1L - 2.5L',
      annual_family_income: 120000,
      social_category: 'OBC',
      disability_status: 'None',
      education_level: '10th pass',
      marital_status: 'Married',
      land_holding_acres: 2.5,
      has_bpl_ration_card: true,
    });
  };

  const loadDemoStudentProfile = () => {
    setFormData({
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      occupation: 'Student',
      age: 20,
      gender: 'Female',
      residence_type: 'Urban',
      income_range: '< 1 Lakh',
      annual_family_income: 80000,
      social_category: 'SC',
      disability_status: 'None',
      education_level: 'Graduate',
      marital_status: 'Single',
      land_holding_acres: 0,
      has_bpl_ration_card: true,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
            Citizen Profile Configuration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Your Welfare Discovery Profile
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Used strictly by deterministic eligibility rules to match welfare schemes.
          </p>
        </div>

        {/* Quick Demo Pre-fill Presets */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDemoFarmerProfile}
            className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Preset: Karnataka Farmer</span>
          </button>
          <button
            type="button"
            onClick={loadDemoStudentProfile}
            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Preset: Student</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Profile updated successfully! Redirecting to eligible schemes...</span>
        </div>
      )}

      {/* Signed-in Account Profile Section */}
      <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-lg border border-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {currentUser?.profile_picture ? (
            <img
              src={currentUser.profile_picture}
              alt={currentUser.full_name || 'User'}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-800 text-white flex items-center justify-center font-bold text-2xl border-2 border-blue-600 shadow-md">
              {currentUser?.full_name?.charAt(0) || 'C'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white leading-tight">
                {currentUser?.full_name || 'Citizen User'}
              </h2>
              {currentUser?.auth_provider === 'google' ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Google Account (Verified)
                </span>
              ) : currentUser ? (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/40 text-[11px] font-semibold">
                  Email Account
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40 text-[11px] font-semibold">
                  Guest Session
                </span>
              )}
            </div>

            <p className="text-xs text-blue-200 mt-1 font-mono">
              {currentUser?.email || 'No email associated (Guest profile)'}
            </p>

            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-300">
              <span>User ID: <strong className="text-amber-300 font-mono">CITIZEN-#{String(currentUser?.id || 1).padStart(5, '0')}</strong></span>
              <span>•</span>
              <span>Member Since: <strong className="text-white">{currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'Active'}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {currentUser ? (
            <button
              type="button"
              onClick={logout}
              className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Account / Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
        {/* Section 1: Location & Residence */}
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>1. Location and Residence</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* State */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State / Union Territory *</label>
              <select
                value={formData.state || ''}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              >
                {states.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} {s.is_union_territory ? '(UT)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
              <select
                value={formData.district || ''}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">Select District</option>
                {districts.map((d, i) => (
                  <option key={i} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Residence Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Area Type *</label>
              <select
                value={formData.residence_type || 'Rural'}
                onChange={(e) => setFormData({ ...formData, residence_type: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Rural">Rural (Village / Gram Panchayat)</option>
                <option value="Urban">Urban (City / Town / Municipality)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Demographics & Profession */}
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Briefcase className="w-5 h-5 text-emerald-600" />
            <span>2. Demographics & Occupation</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Occupation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary Occupation *</label>
              <select
                value={formData.occupation || 'Farmer'}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Farmer">Farmer (Agricultural Cultivator)</option>
                <option value="Student">Student (School / College / Higher Ed)</option>
                <option value="Homemaker">Homemaker (Woman Head of Household)</option>
                <option value="Daily Wage / Laborer">Daily Wage / Construction Laborer</option>
                <option value="Self-Employed">Self-Employed / Artisan / Shopkeeper</option>
                <option value="Senior Citizen / Retired">Senior Citizen (60+ years)</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Salaried">Salaried (Private / Govt)</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Age (Years) *</label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || null })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender || 'Male'}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Income & Social Details */}
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Wallet className="w-5 h-5 text-amber-600" />
            <span>3. Income & Economic Criteria</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Income Range */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Annual Family Income *</label>
              <select
                value={formData.income_range || '1L - 2.5L'}
                onChange={(e) => setFormData({ ...formData, income_range: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="< 1 Lakh">Less than ₹1 Lakh (BPL / Antyodaya)</option>
                <option value="1L - 2.5L">₹1.0 Lakh to ₹2.5 Lakh</option>
                <option value="2.5L - 5L">₹2.5 Lakh to ₹5.0 Lakh</option>
                <option value="5L - 8L">₹5.0 Lakh to ₹8.0 Lakh</option>
                <option value="> 8L">Above ₹8.0 Lakh</option>
              </select>
            </div>

            {/* Land Holding (For Farmers) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Landholding (Acres) {formData.occupation === 'Farmer' ? '*' : '(Optional)'}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.land_holding_acres ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, land_holding_acres: parseFloat(e.target.value) || 0 })
                }
                placeholder="e.g. 2.5"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {/* Social Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Social Category (Voluntary)</label>
              <select
                value={formData.social_category || 'General'}
                onChange={(e) => setFormData({ ...formData, social_category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="General">General</option>
                <option value="OBC">OBC (Other Backward Class)</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="EWS">EWS (Economically Weaker Section)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Education & Special Criteria */}
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            <span>4. Education & Disability Status</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Education */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Education Level</label>
              <select
                value={formData.education_level || '10th pass'}
                onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="No formal education">No formal education</option>
                <option value="Primary (1-5)">Primary (Class 1-5)</option>
                <option value="Middle (6-8)">Middle (Class 6-8)</option>
                <option value="10th pass">Secondary (10th Pass)</option>
                <option value="12th pass">Higher Secondary (12th / PUC)</option>
                <option value="Graduate">Graduate (Degree)</option>
                <option value="Post Graduate">Post Graduate / Professional</option>
              </select>
            </div>

            {/* Disability Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Disability Status (Divyangjan)</label>
              <select
                value={formData.disability_status || 'None'}
                onChange={(e) => setFormData({ ...formData, disability_status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="None">None (Not Applicable)</option>
                <option value="Locomotor">Locomotor Disability (40%+)</option>
                <option value="Visual">Visual Impairment (Blind / Low Vision)</option>
                <option value="Hearing">Hearing Impairment</option>
                <option value="Multiple">Multiple Disabilities</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p>
            Your information is stored locally for this demonstration session. We never request Aadhaar OTPs, bank credentials, or biometric data.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onNavigate('discover')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <span>{saving ? 'Saving...' : 'Save Profile & Discover Schemes'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
