

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
  ArrowDownToDot,
  AlertTriangle,
  PlusCircle,
  Warehouse,
  TerminalSquare,
  TrendingUp,
} from 'lucide-react';
import { inventory, locations, products } from '@/lib/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { SalesChart } from '@/components/sales-chart';
import { StockChart } from '@/components/stock-chart';

export default function Dashboard() {
  const lowStockItems = inventory.filter(
    (item) => item.stock <= item.reorderLevel
  ).length;
  const totalStock = inventory.reduce((acc, item) => acc + item.stock, 0);
  const totalSKUs = products.flatMap((p) => p.variants).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Units across all locations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSKUs}</div>
            <p className="text-xs text-muted-foreground">Unique product variants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground">Warehouses and stores</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items needing reorder</p>
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
                <CardDescription>Your most stocked products.</CardDescription>
            </CardHeader>
            <CardContent>
                <StockChart />
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Levels by Location</CardTitle>
          <CardDescription>
            A detailed view of your product inventory across all locations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden sm:table-cell">SKU</TableHead>
                  {locations.map((loc) => (
                    <TableHead key={loc.id} className="text-center hidden md:table-cell">
                      {loc.name}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.flatMap((product) =>
                  product.variants.map((variant) => {
                    const inventoryItems = inventory.filter(
                      (item) => item.sku === variant.sku
                    );
                    const totalVariantStock = inventoryItems.reduce(
                      (sum, item) => sum + item.stock,
                      0
                    );
                    const reorderLevel = inventoryItems[0]?.reorderLevel ?? 0;
                    const status =
                      totalVariantStock === 0
                        ? 'out-of-stock'
                        : totalVariantStock <= reorderLevel
                        ? 'low-stock'
                        : 'in-stock';

                    return (
                      <TableRow key={variant.sku}>
                        <TableCell className="font-medium">
                          <div>{product.name}</div>
                          {(variant.color || variant.size) && (
                            <div className="text-muted-foreground text-xs">
                              {[variant.color, variant.size].filter(Boolean).join(' / ')}
                            </div>
                          )}
                           <div className="sm:hidden text-xs text-muted-foreground">{variant.sku}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{variant.sku}</TableCell>
                        {locations.map((loc) => {
                          const item = inventoryItems.find(
                            (i) => i.locationId === loc.id
                          );
                          return (
                            <TableCell key={loc.id} className="text-center hidden md:table-cell">
                              {item?.stock ?? 0}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              status === 'in-stock'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className={cn(
                              'capitalize',
                              status === 'in-stock' && 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
                              status === 'low-stock' && 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
                              status === 'out-of-stock' && 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            )}
                          >
                            {status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
