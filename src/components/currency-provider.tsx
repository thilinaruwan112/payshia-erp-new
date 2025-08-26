
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { currencies } from '@/lib/currencies';

type CurrencyCode = 'LKR' | 'USD' | 'EUR' | 'GBP' | 'JPY';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    if (typeof window !== 'undefined') {
      const savedCurrency = localStorage.getItem('erp-currency');
      return (savedCurrency as CurrencyCode) || 'LKR';
    }
    return 'LKR';
  });

  useEffect(() => {
    localStorage.setItem('erp-currency', currency);
  }, [currency]);

  const currencySymbol = useMemo(() => {
    const found = currencies.find(c => c.code === currency);
    return found ? `${found.symbol} ` : 'Rs ';
  }, [currency]);

  const value = useMemo(() => ({
    currency,
    setCurrency: (newCurrency: string) => setCurrency(newCurrency as CurrencyCode),
    currencySymbol
  }), [currency, currencySymbol]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
