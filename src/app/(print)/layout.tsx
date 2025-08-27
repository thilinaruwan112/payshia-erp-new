
import '../globals.css';
import { CurrencyProvider } from '@/components/currency-provider';

export default function PrintLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <CurrencyProvider>
        <main className="flex justify-center bg-gray-100 dark:bg-gray-800 font-[Poppins] print:bg-white print:text-black">
            {children}
        </main>
      </CurrencyProvider>
  );
}
