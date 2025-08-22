

'use client'

import React, { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import type { InventoryItem, Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

interface StockChartProps {
    locationId: string;
}

export function StockChart({ locationId }: StockChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!locationId) {
        setIsLoading(false);
        return;
    };
    async function fetchStockData() {
        setIsLoading(true);
        try {
            const [inventoryRes, productsRes] = await Promise.all([
                fetch(`https://server-erp.payshia.com/inventory/location/${locationId}`),
                fetch('https://server-erp.payshia.com/products')
            ]);
            if (!inventoryRes.ok) throw new Error('Failed to fetch inventory');
            if (!productsRes.ok) throw new Error('Failed to fetch products');

            const inventory: InventoryItem[] = await inventoryRes.json();
            const products: Product[] = await productsRes.json();
            
            const data = inventory.map(item => {
                const product = products.find(p => p.variants.some(v => v.sku === item.sku));
                const variant = product?.variants.find(v => v.sku === item.sku);
                const name = variant?.size || variant?.color ? `${product?.name} (${[variant.color, variant.size].filter(Boolean).join('/')})` : product?.name;
                return { name, stock: item.stock };
            }).sort((a,b) => b.stock - a.stock).slice(0, 10);
    
            setChartData(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load stock chart data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchStockData();
  }, [locationId, toast]);

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />
  }

  if (chartData.length === 0) {
    return (
      <div style={{ height: 350 }} className="flex items-center justify-center text-muted-foreground">
        <p>No stock data for this location.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} tick={{ textAnchor: 'end' }} interval={0} />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))' }}
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))'
          }}
        />
        <Legend />
        <Bar dataKey="stock" name="Stock Level" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
