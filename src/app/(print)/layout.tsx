
import type { Metadata } from 'next';
import '../globals.css';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Payshia ERP - Print View',
};

export default function PrintLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
          <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" strategy="beforeInteractive"></Script>
          <Script src="https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.3.5/bluebird.min.js" strategy="beforeInteractive"></Script>
          <Script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" strategy="beforeInteractive"></Script>
      </head>
      <body className="print:bg-white print:text-black bg-gray-100 dark:bg-gray-800 font-[Poppins]">
        <main className="flex justify-center">
          {children}
        </main>
        <Script src="https://cdn.jsdelivr.net/npm/jsprintmanager@6.0.3/JSPrintManager.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
