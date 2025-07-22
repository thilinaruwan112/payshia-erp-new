
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';

const customerFormSchema = z.object({
  name: z.string().min(3, 'Customer name is required.'),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  phone: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  customer?: User;
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const defaultValues: Partial<CustomerFormValues> = {
    name: customer?.name || '',
    // Assuming customers might not have email or phone, so we need to handle that.
    // The user type does not currently have email/phone, so I'll add them as optional.
  };

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  function onSubmit(data: CustomerFormValues) {
    console.log(data);
    toast({
      title: customer ? 'Customer Updated' : 'Customer Created',
      description: `The customer "${data.name}" has been saved.`,
    });
    router.push('/customers');
  }

  const pageTitle = customer ? 'Edit Customer' : 'Create Customer';
  const pageDescription = customer
    ? 'Update the details for this customer.'
    : 'Add a new customer to your system.';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-nowrap">
              {pageTitle}
            </h1>
            <p className="text-muted-foreground">{pageDescription}</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              className="w-full"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full">
              Save Customer
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Enter the basic contact details for the customer.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="e.g. john.doe@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 123-456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
