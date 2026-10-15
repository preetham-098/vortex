'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '@/types';
import { auth, googleProvider } from '@/lib/firebase/client';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { isFirebaseConfigured } from '@/lib/firebase/config';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  organizationId: string;
  loading: boolean;
  isFirebaseActive: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchMockRole: (role: UserRole) => void;
  switchOrganization: (orgId: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'manager',
  organizationId: 'org_amc_default',
  loading: true,
  isFirebaseActive: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  switchMockRole: () => {},
  switchOrganization: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>({
    uid: 'user_manager_1',
    name: 'Sarah Connor (Manager)',
    email: 'sarah.connor@amc-workforce.io',
    role: 'manager',
    organizationId: 'org_amc_default',
    createdAt: '2026-01-01T00:00:00.000Z',
  });
  const [role, setRole] = useState<UserRole>('manager');
  const [organizationId, setOrganizationId] = useState<string>('org_amc_default');
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(false);

  useEffect(() => {
    const configured = isFirebaseConfigured();
    setIsFirebaseActive(configured);

    if (configured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const profile: User = {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Authenticated User',
            email: fbUser.email || '',
            role: 'manager', // Default to manager for HackAttack evaluation
            organizationId,
            createdAt: new Date().toISOString(),
          };
          setUser(profile);
          setRole(profile.role);
        } else {
          // If logged out from Firebase, use default manager demo
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [organizationId]);

  const signInWithGoogle = async () => {
    if (auth && googleProvider) {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err) {
        console.error('Google Sign-In failed:', err);
        throw err;
      }
    } else {
      // In demo mode without Firebase credentials
      const demoUser: User = {
        uid: 'user_google_demo',
        name: 'Alex Rivera (Google Demo)',
        email: 'alex.rivera@amc-demo.com',
        role: 'manager',
        organizationId,
        createdAt: new Date().toISOString(),
      };
      setUser(demoUser);
      setRole('manager');
    }
  };

  const signOut = async () => {
    if (auth) {
      await fbSignOut(auth);
    }
    setUser(null);
  };

  const switchMockRole = (newRole: UserRole) => {
    setRole(newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  const switchOrganization = (newOrgId: string) => {
    setOrganizationId(newOrgId);
    if (user) {
      setUser({ ...user, organizationId: newOrgId });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        organizationId,
        loading,
        isFirebaseActive,
        signInWithGoogle,
        signOut,
        switchMockRole,
        switchOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
