
'use client';

import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { LocationProvider } from '@/components/location-provider';
import { CurrencyProvider } from '@/components/currency-provider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PayshiaPosLogo } from '@/components/pos/payshia-pos-logo';

export default function StewardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.replace('/login');
    } else {
      setIsVerifying(false);
    }
  }, [router]);

  if (isVerifying) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
     <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
    >
        <CurrencyProvider>
            <LocationProvider>
                <div className="flex flex-col min-h-screen">
                    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
                        <PayshiaPosLogo />
                    </header>
                    <main className="flex-1 p-4 md:p-6">{children}</main>
                </div>
            </LocationProvider>
        </CurrencyProvider>
        <Toaster />
    </ThemeProvider>
  );
}
