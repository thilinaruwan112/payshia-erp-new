
'use client'

import { type GoodsReceivedNote, type Supplier, type Product, type ProductVariant } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { format } from 'date-fns';

interface GrnViewProps {
    id: string;
}

export function GrnView({ id }: GrnViewProps) {
  const router = useRouter();
  const [grn, setGrn] = useState<GoodsReceivedNote | null>(null);
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
        const [grnResponse, suppliersResponse, productsResponse, variantsResponse] = await Promise.all([
           fetch(`https://server-erp.payshia.com/grn/${id}`),
           fetch('https://server-erp.payshia.com/suppliers'),
           fetch('https://server-erp.payshia.com/products'),
           fetch('https://server-erp.payshia.com/product-variants'),
        ]);
        
        if (!grnResponse.ok) {
           if (grnResponse.status === 404) notFound();
           throw new Error('Failed to fetch GRN data');
        }
        if (!suppliersResponse.ok) throw new Error('Failed to fetch suppliers');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        if (!variantsResponse.ok) throw new Error('Failed to fetch variants');

        const grnData: GoodsReceivedNote = await grnResponse.json();
        const suppliersData: Supplier[] = await suppliersResponse.json();
        const productsData: Product[] = await productsResponse.json();
        const variantsData: ProductVariant[] = await variantsResponse.json();

        setGrn(grnData);
        setSupplier(suppliersData.find(s => s.supplier_id === grnData.supplier_id) || null);
        setProducts(productsData);
        setVariants(variantsData);

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load GRN',
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
    if (grn) {
      window.open(`/purchasing/grn/${grn.id}/print`, '_blank');
    }
  };

  if (isLoading) {
    return <GrnViewSkeleton />;
  }

  if (!grn) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>Could not load GRN data. It may have been deleted or the server is unavailable.</CardDescription>
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

  const grnItems = grn.items?.map(item => ({
    ...item,
    product_name: getProductName(String(item.product_id)),
    variant_sku: getVariantSku(String(item.product_variant_id)),
    total_cost: parseFloat(String(item.order_rate)) * parseFloat(item.received_qty),
  }));

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              GRN: {grn.grn_number}
            </h1>
            <p className="text-muted-foreground">
                Received on {new Date(grn.created_at).toLocaleDateString()}
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
                    <p className="text-sm font-medium text-muted-foreground">GRN Status</p>
                    <p>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                           {grn.grn_status}
                        </Badge>
                    </p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">PO Number</p>
                    <p className="font-semibold">{grn.po_number || 'N/A'}</p>
                 </div>
             </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Items</CardTitle>
                <CardDescription>List of products received in this GRN.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Batch Code</TableHead>
                            <TableHead>EXP</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {grnItems?.map((item, index) => (
                           <TableRow key={index}>
                                <TableCell>{item.product_name}</TableCell>
                                <TableCell>{item.variant_sku}</TableCell>
                                <TableCell>{item.patch_code}</TableCell>
                                <TableCell>{item.expire_date && item.expire_date !== '0000-00-00' ? format(new Date(item.expire_date), 'dd/MM/yy') : 'N/A'}</TableCell>
                                <TableCell className="text-right">{parseFloat(item.received_qty)}</TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="flex justify-end font-bold text-lg">
                <div className="flex items-center gap-4">
                    <span>Grand Total:</span>
                    <span className="font-mono">${parseFloat(grn.grand_total).toFixed(2)}</span>
                </div>
            </CardFooter>
         </Card>
    </div>
  );
}

function GrnViewSkeleton() {
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
             </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <TableRow>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
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
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    </TableRow>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
