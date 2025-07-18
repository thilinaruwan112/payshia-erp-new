/**
 * @fileOverview Defines shared Zod schemas for AI flows.
 */

import {z} from 'zod';

export const LogisticsQuerySchema = z.object({
  packageDetails: z
    .string()
    .min(3, 'Package details must be at least 3 characters.')
    .describe('Details of the package (e.g., dimensions, weight)'),
  destination: z
    .string()
    .min(2, 'Destination must be at least 2 characters.')
    .describe('Shipping destination'),
  urgency: z.string().describe('How urgent the shipment is (e.g., standard, express)'),
});

export type LogisticsQuery = z.infer<typeof LogisticsQuerySchema>;
