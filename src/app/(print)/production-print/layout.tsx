

import { CurrencyProvider } from '@/components/currency-provider';
import '../../globals.css';

export default function ProductionPrintLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <CurrencyProvider>
        <main className="flex items-center justify-center font-[Poppins] print:bg-white print:text-black">
            {children}
        </main>
      </CurrencyProvider>
  );
}
