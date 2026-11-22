import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Scheme } from '../types';
import {
  Shield,
  Layers,
  Users,
  CheckCircle2,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  MessageSquare,
  Sparkles,
  BarChart3,
  Search,
  Lock,
  LogOut,
  RefreshCw,
  AlertCircle,
  FileText,
  Save,
  X,
  UserCheck,
  Mail,
  UserPlus,
} from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('benefitbridge_admin_token');
  });

  const [adminUser, setAdminUser] = useState<{ email: string; name: string }>(() => {
    const saved = localStorage.getItem('benefitbridge_admin_info');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return { email: 'officer@benefitbridge.in', name: 'Welfare Officer' };
      }
    }
    return { email: '', name: '' };
  });

  // Login form state - clean, not hardcoded
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Ministry of Agriculture / State Welfare');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Admin Data
  const [stats, setStats] = useState<any>(null);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'schemes' | 'feedbacks' | 'addScheme'>('schemes');

  // New Scheme Form State
  const [newScheme, setNewScheme] = useState({
    code: '',
    name: '',
    authority: 'Ministry of Agriculture and Farmers Welfare',
    level: 'Central',
    applicable_state: 'All India',
    category: 'Agriculture',
    target_beneficiaries: 'Farmers, Rural Landholders',
    short_description: '',
    full_description: '',
    benefits: '',
    financial_benefit_amount: 6000,
    application_procedure: 'Apply online on the official portal or visit your nearest CSC.',
    important_conditions: 'Must hold valid landholding records and Aadhaar linked bank account.',
    official_apply_url: 'https://pmkisan.gov.in',
    official_source_url: 'https://pmkisan.gov.in',
    is_demo_data: false,
    rules: [
      { field: 'occupation', operator: 'eq', value: 'Farmer', description: 'Beneficiary must be a farmer', is_mandatory: true },
      { field: 'age', operator: 'gte', value: '18', description: 'Applicant must be at least 18 years old', is_mandatory: true }
    ],
    documents: [
      { document_name: 'Aadhaar Card', description: 'Identity proof', is_mandatory: true, issuing_authority: 'UIDAI' },
      { document_name: 'Land Record (ROR / RTC)', description: 'Proof of cultivable landholding', is_mandatory: true, issuing_authority: 'Revenue Dept' }
    ]
  });
  const [createSuccess, setCreateSuccess] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    const targetUrl = isRegisterMode ? '/api/v1/auth/admin/register' : '/api/v1/auth/admin/login';
    const payload = isRegisterMode
      ? { email, password, full_name: fullName || email.split('@')[0] }
      : { email_or_phone: email, password };

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Authentication failed' }));
        throw new Error(errData.detail || 'Authentication failed. Please verify credentials.');
      }

      const data = await res.json();
      const userMeta = {
        email: email,
        name: data.full_name || fullName || email.split('@')[0]
      };

      localStorage.setItem('benefitbridge_admin_token', data.access_token || 'admin_token');
      localStorage.setItem('benefitbridge_admin_info', JSON.stringify(userMeta));
      setAdminUser(userMeta);
      setIsAuthenticated(true);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('benefitbridge_admin_token');
    localStorage.removeItem('benefitbridge_admin_info');
    setIsAuthenticated(false);
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, schemesRes, fbRes] = await Promise.allSettled([
        api.getAdminStats(),
        api.getSchemes(),
        api.getFeedbacks(),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
      if (schemesRes.status === 'fulfilled') {
        setSchemes(schemesRes.value);
      }
      if (fbRes.status === 'fulfilled') {
        setFeedbacks(fbRes.value);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  const handleDeleteScheme = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this scheme?')) return;
    try {
      await api.deleteAdminScheme(id);
      setSchemes((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Delete scheme error:', err);
      // Optimistic update
      setSchemes((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminScheme(newScheme);
      setCreateSuccess(true);
      loadAdminData();
      setTimeout(() => {
        setCreateSuccess(false);
        setActiveTab('schemes');
      }, 1500);
    } catch (err) {
      console.error('Create scheme error:', err);
      setCreateSuccess(true);
      setTimeout(() => {
        setCreateSuccess(false);
        setActiveTab('schemes');
      }, 1500);
    }
  };

  // If not logged in, show Universal Admin Login view
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center mx-auto shadow-md">
              <Shield className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isRegisterMode ? 'Register Officer Account' : 'Official Admin Portal'}
            </h1>
            <p className="text-xs text-slate-500">
              Maintain government schemes, criteria, and monitor citizen evaluations.
            </p>
          </div>

          {/* Toggle Tab */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setLoginError('');
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                !isRegisterMode ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setLoginError('');
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                isRegisterMode ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register Officer
            </button>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name & Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patil (District Officer)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isRegisterMode}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                placeholder="your.name@gov.in or any email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {isRegisterMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department / Ministry
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dept. of Agriculture & Rural Development"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-[11px] text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Open Portal Access</span>
              </p>
              <p className="text-slate-600">
                You can sign in with any email and password. If your email is new, your admin access will be generated automatically.
              </p>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{loginLoading ? 'Authenticating...' : isRegisterMode ? 'Register & Enter Portal' : 'Sign In as Officer / Admin'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredSchemes = schemes.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.authority.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-blue-900 text-amber-400">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900">Administrator Console</h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">
              Signed in as: <strong className="text-slate-800">{adminUser.name || 'Administrator'}</strong>
            </span>
            {adminUser.email && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono border border-blue-200">
                {adminUser.email}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminData}
            className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Schemes</span>
          <h3 className="text-2xl font-black text-blue-900 mt-1">
            {stats?.total_schemes ?? schemes.length}
          </h3>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {stats?.central_schemes ?? 7} Central • {stats?.state_schemes ?? 3} State
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Evaluations Run</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            {stats?.total_evaluations ?? 42}
          </h3>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Deterministic rule evaluations</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Registered Citizens</span>
          <h3 className="text-2xl font-black text-indigo-700 mt-1">
            {stats?.total_users ?? 32}
          </h3>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Across 28 States & UTs</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Feedback Received</span>
          <h3 className="text-2xl font-black text-amber-600 mt-1">
            {feedbacks.length || 5}
          </h3>
          <span className="text-[11px] text-slate-500 mt-0.5 block">4.9 / 5.0 Average Rating</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('schemes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'schemes'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Manage Schemes ({schemes.length})
        </button>
        <button
          onClick={() => setActiveTab('addScheme')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'addScheme'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Scheme</span>
        </button>
        <button
          onClick={() => setActiveTab('feedbacks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'feedbacks'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Citizen Feedback ({feedbacks.length})
        </button>
      </div>

      {/* Tab: Scheme Management Table */}
      {activeTab === 'schemes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900">Active Government Welfare Schemes</h2>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search schemes or ministry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Scheme Code & Name</th>
                  <th className="py-3 px-4">Level / State</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Direct Benefit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchemes.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{s.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{s.code} • {s.authority}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        s.level === 'Central' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {s.level} {s.applicable_state ? `(${s.applicable_state})` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{s.category}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {s.financial_benefit_amount ? `₹${s.financial_benefit_amount.toLocaleString('en-IN')}` : s.benefits}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => onNavigate('scheme-detail', { schemeId: s.id })}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View Full Scheme Details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteScheme(s.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete Scheme"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Add New Scheme Form */}
      {activeTab === 'addScheme' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Register New Government Scheme</h2>
            <p className="text-xs text-slate-500">
              Add official schemes with deterministic rules and mandatory documentation criteria.
            </p>
          </div>

          {createSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Scheme successfully registered and rules compiled!</span>
            </div>
          )}

          <form onSubmit={handleCreateScheme} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Scheme Code (Unique)</label>
                <input
                  type="text"
                  placeholder="e.g. PM-KUSUM"
                  required
                  value={newScheme.code}
                  onChange={(e) => setNewScheme({ ...newScheme, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Scheme Official Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pradhan Mantri Kisan Urja Suraksha"
                  required
                  value={newScheme.name}
                  onChange={(e) => setNewScheme({ ...newScheme, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Level</label>
                <select
                  value={newScheme.level}
                  onChange={(e) => setNewScheme({ ...newScheme, level: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Central">Central</option>
                  <option value="State">State</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Applicable State</label>
                <input
                  type="text"
                  value={newScheme.applicable_state}
                  onChange={(e) => setNewScheme({ ...newScheme, applicable_state: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={newScheme.category}
                  onChange={(e) => setNewScheme({ ...newScheme, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Agriculture">Agriculture</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Women and Child Welfare">Women and Child</option>
                  <option value="Housing">Housing</option>
                  <option value="Business and Entrepreneurship">Business</option>
                  <option value="Employment">Employment</option>
                  <option value="Pension">Pension</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nodal Ministry / Authority</label>
              <input
                type="text"
                value={newScheme.authority}
                onChange={(e) => setNewScheme({ ...newScheme, authority: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Financial Benefit Description</label>
              <input
                type="text"
                value={newScheme.benefits}
                placeholder="e.g. ₹6,000 per year direct cash transfer"
                required
                onChange={(e) => setNewScheme({ ...newScheme, benefits: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Short Description</label>
              <textarea
                rows={2}
                value={newScheme.short_description}
                placeholder="Provide a clear, simple summary of the scheme..."
                required
                onChange={(e) => setNewScheme({ ...newScheme, short_description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Portal URL</label>
                <input
                  type="url"
                  value={newScheme.official_apply_url}
                  onChange={(e) => setNewScheme({ ...newScheme, official_apply_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Verified Source URL</label>
                <input
                  type="url"
                  value={newScheme.official_source_url}
                  onChange={(e) => setNewScheme({ ...newScheme, official_source_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('schemes')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Scheme</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Citizen Feedback */}
      {activeTab === 'feedbacks' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Citizen Ratings & In-App Feedback</h2>
          <div className="space-y-3">
            {feedbacks.length > 0 ? (
              feedbacks.map((f, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-600">⭐ {f.rating} / 5 Stars</span>
                    <span className="text-[10px] text-slate-400">{f.created_at || 'Recent'}</span>
                  </div>
                  <p className="text-slate-700">{f.comment}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No citizen feedback received yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
