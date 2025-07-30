
"use client";

import { useData } from '@/hooks/use-data';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from './loader';
import { useAuth } from '@/hooks/use-auth';

interface AuthGuardProps {
    children: React.ReactNode;
    role?: 'admin' | 'student';
}

export function AuthGuard({ children, role }: AuthGuardProps) {
  const { authUser, loading: authLoading } = useAuth();
  const { user, isLoading: dataLoading } = useData();
  const router = useRouter();

  const isLoading = authLoading || dataLoading;

  useEffect(() => {
    if (isLoading) return;

    if (!authUser || !user) {
      router.push('/login');
      return;
    }
    
    if (role && user.role !== role) {
      router.push(user.role === 'admin' ? '/admin' : '/dashboard');
    }

  }, [authUser, user, isLoading, router, role]);

  if (isLoading || !user || (role && user.role !== role)) {
    return <Loader />;
  }

  return <>{children}</>;
}
