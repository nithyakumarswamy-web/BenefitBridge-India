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
} from 'lucide-react';

interface ProfileSetupPageProps {
  onNavigate: (page: string) => void;
}

export const ProfileSetupPage: React.FC<ProfileSetupPageProps> = ({ onNavigate }) => {
  const { profile, updateProfile } = useUser();
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
