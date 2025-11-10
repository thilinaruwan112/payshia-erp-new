
'use client';

import React, { useState, useEffect } from 'react';
import type { Table as TableType, Invoice } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Utensils, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { fetcher } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/components/currency-provider';

export default function StewardDashboard() {
  const [tables, setTables] = useState<TableType[]>([]);
  const [heldOrders, setHeldOrders] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { company_id, currentLocation } = useLocation();
  const { toast } = useToast();
  const router = useRouter();
  const { currencySymbol } = useCurrency();

  useEffect(() => {
    async function fetchData() {
        if (!company_id || !currentLocation) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [tablesResponse, heldOrdersResponse] = await Promise.all([
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/master-tables/filter/by-company?company_id=${company_id}`),
                fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/invoices/filter/hold/by-company-status?company_id=${company_id}&invoice_status=2`),
            ]);

            if (!tablesResponse.ok) throw new Error('Failed to fetch tables');
            const allTables: TableType[] = await tablesResponse.json() || [];
            const locationTables = allTables.filter(t => t.location_id === currentLocation.location_id);
            setTables(locationTables);

            if (!heldOrdersResponse.ok) throw new Error('Failed to fetch held orders');
            const allHeldOrders: Invoice[] = await heldOrdersResponse.json() || [];
            const locationHeldOrders = allHeldOrders.filter(o => o.location_id === currentLocation.location_id);
            setHeldOrders(locationHeldOrders);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch dashboard data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [company_id, currentLocation, toast]);

  const isTableInUse = (tableId: string) => {
    return heldOrders.some(order => order.table_id === tableId);
  };
  
  const handleTableClick = (table: TableType) => {
    const activeOrder = heldOrders.find(order => order.table_id === table.id);
    if (activeOrder) {
        // If there's an active order, go to the POS and maybe auto-load it (future feature)
        // For now, we can just navigate to the POS page.
        router.push(`/pos-system?orderId=${activeOrder.invoice_number}`);
    } else {
        // If the table is free, navigate to POS and signal to create a new order for this table.
        router.push(`/pos-system?newOrder=dine-in&table=${table.table_name}`);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentLocation) {
    return (
      <div className="text-center text-muted-foreground">
        Please select a location to view the steward dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-3xl font-bold tracking-tight">Steward Dashboard</h1>
            <p className="text-muted-foreground">
                Manage tables for {currentLocation.location_name}
            </p>
        </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tables.map(table => {
          const inUse = isTableInUse(table.id);
          const order = heldOrders.find(o => o.table_id === table.id);
          return (
             <Card 
                key={table.id} 
                className={cn(
                    "p-4 transition-all flex flex-col justify-between h-40 cursor-pointer", 
                    inUse ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20" : "hover:border-primary hover:bg-muted"
                )}
                onClick={() => handleTableClick(table)}
             >
                <CardHeader className="p-0 flex-row justify-between items-start">
                  <CardTitle className="text-lg">{table.table_name}</CardTitle>
                   <Badge variant={inUse ? 'destructive' : 'default'} className={cn(inUse ? '' : 'bg-green-600')}>
                      {inUse ? 'Seated' : 'Available'}
                   </Badge>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col justify-center items-center text-center">
                    {inUse ? (
                        <div className="text-center">
                            <p className="font-bold text-2xl">{order?.grand_total ? `${currencySymbol}${parseFloat(order.grand_total).toFixed(2)}` : ''}</p>
                            <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                <Users className="h-4 w-4" />
                                <span className="text-sm">
                                {order?.customer?.customer_first_name || 'Walk-in'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <Utensils className="h-10 w-10 text-muted-foreground" />
                    )}
                </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
