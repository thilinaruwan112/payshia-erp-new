

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
import { Button } from '@/components/ui/button';
import {
  Boxes,
  Package,
  AlertTriangle,
  PlusCircle,
  Warehouse,
  TerminalSquare,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { inventory, locations, products, orders } from '@/lib/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { SalesChart } from '@/components/sales-chart';
import { StockChart } from '@/components/stock-chart';
import { useLocation } from '@/components/location-provider';
import { useMemo } from 'react';

export default function Dashboard() {
  const { currentLocation, isLoading } = useLocation();

  const locationInventory = useMemo(() => {
    if (!currentLocation) return [];
    return inventory.filter(item => item.locationId === currentLocation.location_id);
  }, [currentLocation]);

  const dashboardStats = useMemo(() => {
    const lowStockItems = locationInventory.filter(
      (item) => item.stock > 0 && item.stock <= item.reorderLevel
    ).length;
    const totalStock = locationInventory.reduce((acc, item) => acc + item.stock, 0);

    const productIdsInLocation = new Set(locationInventory.map(i => i.productId));
    const skusInLocation = products.filter(p => productIdsInLocation.has(p.id))
                                   .flatMap(p => p.variants)
                                   .filter(v => locationInventory.some(i => i.sku === v.sku));

    const totalSKUs = skusInLocation.length;

    return { lowStockItems, totalStock, totalSKUs };
  }, [locationInventory, products]);
  
  if (isLoading) {
    return (
        <div className="flex h-full flex-1 items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!currentLocation) {
     return (
        <div className="flex h-full flex-1 items-center justify-center">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>No Location Found</CardTitle>
                    <CardDescription>Please add a location to view the dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/locations/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Location
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard for <span className="text-primary">{currentLocation.location_name}</span></h1>
          <p className="text-muted-foreground">
            Your business overview at a glance.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
           <Button asChild className="w-full sm:w-auto">
            <Link href="/products/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Product
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalStock.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Units in {currentLocation.location_name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalSKUs}</div>
            <p className="text-xs text-muted-foreground">Unique variants in {currentLocation.location_name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground">Total warehouses and stores</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items needing reorder in {currentLocation.location_name}</p>
          </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Link href="/pos-system" target="_blank" rel="noopener noreferrer">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Point of Sale (POS)</CardTitle>
                <TerminalSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Click here to launch the POS terminal for in-person sales.
                </p>
              </CardContent>
            </Card>
        </Link>
         <Link href="/inventory/forecast">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Inventory Forecasting</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Predict future stock needs and optimize inventory levels with AI.
                </p>
              </CardContent>
            </Card>
        </Link>
       </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>A summary of your recent sales.</CardDescription>
            </CardHeader>
            <CardContent>
                <SalesChart />
            </CardContent>
        </Card>
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
