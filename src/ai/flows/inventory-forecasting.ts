// 'use server';
/**
 * @fileOverview Inventory forecasting AI agent.
 *
 * - forecastInventory - A function that handles the inventory forecasting process.
 * - ForecastInventoryInput - The input type for the forecastInventory function.
 * - ForecastInventoryOutput - The return type for the forecastInventory function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ForecastInventoryInputSchema = z.object({
  productName: z.string().describe('The name of the product to forecast.'),
  pastSalesData: z
    .string()
    .describe(
      'Historical sales data for the product, including dates and quantities sold.'
    ),
  seasonalTrends: z
    .string()
    .describe(
      'Information about seasonal sales variations, such as peak seasons or months.'
    ),
});
export type ForecastInventoryInput = z.infer<typeof ForecastInventoryInputSchema>;

const ForecastInventoryOutputSchema = z.object({
  reorderPoint: z
    .number()
    .describe(
      'The calculated reorder point for the product, indicating when to reorder.'
    ),
  reorderQuantity: z
    .number()
    .describe(
      'The recommended quantity to reorder to avoid stockouts and excess inventory.'
    ),
  forecastExplanation: z
    .string()
    .describe(
      'An explanation of the factors considered in the forecast and the reasoning behind the recommendations.'
    ),
});
export type ForecastInventoryOutput = z.infer<typeof ForecastInventoryOutputSchema>;

export async function forecastInventory(input: ForecastInventoryInput): Promise<ForecastInventoryOutput> {
  return forecastInventoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'forecastInventoryPrompt',
  input: {schema: ForecastInventoryInputSchema},
  output: {schema: ForecastInventoryOutputSchema},
  prompt: `You are an expert inventory analyst specializing in forecasting product demand and optimizing reorder points.

  Based on the provided sales data and seasonal trends, you will calculate the optimal reorder point and reorder quantity for a given product. You will also provide a clear explanation of the factors considered in the forecast and the reasoning behind your recommendations.

  Product Name: {{{productName}}}
  Past Sales Data: {{{pastSalesData}}}
  Seasonal Trends: {{{seasonalTrends}}}
  \nOutput reorderPoint, reorderQuantity, and forecastExplanation.
`,
});

const forecastInventoryFlow = ai.defineFlow(
  {
    name: 'forecastInventoryFlow',
    inputSchema: ForecastInventoryInputSchema,
    outputSchema: ForecastInventoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
