
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { plans } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Check, Settings } from 'lucide-react';
import Link from 'next/link';

export default function BillingPage() {
  const currentPlanId = 'plan-pro'; // Mock current plan

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing details.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/billing/plans">
            <Settings className="mr-2 h-4 w-4" />
            Manage Plans
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              'flex flex-col h-full',
              plan.id === currentPlanId && 'border-primary ring-2 ring-primary'
            )}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="flex items-baseline pt-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={plan.id === currentPlanId}
              >
                {plan.id === currentPlanId ? 'Current Plan' : plan.ctaLabel}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
