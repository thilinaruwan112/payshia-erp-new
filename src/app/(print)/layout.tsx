
import '../globals.css';
import { CurrencyProvider } from '@/components/currency-provider';

export default function PrintLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <CurrencyProvider>
        <main className="flex items-center h-[100vh] justify-center font-[Poppins] print:bg-white print:text-black">
            {children}
        </main>
      </CurrencyProvider>
  );
}
