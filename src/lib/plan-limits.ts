
import { plans } from './mock-data/plans';
import type { Plan, Location } from './types';

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

  // Since we can't do top-level await for fetches in this file,
  // we'll have to rely on pages to fetch their own data and this
  // function will be less accurate for server components.
  // For client components, they should fetch and pass usage.

  switch (type) {
    case 'products':
      limit = currentPlan.limits.products;
      // Usage should be fetched from the API on the calling page
      break;
    case 'locations':
       limit = currentPlan.limits.locations;
       try {
        const response = await fetch('https://server-erp.payshia.com/locations');
        const data: Location[] = await response.json();
        usage = data.length;
      } catch (e) {
        usage = 999; // Assume limit is reached if API fails
      }
      break;
    case 'orders':
       limit = currentPlan.limits.orders;
       // In a real app, you'd filter orders by the current month
       // Usage should be fetched from the API
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
