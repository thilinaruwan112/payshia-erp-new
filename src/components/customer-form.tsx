
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
import { Star } from 'lucide-react';
import { Textarea } from './ui/textarea';

const customerFormSchema = z.object({
  name: z.string().min(3, 'Customer name is required.'),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  loyaltyPoints: z.coerce.number().min(0, "Points must be non-negative.").optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  customer?: User;
}

const getLoyaltyTier = (points: number) => {
  if (points >= 500) return 'Platinum';
  if (points >= 250) return 'Gold';
  if (points >= 100) return 'Silver';
  return 'Bronze';
};

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const defaultValues: Partial<CustomerFormValues> = {
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    loyaltyPoints: customer?.loyaltyPoints || 0,
  };

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const watchedPoints = form.watch('loyaltyPoints') || 0;
  const currentTier = getLoyaltyTier(watchedPoints);

  function onSubmit(data: CustomerFormValues) {
    console.log(data);
    toast({
      title: customer ? 'Customer Updated' : 'Customer Created',
      description: `The customer "${data.name}" has been saved.`,
    });
    router.push('/customers');
  }

  const pageTitle = customer ? `Edit Customer: ${customer.name}` : 'Create Customer';
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
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
                          <FormLabel>Email</FormLabel>
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
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 123-456-7890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Address</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <Textarea
                                        placeholder="123 Main St, Anytown, USA"
                                        className="resize-none"
                                        rows={4}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Loyalty Program</CardTitle>
                        <CardDescription>
                          Manage the customer's loyalty points and tier.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="loyaltyPoints"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Loyalty Points</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Current Tier</p>
                          <p className="text-lg font-bold flex items-center gap-2">
                             <Star className="w-5 h-5 text-yellow-400" />
                            {currentTier}
                          </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </form>
    </Form>
  );
}
