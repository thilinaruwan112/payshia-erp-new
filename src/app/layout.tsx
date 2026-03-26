
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { Suspense } from 'react';
import { NProgressComponent } from '@/components/ui/nprogress';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://payshia-erp.web.app';

export const metadata: Metadata = {
  title: {
    default: 'Payshia ERP: All-In-One Business Management System',
    template: '%s | Payshia ERP',
  },
  description: 'A scalable and modular web-based ERP system for managing sales, inventory, CRM, accounting, and more. Featuring AI-powered tools to streamline your operations.',
  keywords: ['ERP', 'business management', 'inventory', 'CRM', 'accounting', 'HRM', 'POS', 'sales', 'logistics', 'AI', 'Payshia'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Payshia ERP: Scalable & Modular Web-Based ERP',
    description: 'An all-in-one solution for managing your sales channels, locations, inventory, and orders with powerful AI features.',
    url: siteUrl,
    siteName: 'Payshia ERP',
    images: [
      {
        url: 'https://content-provider.payshia.com/payshia-erp/seo/payshia-erp-seo-site-image-optimized.webp',
        width: 1200,
        height: 630,
        alt: 'Payshia ERP Dashboard showing key business metrics.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Payshia ERP: Scalable & Modular Web-Based ERP',
    description: 'An all-in-one solution for managing your sales channels, locations, inventory, and orders with powerful AI features.',
    images: ['https://content-provider.payshia.com/payshia-erp/seo/payshia-erp-seo-site-image-optimized.webp'],
  },
  icons: {
    icon: [
        { url: 'https://content-provider.payshia.com/payshia-erp/app-icon/favicon.ico', sizes: 'any', type: 'image/x-icon' },
        { url: 'https://content-provider.payshia.com/payshia-erp/app-icon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: 'https://content-provider.payshia.com/payshia-erp/app-icon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: 'https://content-provider.payshia.com/payshia-erp/app-icon/apple-touch-icon.png' },
    ],
    other: [
        {
            rel: 'android-chrome-192x192',
            url: 'https://content-provider.payshia.com/payshia-erp/app-icon/android-chrome-192x192.png'
        },
        {
            rel: 'android-chrome-512x512',
            url: 'https://content-provider.payshia.com/payshia-erp/app-icon/android-chrome-512x512.png'
        }
    ]
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
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="font-body antialiased">
        <Suspense>
          <NProgressComponent />
        </Suspense>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
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
