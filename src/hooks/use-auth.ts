
"use client";

import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import { useLoading } from './use-loading';

interface AuthContextType {
  authUser: AuthUser | null;
  loading: boolean;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  signup: (fullName: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean, message: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { setLoading: setAppLoading } = useLoading();
  const router = useRouter();

  useEffect(() => {
    const getInitialSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setAuthUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthUser(session?.user ?? null);
        if (_event === 'SIGNED_OUT') {
           router.push('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const loginWithPassword = async (email: string, password: string) => {
    setAppLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message || 'Login failed' };
    } finally {
      setAppLoading(false);
    }
  };

  const signup = async (fullName: string, email: string, password: string) => {
    setAppLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Could not create user account.");
        
      const userRole = email.toLowerCase() === 'sunnyjajoriya2003@gmail.com' ? 'admin' : 'student';

      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          fullName,
          email,
          role: userRole,
          createdAt: Date.now(),
        });

      if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }
      
      return { success: true };
    } catch (e: any) {
        console.error("Signup Catch Block Error: ", e);
        return { success: false, message: e.message || "An unexpected error occurred during signup." };
    } finally {
        setAppLoading(false);
    }
  };

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);


  const forgotPassword = async (email: string) => {
    setAppLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/profile/update-password`,
      });
      if (error) throw error;
      return { success: true, message: 'Password reset link sent to your email.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error during password reset.' };
    } finally {
      setAppLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      authUser,
      loading,
      loginWithPassword,
      logout,
      signup,
      forgotPassword,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authUser, loading]
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
