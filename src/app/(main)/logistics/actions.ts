
'use server';

import { suggestVendor } from '@/ai/flows/logistics';
import { LogisticsQuerySchema } from '@/ai/schemas';

type FormState = {
  suggestion: string;
  error: string;
};

export async function getLogisticsSuggestion(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawData = {
    packageDetails: formData.get('packageDetails'),
    destination: formData.get('destination'),
    urgency: formData.get('urgency'),
  };

  const parsed = LogisticsQuerySchema.safeParse(rawData);

  if (!parsed.success) {
    const errorMessages = parsed.error.errors.map(e => e.message).join(', ');
    return { error: errorMessages, suggestion: '' };
  }

  try {
    const suggestion = await suggestVendor(parsed.data);
    return { suggestion, error: '' };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to get suggestion from AI.', suggestion: '' };
  }
}
