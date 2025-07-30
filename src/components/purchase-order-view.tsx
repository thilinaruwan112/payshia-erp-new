

'use client'

import { type PurchaseOrder, type Supplier, type Product, type ProductVariant } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface PurchaseOrderViewProps {
    id: string;
}

const getStatusText = (status: string) => {
  switch (status) {
    case '0':
      return 'Pending';
    case '1':
      return 'Approved';
    case '2':
      return 'Rejected';
    case '3':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case '0': // Pending
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case '1': // Approved
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case '2': // Rejected
    case '3': // Cancelled
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};


export function PurchaseOrderView({ id }: PurchaseOrderViewProps) {
  const router = useRouter();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [poResponse, suppliersResponse, productsResponse, variantsResponse] = await Promise.all([
           fetch(`https://server-erp.payshia.com/purchase-orders/${id}`),
           fetch('https://server-erp.payshia.com/suppliers'),
           fetch('https://server-erp.payshia.com/products'),
           fetch('https://server-erp.payshia.com/product-variants'),
        ]);
        
        if (!poResponse.ok) {
           if (poResponse.status === 404) notFound();
           throw new Error('Failed to fetch PO data');
        }
        if (!suppliersResponse.ok) throw new Error('Failed to fetch suppliers');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        if (!variantsResponse.ok) throw new Error('Failed to fetch variants');

        const poData: PurchaseOrder = await poResponse.json();
        const suppliersData: Supplier[] = await suppliersResponse.json();
        const productsData: Product[] = await productsResponse.json();
        const variantsData: ProductVariant[] = await variantsResponse.json();

        setPo(poData);
        setSupplier(suppliersData.find(s => s.supplier_id === poData.supplier_id) || null);
        setProducts(productsData);
        setVariants(variantsData);

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load purchase order',
          description: error instanceof Error ? error.message : 'Could not fetch data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, toast]);

  const getProductName = (productId: string) => products.find(p => p.id === productId)?.name || 'Unknown Product';
  const getVariantSku = (variantId: string) => variants.find(v => v.id === variantId)?.sku || 'N/A';
  
  const handlePrint = () => {
    if (po) {
      window.open(`/purchasing/purchase-orders/${po.id}/print`, '_blank');
    }
  };

  if (isLoading) {
    return <PurchaseOrderViewSkeleton />;
  }

  if (!po) {
    return <div>Purchase Order not found or failed to load.</div>;
  }

  const poItems = po.items?.map(item => ({
    ...item,
    product_name: getProductName(item.product_id),
    variant_sku: getVariantSku(item.product_variant_id),
    total_cost: parseFloat(String(item.order_rate)) * item.quantity,
  }));

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              PO: {po.po_number}
            </h1>
            <p className="text-muted-foreground">
                Created on {new Date(po.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
              </Button>
              <Button onClick={handlePrint}>
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
                    <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                    <p className="font-semibold">{supplier?.supplier_name || 'N/A'}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">PO Status</p>
                    <p>
                        <Badge variant="secondary" className={cn(getStatusColor(po.po_status))}>
                           {getStatusText(po.po_status)}
                        </Badge>
                    </p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Subtotal</p>
                    <p className="font-semibold font-mono">${parseFloat(po.sub_total).toFixed(2)}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Tax Type</p>
                    <p className="font-semibold">{po.tax_type}</p>
                </div>
             </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Items</CardTitle>
                <CardDescription>List of products included in this purchase order.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Cost</TableHead>
                            <TableHead className="text-right">Total Cost</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {poItems?.map((item, index) => (
                           <TableRow key={index}>
                                <TableCell>{item.product_name}</TableCell>
                                <TableCell>{item.variant_sku}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right font-mono">${parseFloat(String(item.order_rate)).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">${item.total_cost.toFixed(2)}</TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="flex justify-end font-bold text-lg">
                <div className="flex items-center gap-4">
                    <span>Total:</span>
                    <span className="font-mono">${parseFloat(po.sub_total).toFixed(2)}</span>
                </div>
            </CardFooter>
         </Card>
    </div>
  );
}

function PurchaseOrderViewSkeleton() {
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
                <div className="space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-24 rounded-full" /></div>
                <div className="space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-24" /></div>
                <div className="space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-20" /></div>
             </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="flex justify-between items-center py-2">
                            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/4" /></div>
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
