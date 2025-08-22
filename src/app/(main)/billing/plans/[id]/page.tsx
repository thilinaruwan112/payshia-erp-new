
import { PlanForm } from '@/components/plan-form';
import type { Plan } from '@/lib/types';
import { notFound } from 'next/navigation';

async function getPlan(id: string): Promise<Plan | null> {
    try {
        const { plans } = await import('@/lib/mock-data/plans');
        return plans.find((p) => p.id === id) || null;
    } catch (error) {
        console.error("Failed to fetch plan", error);
        return null;
    }
}

export default async function EditPlanPage({ params }: { params: { id: string } }) {
  const plan = await getPlan(params.id);

  if (!plan) {
    notFound();
  }

  return <PlanForm plan={plan} />;
}
