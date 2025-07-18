
'use server';
/**
 * @fileOverview A logistics assistant AI flow.
 *
 * - suggestVendor - A function that suggests a shipping vendor based on order details.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { LogisticsQuery } from '@/ai/schemas';
import { LogisticsQuerySchema } from '@/ai/schemas';

const logisticsFlow = ai.defineFlow(
  {
    name: 'logisticsFlow',
    inputSchema: LogisticsQuerySchema,
    outputSchema: z.string(),
  },
  async (query) => {
    const prompt = `
      You are a logistics assistant for an ERP system called BranchBrain.
      Given the following order requirements, suggest a suitable shipping vendor and explain why.
      Be concise and helpful. Format your response as clean HTML.

      Order Details:
      - Package: ${query.packageDetails}
      - Destination: ${query.destination}
      - Urgency: ${query.urgency}

      Start your response with a <h4> tag for the suggested vendor.
    `;

    const {text} = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.0-flash',
    });

    return text;
  }
);

export async function suggestVendor(query: LogisticsQuery): Promise<string> {
  return await logisticsFlow(query);
}
