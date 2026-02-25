import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type SkinType = 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive';
export type SensitivityLevel = 'low' | 'medium' | 'high';

export interface UserProfile {
  displayName: string;
  email: string;
  password: string;
  skinType: SkinType;
  sensitivity: SensitivityLevel;
  skinProblems: string[];
  profileImageUri: string | null;
}

const defaultProfile: UserProfile = {
  displayName: 'Nisa',
  email: 'azra@example.com',
  password: '',
  skinType: 'combination',
  sensitivity: 'medium',
  skinProblems: ['Kuru Cilt', 'Akne İzleri', 'Hassasiyet'],
  profileImageUri: null,
};

type UserProfileContextType = {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setProfileImage: (uri: string | null) => void;
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(defaultProfile);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfileState((prev) => ({ ...prev, ...updates }));
  }, []);

  const setProfileImage = useCallback((uri: string | null) => {
    setProfileState((prev) => ({ ...prev, profileImageUri: uri }));
  }, []);

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile, setProfileImage }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider');
  return ctx;
}
