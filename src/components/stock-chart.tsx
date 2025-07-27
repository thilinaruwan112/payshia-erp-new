
'use client'

import React, { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { products, inventory } from '@/lib/data';

interface StockChartProps {
    locationId: string;
}

export function StockChart({ locationId }: StockChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!locationId) return;
    const locationInventory = inventory.filter(i => i.locationId === locationId);
    const data = locationInventory.map(item => {
        const product = products.find(p => p.variants.some(v => v.sku === item.sku));
        const variant = product?.variants.find(v => v.sku === item.sku);
        const name = variant?.size || variant?.color ? `${product?.name} (${[variant.color, variant.size].filter(Boolean).join('/')})` : product?.name;
        return { name, stock: item.stock };
    }).sort((a,b) => b.stock - a.stock).slice(0, 10); // Show top 10
    
    setChartData(data);
  }, [locationId]);

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
