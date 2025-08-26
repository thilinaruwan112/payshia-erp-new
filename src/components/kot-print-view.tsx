
'use client';

import React from 'react';

interface KotPrintViewProps {
  invoiceId: string;
  companyId: string | null;
}

export function KotPrintView({ invoiceId, companyId }: KotPrintViewProps) {

  React.useEffect(() => {
    // This will trigger the browser's print dialog.
    setTimeout(() => window.print(), 500);
  }, []);

  return (
    <div className="w-[80mm] bg-white text-black p-4 font-mono text-lg">
      <h1 className="text-2xl font-bold mb-4">KOT Print Debug</h1>
      <div className="space-y-2">
        <div>
          <p className="font-bold">Invoice ID:</p>
          <p>{invoiceId || 'Not provided'}</p>
        </div>
        <div>
          <p className="font-bold">Company ID:</p>
          <p>{companyId || 'Not provided'}</p>
        </div>
      </div>
    </div>
  );
}
