
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  ArrowUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { orders, inventory, products, users } from '@/lib/data';
import { addDays, format, isAfter, subDays } from 'date-fns';
import { useMemo } from 'react';

export default function ReportsPage() {
  // Sales Data Processing
  const salesData = useMemo(() => {
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
        dailySales.set(date, (dailySales.get(date) || 0) + order.total);
      }
    });

    return Array.from(dailySales.entries()).map(([date, total]) => ({
      name: format(new Date(date), 'MMM d'),
      total,
    }));
  }, []);

  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((acc, order) => acc + order.total, 0);
  const totalOrders = orders.filter((o) => o.status !== 'Cancelled').length;

  // Inventory Data Processing
  const lowStockItems = inventory.filter(
    (item) => item.stock > 0 && item.stock <= item.reorderLevel
  );
  const outOfStockItems = inventory.filter((item) => item.stock === 0);
  const mostStockedItems = [...inventory]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5);

  // Customer Data Processing
  const newCustomers = users.filter((u) => u.role === 'Customer').slice(0, 5); // Mock data
  const topCustomers = [...orders]
    .reduce((acc, order) => {
      const existing = acc.find((c) => c.name === order.customerName);
      if (existing) {
        existing.totalSpent += order.total;
        existing.orderCount += 1;
      } else {
        acc.push({
          name: order.customerName,
          totalSpent: order.total,
          orderCount: 1,
        });
      }
      return acc;
    }, [] as { name: string; totalSpent: number; orderCount: number }[])
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);
    
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Analytics and insights for your business.
        </p>
      </div>
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  +{totalOrders.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +180.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Order Value
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(totalRevenue / totalOrders).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +19% from last month
                </p>
              </CardContent>
            </Card>
          </div>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>
                A chart of sales over the last 7 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="total"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    activeBar={<Rectangle fill="hsl(var(--primary) / 0.8)" />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventory" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{products.flatMap(p => p.variants).length}</div>
                    <p className="text-xs text-muted-foreground">Total unique product variants</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{lowStockItems.length}</div>
                     <p className="text-xs text-muted-foreground">Items nearing reorder level</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{outOfStockItems.length}</div>
                    <p className="text-xs text-muted-foreground">Items with zero stock</p>
                </CardContent>
            </Card>
          </div>
           <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Top Stocked Items</CardTitle>
                    <CardDescription>Your 5 most abundant products across all locations.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Total Stock</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mostStockedItems.map(item => {
                                const product = products.find(p => p.variants.some(v => v.sku === item.sku));
                                return (
                                    <TableRow key={item.sku}>
                                        <TableCell>{product?.name} ({item.sku})</TableCell>
                                        <TableCell className="text-right">{item.stock}</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
           </Card>
        </TabsContent>
        
        <TabsContent value="customers" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>New Customers</CardTitle>
                        <CardDescription>Recently registered customers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                           {newCustomers.map(customer => (
                             <div key={customer.id} className="flex items-center">
                                <Users className="h-4 w-4 mr-4 text-muted-foreground" />
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{customer.name}</p>
                                    <p className="text-sm text-muted-foreground">{customer.role}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Top Customers by Spending</CardTitle>
                        <CardDescription>Your most valuable customers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="text-right">Total Spent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topCustomers.map(customer => (
                                    <TableRow key={customer.name}>
                                        <TableCell>{customer.name}</TableCell>
                                        <TableCell className="text-right">${customer.totalSpent.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
