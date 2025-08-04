
'use client'

import { type StockTransfer, type Location, type Product, type ProductVariant } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface TransferViewProps {
    id: string;
}

const getStatusColor = (status: StockTransfer['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'in-transit':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};


export function TransferView({ id }: TransferViewProps) {
  const router = useRouter();
  const [transfer, setTransfer] = useState<StockTransfer | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [transferResponse, locationsResponse, productsResponse, variantsResponse] = await Promise.all([
           fetch(`https://server-erp.payshia.com/stock-transfers/${id}`),
           fetch('https://server-erp.payshia.com/locations'),
           fetch('https://server-erp.payshia.com/products'),
           fetch('https://server-erp.payshia.com/product-variants'),
        ]);
        
        if (!transferResponse.ok) {
           if (transferResponse.status === 404) notFound();
           throw new Error('Failed to fetch transfer data');
        }
        if (!locationsResponse.ok) throw new Error('Failed to fetch locations');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        if (!variantsResponse.ok) throw new Error('Failed to fetch variants');

        const transferData: StockTransfer = await transferResponse.json();
        const locationsData: Location[] = await locationsResponse.json();
        const productsData: Product[] = await productsResponse.json();
        const variantsData: ProductVariant[] = await variantsResponse.json();

        setTransfer(transferData);
        setLocations(locationsData);
        setProducts(productsData);
        setVariants(variantsData);

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load transfer',
          description: error instanceof Error ? error.message : 'Could not fetch data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, toast]);

  const getLocationName = (locationId: string) => locations.find(l => l.location_id === locationId)?.location_name || `ID: ${locationId}`;
  const getProductName = (productId: string) => products.find(p => p.id === productId)?.name || 'Unknown Product';
  const getVariantSku = (variantId: string) => variants.find(v => v.id === variantId)?.sku || 'N/A';
  
  if (isLoading) {
    return <TransferViewSkeleton />;
  }

  if (!transfer) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>Could not load transfer data. It may have been deleted.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                </Button>
            </CardContent>
        </Card>
    )
  }

  const transferItems = transfer.items?.map(item => ({
    ...item,
    product_name: getProductName(item.product_id),
    variant_sku: getVariantSku(item.product_variant_id),
  }));

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Transfer: {transfer.stock_transfer_number}
            </h1>
            <p className="text-muted-foreground">
                Created on {new Date(transfer.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
              </Button>
              <Button onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
              </Button>
          </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Details</CardTitle>
            </CardHeader>
             <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">From Location</p>
                    <p className="font-semibold">{getLocationName(transfer.from_location)}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">To Location</p>
                    <p className="font-semibold">{getLocationName(transfer.to_location)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Transfer Date</p>
                    <p className="font-semibold">{new Date(transfer.transfer_date).toLocaleDateString()}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant="secondary" className={cn(getStatusColor(transfer.status))}>
                       {transfer.status}
                    </Badge>
                </div>
             </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Items Transferred</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Batch</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transferItems?.map((item) => (
                           <TableRow key={item.id}>
                                <TableCell>{item.product_name}</TableCell>
                                <TableCell>{item.variant_sku}</TableCell>
                                <TableCell>{item.patch_code || 'N/A'}</TableCell>
                                <TableCell className="text-right">{parseFloat(item.quantity).toFixed(2)}</TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
         </Card>
    </div>
  );
}

function TransferViewSkeleton() {
  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-24" />
             <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
             <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-32" /></div>
                <div className="space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-32" /></div>
                <div className="space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-24" /></div>
                <div className="space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-24 rounded-full" /></div>
             </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
                <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                          <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                          <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                          <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      <TableRow>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      </TableRow>
                      <TableRow>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      </TableRow>
                      <TableRow>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      </TableRow>
                  </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
