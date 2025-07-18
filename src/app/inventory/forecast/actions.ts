'use server';

import { forecastInventory, type ForecastInventoryInput } from '@/ai/flows/inventory-forecasting';
import { z } from 'zod';

const formSchema = z.object({
  productName: z.string().min(1, 'Product name is required.'),
  pastSalesData: z.string().min(1, 'Past sales data is required.'),
  seasonalTrends: z.string().min(1, 'Seasonal trends are required.'),
});

export async function getForecast(values: z.infer<typeof formSchema>) {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: 'Invalid input.',
    };
  }

  try {
    const result = await forecastInventory(validatedFields.data as ForecastInventoryInput);
    return { data: result };
  } catch (error) {
    console.error(error);
    return {
      error: 'Failed to generate forecast. Please try again.',
    };
  }
}
