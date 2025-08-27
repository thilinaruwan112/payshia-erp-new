
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { Suspense } from 'react';
import { NProgressComponent } from '@/components/ui/nprogress';

export const metadata: Metadata = {
  title: 'Payshia ERP',
  description: 'A scalable and modular web-based ERP system.',
  manifest: '/manifest.json',
  icons: {
    icon: [
        { url: 'https://content-provider.payshia.com/payshia-erp/app-icon/favicon.ico', sizes: 'any', type: 'image/x-icon' },
        { url: 'https://content-provider.payshia.com/payshia-erp/app-icon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: 'https://content-provider.payshia.com/payshia-erp/app-icon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: 'https://content-provider.payshia.com/payshia-erp/app-icon/apple-touch-icon.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:400,500,600,700&family=Roboto:400,500,700&display=swap"
          rel="stylesheet"
        ></link>
        <meta name="theme-color" content="#fb5d01" />
      </head>
      <body className="font-body antialiased">
        <Suspense>
          <NProgressComponent />
        </Suspense>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
