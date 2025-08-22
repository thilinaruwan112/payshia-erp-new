
'use client'

import React, { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { subDays, format, addDays, isAfter } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from './location-provider';
import type { Order } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

export function SalesChart() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { company_id } = useLocation();

  useEffect(() => {
    if (!company_id) {
        setIsLoading(false);
        return;
    }
    async function fetchSalesData() {
        setIsLoading(true);
        try {
            const response = await fetch(`https://server-erp.payshia.com/orders/company?company_id=${company_id}`);
            if (!response.ok) throw new Error('Failed to fetch sales data');
            const orders: Order[] = await response.json();
            
            const sevenDaysAgo = subDays(new Date(), 7);
            const relevantOrders = orders.filter((order) =>
                isAfter(new Date(order.date), sevenDaysAgo)
            );

            const dailySales = new Map<string, number>();
            for (let i = 0; i < 7; i++) {
                const date = format(addDays(sevenDaysAgo, i + 1), 'yyyy-MM-dd');
                dailySales.set(date, 0);
            }

            relevantOrders.forEach((order) => {
                if (order.status !== 'Cancelled') {
                    const date = format(new Date(order.date), 'yyyy-MM-dd');
                    dailySales.set(date, (dailySales.get(date) || 0) + (order.total || 0));
                }
            });

            const chartData = Array.from(dailySales.entries()).map(([date, total]) => ({
                name: format(new Date(date), 'MMM d'),
                total,
            }));
            setData(chartData);

        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not fetch sales chart data.',
            });
        } finally {
            setIsLoading(false);
        }
    }
    fetchSalesData();
  }, [company_id, toast]);

  if (isLoading) {
    return (
      <div style={{ height: 350 }}>
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))' }}
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))'
          }}
        />
        <Bar dataKey="total" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
