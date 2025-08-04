
"use client";

import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLoading } from './use-loading';
import { upsertUser, createUser, verifyPassword, fetchAllUsers } from '@/actions/data-actions';
import useSWR from 'swr';
import type { User } from '@/lib/types';


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
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function localLogin(user: User) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('authUser', JSON.stringify({id: user.id, email: user.email}));
    }
}

function localLogout() {
     if (typeof window !== 'undefined') {
        localStorage.removeItem('authUser');
    }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('authUser');
        return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const { setLoading: setAppLoading } = useLoading();
  const router = useRouter();
  
  // This effect only runs on the client, after the initial render.
  useEffect(() => {
    const savedUser = localStorage.getItem('authUser');
    if (savedUser) {
        setAuthUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);


  const login = async (email: string, password: string) => {
    setAppLoading(true);
    try {
      const user = await verifyPassword(email, password);
      if (user) {
        setAuthUser({id: user.id, email: user.email});
        localLogin(user);
        return { success: true };
      } else {
        return { success: false, message: 'Invalid credentials' };
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
      await createUser(fullName, email, password);
      return { success: true, message: 'Signup successful! You can now log in.' };
    } catch (e: any) {
        return { success: false, message: e.message || "An unexpected error occurred during signup." };
    } finally {
        setAppLoading(false);
    }
  };

  const logout = useCallback(async () => {
    localLogout();
    setAuthUser(null);
    // Use a hard reload to ensure all state is cleared
    window.location.href = '/login';
  }, []);
  
  const forgotPassword = async (email: string) => {
    setAppLoading(true);
    // This needs to be adapted if not using Supabase Auth for password resets
    // For now, we'll just show a message.
    console.warn("forgotPassword needs to be implemented for custom auth");
    setAppLoading(false);
    return { success: true, message: 'If an account exists, a password reset link has been sent (Feature under development).' };
  };

  const value = useMemo(
    () => ({
      authUser,
      loading,
      login,
      logout,
      signup,
      forgotPassword,
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


export const useUser = () => {
    const { authUser, loading: authLoading } = useAuth();
    const { data: allUsers, isLoading: usersLoading } = useSWR<User[]>(authUser ? 'allUsers' : null, fetchAllUsers);

    const user = useMemo(() => {
        if (!authUser || !allUsers) return null;
        return allUsers.find(u => u.id === authUser.id) || null;
    }, [authUser, allUsers]);

    return { data: user, isLoading: authLoading || usersLoading };
};

export const useAdminUser = () => {
    const { data: allUsers, isLoading } = useSWR<User[]>('allUsers', fetchAllUsers);
    const adminUser = React.useMemo(() => allUsers?.find(u => u.role === 'admin'), [allUsers]);
    return { adminUser, isLoading };
};
