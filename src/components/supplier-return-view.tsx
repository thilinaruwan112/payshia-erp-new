
'use client'

import { type SupplierReturn, type Supplier } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const suppliers: Supplier[] = [
    { supplier_id: 'sup-123', supplier_name: 'Global Textiles Inc.', contact_person: 'John Doe', email: 'contact@globaltextiles.com', telephone: '111-222-3333', street_name: '123 Textile Ave', city: 'Fiberburg', zip_code: '12345', fax: '111-222-3334', opening_balance: '1000' },
    { supplier_id: 'sup-456', supplier_name: 'Leather Goods Co.', contact_person: 'Jane Smith', email: 'sales@leatherco.com', telephone: '444-555-6666', street_name: '456 Hide St', city: 'Tannerville', zip_code: '67890', fax: '444-555-6667', opening_balance: '5000' },
];

const supplierReturns: SupplierReturn[] = [
    {
        id: 'RTN-001',
        grnId: 'GRN-001',
        supplierId: 'sup-123',
        supplierName: 'Global Textiles Inc.',
        date: '2023-10-10',
        totalValue: 150.00,
        items: [
            { sku: 'TS-BLK-M', returnedQty: 10, unitPrice: 15.00, reason: 'Damaged' }
        ]
    },
    {
        id: 'RTN-002',
        grnId: 'GRN-003',
        supplierId: 'sup-456',
        supplierName: 'Leather Goods Co.',
        date: '2023-10-12',
        totalValue: 80.00,
        items: [
            { sku: 'LW-BRN-OS', returnedQty: 2, unitPrice: 40.00, reason: 'Wrong item' }
        ]
    }
];

interface SupplierReturnViewProps {
    id: string;
}


export function SupplierReturnView({ id }: SupplierReturnViewProps) {
  const router = useRouter();
  const [sReturn, setSReturn] = useState<SupplierReturn | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Mocking API call to fetch data
    setIsLoading(true);
    const returnData = supplierReturns.find(r => r.id === id);
    
    if (returnData) {
        setSReturn(returnData);
        const supplierData = suppliers.find(s => s.supplier_id === returnData.supplierId);
        setSupplier(supplierData || null);
    } else {
        toast({
            variant: 'destructive',
            title: 'Return not found',
        });
        notFound();
    }
    setIsLoading(false);
  }, [id, toast]);
  
  const handlePrint = () => {
    if (sReturn) {
      window.open(`/suppliers/returns/${sReturn.id}/print`, '_blank');
    }
  };

  if (isLoading) {
    return <ReturnViewSkeleton />;
  }

  if (!sReturn) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>Could not load return data.</CardDescription>
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

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Return: {sReturn.id}
            </h1>
            <p className="text-muted-foreground">
                Returned on {new Date(sReturn.date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
              </Button>
              <Button onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Note
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
                    <p className="text-sm font-medium text-muted-foreground">GRN Reference</p>
                    <p className="font-semibold">{sReturn.grnId || 'N/A'}</p>
                 </div>
             </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Items Returned</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Total Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sReturn.items.map((item, index) => (
                           <TableRow key={index}>
                                <TableCell>{item.sku}</TableCell>
                                <TableCell>{item.reason}</TableCell>
                                <TableCell className="text-right">{item.returnedQty}</TableCell>
                                <TableCell className="text-right font-mono">${item.unitPrice.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">${(item.returnedQty * item.unitPrice).toFixed(2)}</TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="flex justify-end font-bold text-lg">
                <div className="flex items-center gap-4">
                    <span>Total Return Value:</span>
                    <span className="font-mono">${sReturn.totalValue.toFixed(2)}</span>
                </div>
            </CardFooter>
         </Card>
    </div>
  );
}

function ReturnViewSkeleton() {
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
                <div className="space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-24" /></div>
             </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
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
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
