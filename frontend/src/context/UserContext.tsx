import React, { createContext, useContext, useState, useEffect } from 'react';
import { CitizenProfile } from '../types';
import { api } from '../services/api';

export interface UserAccount {
  id?: number;
  email?: string;
  phone_number?: string;
  full_name?: string;
  profile_picture?: string;
  auth_provider?: string;
  role?: string;
  created_at?: string;
}

interface UserContextType {
  currentUser: UserAccount | null;
  profile: CitizenProfile | null;
  loading: boolean;
  savedSchemeIds: number[];
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<CitizenProfile>) => Promise<void>;
  isSchemeSaved: (schemeId: number) => boolean;
  toggleSaveScheme: (schemeId: number) => Promise<void>;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, phone?: string) => Promise<void>;
  loginWithGoogle: (payload: { credential?: string; email?: string; full_name?: string; picture?: string; google_id?: string }) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('benefitbridge_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

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
      console.warn('Failed to load profile from backend, using default state:', err);
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

  // Verify and sync current user session on mount
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('benefitbridge_token');
      if (token) {
        try {
          const userMe = await api.getCurrentUser();
          const userObj: UserAccount = {
            id: userMe.id,
            email: userMe.email,
            phone_number: userMe.phone_number,
            full_name: userMe.full_name,
            profile_picture: userMe.profile_picture,
            auth_provider: userMe.auth_provider,
            role: 'CITIZEN',
            created_at: userMe.created_at,
          };
          setCurrentUser(userObj);
          localStorage.setItem('benefitbridge_user', JSON.stringify(userObj));
        } catch (e) {
          console.warn('Session verification notice: user session refreshed or logged out');
        }
      }
      await refreshProfile();
    };
    verifySession();
  }, []);

  const login = async (emailOrPhone: string, password: string) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_or_phone: emailOrPhone, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    const userObj: UserAccount = {
      id: data.user_id,
      email: data.email || emailOrPhone,
      full_name: data.full_name || emailOrPhone.split('@')[0],
      profile_picture: data.profile_picture,
      auth_provider: data.auth_provider || 'local',
      role: data.role || 'CITIZEN',
      created_at: data.created_at,
    };
    setCurrentUser(userObj);
    localStorage.setItem('benefitbridge_token', data.access_token);
    localStorage.setItem('benefitbridge_user', JSON.stringify(userObj));
    await refreshProfile();
  };

  const register = async (fullName: string, email: string, password: string, phone?: string) => {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email, password, phone_number: phone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    const data = await res.json();
    const userObj: UserAccount = {
      id: data.user_id,
      email,
      full_name: fullName || data.full_name,
      profile_picture: data.profile_picture,
      auth_provider: data.auth_provider || 'local',
      role: data.role || 'CITIZEN',
      created_at: data.created_at,
    };
    setCurrentUser(userObj);
    localStorage.setItem('benefitbridge_token', data.access_token);
    localStorage.setItem('benefitbridge_user', JSON.stringify(userObj));
    await refreshProfile();
  };

  const loginWithGoogle = async (payload: {
    credential?: string;
    email?: string;
    full_name?: string;
    picture?: string;
    google_id?: string;
  }) => {
    const data = await api.loginWithGoogle(payload);
    const userObj: UserAccount = {
      id: data.user_id,
      email: data.email || payload.email,
      full_name: data.full_name || payload.full_name,
      profile_picture: data.profile_picture || payload.picture,
      auth_provider: 'google',
      role: data.role || 'CITIZEN',
      created_at: data.created_at,
    };
    setCurrentUser(userObj);
    localStorage.setItem('benefitbridge_token', data.access_token);
    localStorage.setItem('benefitbridge_user', JSON.stringify(userObj));
    await refreshProfile();
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('benefitbridge_token');
    localStorage.removeItem('benefitbridge_user');
    refreshProfile();
  };

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
        currentUser,
        profile,
        loading,
        savedSchemeIds,
        refreshProfile,
        updateProfile,
        isSchemeSaved,
        toggleSaveScheme,
        login,
        register,
        loginWithGoogle,
        logout,
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
