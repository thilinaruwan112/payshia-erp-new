
import { plans, products, locations, orders } from './data';
import type { Plan } from './types';

// In a real app, you'd get this from the user's session or authentication context.
const MOCK_CURRENT_USER_PLAN_ID = 'plan-basic';


type LimitType = 'products' | 'locations' | 'orders';

/**
 * Checks the current user's plan limits for a specific feature.
 */
export async function checkPlanLimit(type: LimitType): Promise<{
  hasAccess: boolean;
  limit: number;
  usage: number;
  name: string;
}> {
  const currentPlan = plans.find((p) => p.id === MOCK_CURRENT_USER_PLAN_ID);

  if (!currentPlan) {
    // Default to a restricted state if the plan isn't found
    return { hasAccess: false, limit: 0, usage: 0, name: 'Unknown' };
  }

  let limit = Infinity;
  let usage = 0;

  switch (type) {
    case 'products':
      limit = currentPlan.limits.products;
      usage = products.length;
      break;
    case 'locations':
      limit = currentPlan.limits.locations;
      usage = locations.length;
      break;
    case 'orders':
       limit = currentPlan.limits.orders;
       // In a real app, you'd filter orders by the current month
       usage = orders.length;
       break;
  }
  
  // Handle "unlimited" plans where limit is Infinity or -1
  if (limit === Infinity || limit === -1) {
    return { hasAccess: true, limit: Infinity, usage, name: currentPlan.name };
  }

  return {
    hasAccess: usage < limit,
    limit,
    usage,
    name: currentPlan.name,
  };
}

/**
 * Checks if the user has access to a non-limit based feature.
 */
export async function checkFeatureAccess(featureName: string): Promise<boolean> {
    const currentPlan = plans.find((p) => p.id === MOCK_CURRENT_USER_PLAN_ID);
    if (!currentPlan) return false;

    return currentPlan.features.some(f => f.toLowerCase().includes(featureName.toLowerCase()));
}
