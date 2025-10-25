'use client';

import Image from 'next/image';

export const PayshiaPosLogo = () => (
    <div className="flex items-center gap-2">
      <Image src="https://content-provider.payshia.com/payshia-erp/branding/payshia-erp-logo-01.webp" alt="Payshia ERP Logo" width={32} height={32} />
      <span className="text-xl font-bold">Payshia POS</span>
    </div>
);
