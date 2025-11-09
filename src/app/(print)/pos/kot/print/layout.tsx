
'use client'
import '../../../globals.css';
import '../../print-receipt.css';

export default function KOTPrintLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <main className="flex items-start justify-center font-[Poppins] print:bg-white print:text-black">
            {children}
        </main>
  );
}
