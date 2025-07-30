
import { GrnForm } from '@/components/grn-form';
import { Suspense } from 'react';


export default function NewGrnPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GrnForm />
    </Suspense>
  );
}
