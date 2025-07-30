'use client';

import React, { useState, createContext, useContext, useMemo, useCallback } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const value = useMemo(() => ({ isLoading, setLoading }), [isLoading, setLoading]);

  return React.createElement(LoadingContext.Provider, { value }, children);
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === null) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
