
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Boxes,
  Package,
  AlertTriangle,
  Warehouse,
  TrendingUp,
  Loader2,
  ArrowRightLeft,
} from 'lucide-react';
import { useLocation } from '@/components/location-provider';
import React, { useMemo, useState, useEffect } from 'react';
import { StockChart } from '@/components/stock-chart';
import Link from 'next/link';
import type { InventoryItem, Product, StockTransfer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryDashboard() {
  const { currentLocation, isLoading: isLocationLoading, company_id } = useLocation();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentLocation || !company_id) {
        setIsLoading(false);
        return;
    }
    async function fetchData() {
        setIsLoading(true);
        try {
            const [inventoryRes, productsRes, transfersRes] = await Promise.all([
                fetch(`https://server-erp.payshia.com/inventory/location/${currentLocation.location_id}`),
                fetch('https://server-erp.payshia.com/products'),
                fetch(`https://server-erp.payshia.com/stock-transfers/filter/by-company?company_id=${company_id}`)
            ]);
            if (!inventoryRes.ok) throw new Error('Failed to fetch inventory');
            if (!productsRes.ok) throw new Error('Failed to fetch products');
            if (!transfersRes.ok) throw new Error('Failed to fetch stock transfers');

            setInventory(await inventoryRes.json() || []);
            setProducts(await productsRes.json() || []);
            setStockTransfers(await transfersRes.json() || []);

        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not load inventory dashboard data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [currentLocation, company_id, toast]);


  const inventoryStats = useMemo(() => {
    if (!currentLocation) return { lowStockItems: 0, totalStock: 0, totalSKUs: 0, totalTransfers: 0 };
    
    const locationInventory = inventory;
    const lowStockItems = locationInventory.filter(item => item.stock > 0 && item.stock <= item.reorderLevel).length;
    const totalStock = locationInventory.reduce((acc, item) => acc + item.stock, 0);

    const productIdsInLocation = new Set(locationInventory.map(i => i.productId));
    const skusInLocation = products.filter(p => productIdsInLocation.has(p.id))
                                   .flatMap(p => p.variants)
                                   .filter(v => locationInventory.some(i => i.sku === v.sku));
    const totalSKUs = skusInLocation.length;
    const totalTransfers = stockTransfers.length;

    return { lowStockItems, totalStock, totalSKUs, totalTransfers };
  }, [currentLocation, inventory, products, stockTransfers]);
  
  if (isLocationLoading) {
    return (
        <div className="flex h-full flex-1 items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!currentLocation) {
     return (
        <div className="flex h-full flex-1 items-center justify-center text-center">
            <p className="text-muted-foreground">Please select a location to view the inventory dashboard.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Dashboard for <span className="text-primary">{currentLocation.location_name}</span></h1>
        <p className="text-muted-foreground">
          An overview of your stock levels and movements.
        </p>
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{inventoryStats.totalStock.toLocaleString()}</div>}
            <p className="text-xs text-muted-foreground">Units in this location</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{inventoryStats.totalSKUs}</div>}
            <p className="text-xs text-muted-foreground">Unique variants in this location</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{inventoryStats.lowStockItems}</div>}
            <p className="text-xs text-muted-foreground">Items needing reorder</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Transfers</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{inventoryStats.totalTransfers}</div>}
            <p className="text-xs text-muted-foreground">
                <Link href="/transfers" className="hover:underline">View all transfers</Link>
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-6">
         <Card>
            <CardHeader>
                <CardTitle>Top Products by Stock</CardTitle>
                <CardDescription>Your most stocked products in {currentLocation.location_name}.</CardDescription>
            </CardHeader>
            <CardContent>
                <StockChart locationId={currentLocation.location_id} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
