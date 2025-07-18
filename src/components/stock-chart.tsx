'use client'

import React, { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { products } from '@/lib/data';

export function StockChart() {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const data = products.map(p => ({ name: p.name, stock: p.stock }));
    setChartData(data);
  }, []);

  if (chartData.length === 0) {
    return (
      <div style={{ height: 350 }} className="flex items-center justify-center">
        <p>Loading chart data...</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} tick={{ textAnchor: 'end' }} />
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
