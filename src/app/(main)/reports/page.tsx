

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
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  Star,
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import type { Order, InventoryItem, Product, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/components/location-provider';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
    const { toast } = useToast();
    const { company_id } = useLocation();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        }
        async function fetchData() {
            setIsLoading(true);
            try {
                const [inventoryRes, productsRes, usersRes] = await Promise.all([
                    fetch(`https://server-erp.payshia.com/inventory/company/${company_id}`),
                    fetch('https://server-erp.payshia.com/products'),
                    fetch(`https://server-erp.payshia.com/customers/company/filter/?company_id=${company_id}`),
                ]);

                if (!inventoryRes.ok || !productsRes.ok || !usersRes.ok) {
                    throw new Error('Failed to fetch report data');
                }

                setInventory(await inventoryRes.json());
                setProducts(await productsRes.json());
                setUsers(await usersRes.json());

            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch report data.' });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [company_id, toast]);

  // Inventory Data Processing
  const lowStockItems = inventory.filter(
    (item) => item.stock > 0 && item.stock <= item.reorderLevel
  );
  const outOfStockItems = inventory.filter((item) => item.stock === 0);
  const mostStockedItems = [...inventory]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5);

  // Customer Data Processing
  const newCustomers = users.slice(0, 5); // Mock data
  const topLoyaltyCustomers = users
    .filter((u) => u.role === 'Customer' && u.loyaltyPoints)
    .sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))
    .slice(0, 5);
    
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Analytics and insights for your business.
        </p>
      </div>
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-20" /> : <div className="text-2xl font-bold">{products.flatMap(p => p.variants).length}</div>}
                    <p className="text-xs text-muted-foreground">Total unique product variants</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{lowStockItems.length}</div>}
                     <p className="text-xs text-muted-foreground">Items nearing reorder level</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{outOfStockItems.length}</div>}
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
                            {isLoading ? Array.from({length: 5}).map((_, i) => <TableRow key={i}><TableCell><Skeleton className="h-4 w-48" /></TableCell><TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell></TableRow>) : mostStockedItems.map(item => {
                                const product = products.find(p => p.variants.some(v => v.sku === item.sku));
                                return (
                                    <TableRow key={item.sku}>
                                        <TableCell>{product?.name} ({item.sku})</TableCell>
                                        <TableCell className="text-right">{item.stock.toLocaleString()}</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
           </Card>
        </TabsContent>
        
        <TabsContent value="customers" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>New Customers</CardTitle>
                        <CardDescription>Recently registered customers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                           {isLoading ? Array.from({length: 5}).map((_, i) => <div key={i} className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div>) : newCustomers.map(customer => (
                             <div key={customer.id} className="flex items-center">
                                <Users className="h-4 w-4 mr-4 text-muted-foreground" />
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{customer.customer_first_name} {customer.customer_last_name}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Top Customers by Loyalty</CardTitle>
                        <CardDescription>Your most engaged customers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="text-right">Loyalty Points</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? Array.from({length: 5}).map((_, i) => <TableRow key={i}><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell></TableRow>) : topLoyaltyCustomers.map(customer => (
                                    <TableRow key={customer.id}>
                                        <TableCell>{customer.customer_first_name} {customer.customer_last_name}</TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-1">
                                            <Star className="w-4 h-4 text-yellow-400" />
                                            <span className="font-medium">{(customer.loyaltyPoints || 0).toLocaleString()}</span>
                                        </TableCell>
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
