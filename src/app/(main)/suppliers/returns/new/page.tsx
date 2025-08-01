
import { SupplierReturnForm } from '@/components/supplier-return-form';
import { Suspense } from 'react';

export default function NewSupplierReturnPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SupplierReturnForm />
    </Suspense>
  );
}
