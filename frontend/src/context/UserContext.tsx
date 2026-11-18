import React, { createContext, useContext, useState, useEffect } from 'react';
import { CitizenProfile } from '../types';
import { api } from '../services/api';

interface UserContextType {
  profile: CitizenProfile | null;
  loading: boolean;
  savedSchemeIds: number[];
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<CitizenProfile>) => Promise<void>;
  isSchemeSaved: (schemeId: number) => boolean;
  toggleSaveScheme: (schemeId: number) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedSchemeIds, setSavedSchemeIds] = useState<number[]>([]);

  const refreshProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getProfile();
      setProfile(data);
      const saved = await api.getSavedSchemes();
      setSavedSchemeIds(saved.map((s) => s.id));
    } catch (err) {
      console.warn('Failed to load profile from backend, using default demo state:', err);
      // Fallback demo farmer profile for demo robustness
      setProfile({
        age: 42,
        gender: 'Male',
        state: 'Karnataka',
        district: 'Mandya',
        residence_type: 'Rural',
        occupation: 'Farmer',
        annual_family_income: 120000,
        income_range: '1L - 2.5L',
        social_category: 'OBC',
        disability_status: 'None',
        education_level: '10th pass',
        marital_status: 'Married',
        land_holding_acres: 2.5,
        has_bpl_ration_card: true,
        completion_percentage: 90,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const updateProfile = async (data: Partial<CitizenProfile>) => {
    try {
      const updated = await api.updateProfile(data);
      setProfile(updated);
    } catch (err) {
      console.error('Update profile error:', err);
      if (profile) {
        setProfile({ ...profile, ...data });
      }
    }
  };

  const isSchemeSaved = (schemeId: number) => savedSchemeIds.includes(schemeId);

  const toggleSaveScheme = async (schemeId: number) => {
    if (isSchemeSaved(schemeId)) {
      setSavedSchemeIds((prev) => prev.filter((id) => id !== schemeId));
      try {
        await api.unsaveScheme(schemeId);
      } catch (e) {
        console.error(e);
      }
    } else {
      setSavedSchemeIds((prev) => [...prev, schemeId]);
      try {
        await api.saveScheme(schemeId);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <UserContext.Provider
      value={{
        profile,
        loading,
        savedSchemeIds,
        refreshProfile,
        updateProfile,
        isSchemeSaved,
        toggleSaveScheme,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
