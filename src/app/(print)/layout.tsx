
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
      <body>
        <main className="p-8">
            {children}
        </main>
      </body>
    </html>
  );
}
