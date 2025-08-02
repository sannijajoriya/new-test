
"use client";

import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLoading } from './use-loading';
import { createUser, verifyPassword } from '@/actions/data-actions';

// This is a simplified AuthUser for the context, focusing only on what's needed client-side.
// The full user object with roles will come from useData hook.
export interface AuthUser {
    id: string;
    email: string;
}

interface AuthContextType {
  authUser: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  signup: (fullName: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'udaan_sarthi_auth_session';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { setLoading: setAppLoading } = useLoading();
  const router = useRouter();

  useEffect(() => {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        if (session) {
            setAuthUser(JSON.parse(session));
        }
    } catch (error) {
        console.error("Failed to parse auth session", error);
        localStorage.removeItem(SESSION_KEY);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setAppLoading(true);
    try {
      const user = await verifyPassword(email, password);
      if (user) {
        const sessionUser = { id: user.id, email: user.email };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
        setAuthUser(sessionUser);
        return { success: true };
      } else {
        return { success: false, message: "Invalid email or password." };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Login failed' };
    } finally {
      setAppLoading(false);
    }
  };

  const signup = async (fullName: string, email: string, password: string) => {
    setAppLoading(true);
    try {
      const newUser = await createUser(fullName, email, password);
      return { success: true };
    } catch (e: any) {
        console.error("Signup Catch Block Error: ", e);
        return { success: false, message: e.message || "An unexpected error occurred during signup." };
    } finally {
        setAppLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setAuthUser(null);
    router.push('/login');
  }, [router]);

  const value = useMemo(
    () => ({
      authUser,
      loading,
      login,
      logout,
      signup,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authUser, loading, logout]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
