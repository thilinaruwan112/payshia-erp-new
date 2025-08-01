

import { PaymentForm } from '@/components/payment-form';
import { chartOfAccounts, suppliers } from '@/lib/data';
import { Suspense } from 'react';

function NewPaymentPageContent() {
  const paymentAccounts = chartOfAccounts.filter(acc => acc.type === 'Asset');

  return (
    <PaymentForm
      suppliers={suppliers}
      paymentAccounts={paymentAccounts}
    />
  );
}

export default function NewPaymentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewPaymentPageContent />
        </Suspense>
    )
}
