
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
       <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:400,500,600,700&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body className="print:bg-white print:text-black bg-gray-100 dark:bg-gray-800">
        <main className="flex justify-center">
            {children}
        </main>
      </body>
    </html>
  );
}
