
'use client'

import { type Invoice, type User, type Product, type ProductVariant } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useCurrency } from './currency-provider';
import { format } from 'date-fns';
import { fetcher } from '@/lib/api';

interface QuotationItem {
    id: string;
    product_id: string;
    product_variant_id: string | null;
    qty: string;
    unit_price: string;
    total: string;
}

interface Quotation {
  id: string;
  customer_id: string;
  quatation_date: string;
  expire_date: string;
  is_active: string;
  items: QuotationItem[];
  remark: string;
  grand_total: string;
  company_id: string;
}

interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}

interface QuotationViewProps {
    id: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case '1': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case '2': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case '3': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  }
};

const getStatusText = (status: string): string => {
    switch (status) {
        case '1': return 'Sent';
        case '2': return 'Accepted';
        case '3': return 'Rejected';
        default: return 'Draft';
    }
}


export function QuotationView({ id }: QuotationViewProps) {
  const router = useRouter();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const quotationResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/quotations/${id}`);
        
        if (!quotationResponse.ok) {
           if (quotationResponse.status === 404) notFound();
           throw new Error('Failed to fetch quotation data');
        }
        const quotationData: Quotation = await quotationResponse.json();
        setQuotation(quotationData);

        const [productsResponse, customerResponse] = await Promise.all([
           fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${quotationData.company_id}`),
           fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${quotationData.customer_id}`),
        ]);
        
        if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            setProducts(productsData.products || []);
        }

        if (customerResponse.ok) {
            setCustomer(await customerResponse.json());
        }

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load quotation',
          description: error instanceof Error ? error.message : 'Could not fetch data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, toast]);

   const getProductName = (productId: string, variantId: string | null) => {
    const productData = products.find(p => p.product.id === productId);
    if (!productData) return `Product ID: ${productId}`;

    if (variantId) {
        const variant = productData.variants.find(v => v.variant.id === variantId)?.variant;
        if (variant) {
            const variantAttributes = [variant.color, variant.size].filter(Boolean).join(' - ');
            return variantAttributes ? `${productData.product.name} - ${variantAttributes}` : `${productData.product.name} (${variant.sku})`;
        }
    }

    return productData.product.name;
  };

  const handlePrint = () => {
    if (quotation) {
        window.open(`/sales-print/quotations/${quotation.id}/print`, '_blank');
    }
  };

  if (isLoading) {
    return <QuotationViewSkeleton />;
  }

  if (!quotation) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>Could not load quotation data.</CardDescription>
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
  
  const quotationItems = quotation.items?.map(item => ({
    ...item,
    product_name: getProductName(item.product_id, item.product_variant_id),
    total_cost: parseFloat(String(item.unit_price)) * parseFloat(item.qty),
  }));
  
  const statusText = getStatusText(quotation.is_active);
  const totalValue = quotation.items.reduce((acc, item) => acc + parseFloat(item.total), 0);

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Quotation: QTN-{quotation.id}
            </h1>
            <p className="text-muted-foreground">
                Created on {new Date(quotation.quatation_date).toLocaleDateString()}
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
                    <p className="text-sm font-medium text-muted-foreground">Customer</p>
                    <p className="font-semibold">{customer?.customer_first_name} {customer?.customer_last_name || ''}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                    <p className="font-semibold">{new Date(quotation.expire_date).toLocaleDateString()}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p>
                        <Badge variant="secondary" className={cn(getStatusColor(quotation.is_active))}>
                           {statusText}
                        </Badge>
                    </p>
                </div>
             </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Items</CardTitle>
                <CardDescription>List of products included in this quotation.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {quotationItems?.map((item, index) => (
                           <TableRow key={index}>
                                <TableCell>{item.product_name}</TableCell>
                                <TableCell className="text-right">{parseFloat(item.qty)}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(String(item.unit_price)).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{item.total_cost.toFixed(2)}</TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="flex justify-end font-bold text-lg">
                <div className="flex items-center gap-4">
                    <span>Grand Total:</span>
                    <span className="font-mono">{currencySymbol}{totalValue.toFixed(2)}</span>
                </div>
            </CardFooter>
         </Card>
    </div>
  );
}

function QuotationViewSkeleton() {
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
                    </TableRow>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
