
'use client';

import { AppShell } from '@/components/app-shell';
import { CurrencyProvider } from '@/components/currency-provider';
import { LocationProvider } from '@/components/location-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const companyId = localStorage.getItem('companyId');

    if (!userId) {
      router.replace('/login');
    } else if (!companyId) {
      // If user is logged in but has no company, redirect to create one
      router.replace('/company/create');
    }
    else {
      setIsVerifying(false);
    }
  }, [router]);

  if (isVerifying) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <CurrencyProvider>
        <LocationProvider>
          <AppShell>{children}</AppShell>
        </LocationProvider>
      </CurrencyProvider>
    </SidebarProvider>
  );
}
