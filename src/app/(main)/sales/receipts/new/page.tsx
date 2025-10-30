
'use client';

import { ReceiptForm } from '@/components/receipt-form';
import type { User, PaymentMethod } from '@/lib/types';
import { fetcher } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from '@/components/location-provider';


export default function NewReceiptPage() {
    const [customers, setCustomers] = useState<User[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { company_id } = useLocation();

    useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        }
        async function getData() {
            setIsLoading(true);
            try {
                const [customerResponse, paymentMethodResponse] = await Promise.all([
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/company/filter/?company_id=${company_id}`),
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/payment-method/filter/by-company?company_id=${company_id}`)
                ]);
                
                if (!customerResponse.ok) throw new Error('Failed to fetch customers');
                if (!paymentMethodResponse.ok) throw new Error('Failed to fetch payment methods');
                
                const customersData = await customerResponse.json();
                const paymentMethodsData = await paymentMethodResponse.json();
                
                setCustomers(customersData || []);
                setPaymentMethods(paymentMethodsData || []);

            } catch (error) {
                console.error("Failed to fetch receipt data:", error);
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch required data for the form.'
                });
            } finally {
                setIsLoading(false);
            }
        }
        getData();
    }, [toast, company_id]);

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    return <ReceiptForm customers={customers} paymentMethods={paymentMethods} />;
}
