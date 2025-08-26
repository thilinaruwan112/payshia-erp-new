
'use client';

import type { Metadata } from 'next';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { LocationProvider } from '@/components/location-provider';
import { CurrencyProvider } from '@/components/currency-provider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function POSLayout({
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
      <html lang="en" suppressHydrationWarning>
        <body className="font-body antialiased">
          <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:400,500,600,700&family=Roboto:400,500,700&display=swap"
          rel="stylesheet"
        ></link>
        <title>Payshia POS</title>
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <CurrencyProvider>
            <LocationProvider>{children}</LocationProvider>
          </CurrencyProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
