
import { PlanForm } from '@/components/plan-form';
import { plans } from '@/lib/data';
import { notFound } from 'next/navigation';

export default function EditPlanPage({ params }: { params: { id: string } }) {
  const plan = plans.find((p) => p.id === params.id);

  if (!plan) {
    notFound();
  }

  return <PlanForm plan={plan} />;
}
