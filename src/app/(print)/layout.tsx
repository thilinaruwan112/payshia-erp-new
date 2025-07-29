
import type { Metadata } from 'next';
import '../globals.css';

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
      <body className="print:bg-white print:text-black bg-gray-100 dark:bg-gray-800">
        <main className="flex justify-center">
            {children}
        </main>
      </body>
    </html>
  );
}
