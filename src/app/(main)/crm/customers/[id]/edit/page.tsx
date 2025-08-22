
'use client'

import { CustomerForm } from '@/components/customer-form';
import { useToast } from '@/hooks/use-toast';
import { type User } from '@/lib/types';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function EditCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const [customer, setCustomer] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCustomer() {
        if (!params.id) {
            notFound();
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`https://server-erp.payshia.com/customers/${params.id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    notFound();
                }
                throw new Error('Failed to fetch customer data.');
            }
            const data = await response.json();
            setCustomer(data);
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error loading customer',
                description: error instanceof Error ? error.message : 'An unknown error occurred.',
            });
        } finally {
            setIsLoading(false);
        }
    }
    fetchCustomer();
  }, [params.id, toast]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <Skeleton className="h-9 w-64" />
                 <Skeleton className="h-4 w-80 mt-2" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                 <Skeleton className="h-10 w-24" />
                 <Skeleton className="h-10 w-24" />
            </div>
        </div>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return <div>Customer not found.</div>
  }

  return <CustomerForm customer={customer} />;
}
