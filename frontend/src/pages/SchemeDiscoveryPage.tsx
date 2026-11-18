import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Scheme } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { SchemeCard } from '../components/SchemeCard';
import {
  Search,
  Filter,
  RotateCcw,
  Layers,
  Sparkles,
  Landmark,
  MapPin,
  Briefcase,
  Wallet,
  ShieldAlert,
} from 'lucide-react';

interface SchemeDiscoveryPageProps {
  initialCategory?: string;
  onViewDetails: (schemeId: number) => void;
  onCheckEligibility: (schemeId: number) => void;
  onOpenActionPlan: (schemeId: number) => void;
}

export const SchemeDiscoveryPage: React.FC<SchemeDiscoveryPageProps> = ({
  initialCategory,
  onViewDetails,
  onCheckEligibility,
  onOpenActionPlan,
}) => {
  const { language, t } = useLanguage();
  const { profile } = useUser();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [selectedOccupation, setSelectedOccupation] = useState<string>('All');
  const [statesList, setStatesList] = useState<any[]>([]);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const data = await api.getStates();
        setStatesList(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchStates();
  }, []);

  const loadSchemes = async () => {
    setLoading(true);
    try {
      const data = await api.getSchemes({
        search: search.trim() || undefined,
        state: selectedState !== 'All' ? selectedState : undefined,
        level: selectedLevel !== 'All' ? selectedLevel : undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        occupation: selectedOccupation !== 'All' ? selectedOccupation : undefined,
        language: language,
      });
      setSchemes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, [selectedState, selectedLevel, selectedCategory, selectedOccupation, language]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSchemes();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedState('All');
    setSelectedLevel('All');
    setSelectedCategory('All');
    setSelectedOccupation('All');
  };

  const categories = [
    'All',
    'Agriculture',
    'Healthcare',
    'Education',
    'Women and Child Welfare',
    'Housing',
    'Business and Entrepreneurship',
    'Employment',
    'Pension',
    'Social Welfare',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-900">
            Welfare Scheme Catalog
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Discover Government Schemes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, and evaluate verified welfare schemes across all states and sectors.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schemes, keywords, benefits..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
        </form>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-700" />
            <span>Filter Catalog</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* State Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">State / UT</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All States & UTs</option>
              {statesList.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Authority Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Levels</option>
              <option value="Central">Central Govt Schemes</option>
              <option value="State">State Govt Schemes</option>
            </select>
          </div>

          {/* Occupation Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Beneficiary Group</label>
            <select
              value={selectedOccupation}
              onChange={(e) => setSelectedOccupation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Occupations</option>
              <option value="Farmer">Farmers</option>
              <option value="Student">Students & Youth</option>
              <option value="Homemaker">Women & Mothers</option>
              <option value="Daily Wage / Laborer">Unorganized Workers</option>
              <option value="Senior Citizen / Retired">Senior Citizens</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Welfare Sector</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {categories.map((c, i) => (
                <option key={i} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scheme Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-slate-500">
            Showing <strong className="text-slate-800">{schemes.length}</strong> verified government schemes
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-white border border-slate-200 p-6 animate-pulse space-y-4"
              >
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-12 bg-slate-100 rounded w-full"></div>
                <div className="h-10 bg-slate-200 rounded w-full mt-4"></div>
              </div>
            ))}
          </div>
        ) : schemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schemes.map((scheme) => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                onViewDetails={onViewDetails}
                onCheckEligibility={onCheckEligibility}
                onOpenActionPlan={onOpenActionPlan}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No schemes found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No government schemes match the selected filters. Try resetting the filters or searching for general keywords like "farmer", "health", or "student".
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
