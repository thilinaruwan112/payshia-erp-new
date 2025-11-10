
import '../globals.css';
import { CurrencyProvider } from '@/components/currency-provider';

export default function PrintLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <CurrencyProvider>
        <main className="bg-gray-100 flex items-start justify-center p-4 sm:p-8 font-[Poppins] print:bg-white print:text-black print:p-0">
            {children}
        </main>
      </CurrencyProvider>
  );
}
