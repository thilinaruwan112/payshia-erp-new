
'use client'

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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Star } from 'lucide-react';
import type { Product } from '@/lib/data';
import { inventory } from '@/lib/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import Link from 'next/link';
import { checkPlanLimit } from '@/lib/plan-limits';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState({ hasAccess: true, limit: Infinity, usage: 0, name: '...' });
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [productsResponse, limitResponse] = await Promise.all([
           fetch('https://server-erp.payshia.com/products'),
           checkPlanLimit('products')
        ]);
        
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data: Product[] = await productsResponse.json();
        const parsedData = data.map(p => ({...p, price: parseFloat(p.price as any)}));
        setProducts(parsedData);
        setPlanDetails(limitResponse);

      } catch (error) {
         toast({
          variant: "destructive",
          title: "Failed to load products",
          description: "Could not fetch products from the server.",
        });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your products and view their inventory. You are on the{' '}
            <span className="font-semibold text-primary">{planDetails.name}</span> plan.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto" disabled={!planDetails.hasAccess}>
          <Link href="/products/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {!planDetails.hasAccess && (
        <Alert>
          <Star className="h-4 w-4" />
          <AlertTitle>Upgrade to add more products</AlertTitle>
          <AlertDescription>
            You have reached the limit of {planDetails.limit} products on the {planDetails.name} plan.
            <Button asChild variant="link" className="p-0 pl-1 h-auto">
              <Link href="/billing">Upgrade your plan</Link>
            </Button>
            to add more.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            Showing {products.length} of {planDetails.limit === Infinity ? 'unlimited' : planDetails.limit} products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Inventory</TableHead>
                <TableHead className="hidden lg:table-cell">Price</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-16 w-16 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                       <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                       <Skeleton className="h-8 w-8 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                products.map((product) => {
                  const totalStock = inventory
                    .filter((item) => product.variants && product.variants.some(v => v.sku === item.sku))
                    .reduce((sum, item) => sum + item.stock, 0);
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="hidden sm:table-cell">
                        <Image
                          alt={product.name}
                          className="aspect-square rounded-md object-cover"
                          height="64"
                          src={product.product_image_url || `https://placehold.co/64x64.png`}
                          width="64"
                          data-ai-hint="product photo"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground lg:hidden">{product.category}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                         <Badge variant={'secondary'} className={cn(
                            product.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                         )}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{totalStock} in stock</TableCell>
                      <TableCell className="hidden lg:table-cell">${product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
