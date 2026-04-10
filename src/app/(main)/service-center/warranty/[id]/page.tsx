'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, ShieldCheck } from 'lucide-react';
import { useRouter, notFound, useParams } from 'next/navigation';
import { type Warranty } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

// Mock data until API is available
const warranties: Warranty[] = [
    { id: 'WAR-001', customerId: 'cus-123', customerName: 'John Doe', productName: 'Toyota Camry Engine', serialNumber: 'ABC-1234', purchaseDate: '2023-01-15', expiryDate: '2025-01-14', status: 'Active', coverageDetails: 'Covers engine block and internal parts against manufacturing defects. Labor included.' },
    { id: 'WAR-002', customerId: 'cus-456', customerName: 'Jane Smith', productName: 'Apple iPhone 14 Pro', serialNumber: 'SN:XYZ', purchaseDate: '2022-10-25', expiryDate: '2023-10-24', status: 'Expired', coverageDetails: 'One-year limited warranty for manufacturing defects. Does not cover accidental damage.' },
    { id: 'WAR-003', customerId: 'cus-789', customerName: 'Jim Brown', productName: 'Ford Ranger Transmission', serialNumber: 'DEF-9012', purchaseDate: '2021-08-01', expiryDate: '2024-07-31', status: 'Active', coverageDetails: '3-year/60,000km warranty on transmission parts.' },
    { id: 'WAR-004', customerId: 'cus-101', customerName: 'Emily White', productName: 'Dell XPS 15 Laptop', serialNumber: 'SVC-TAG-123', purchaseDate: '2023-05-20', expiryDate: '2024-05-19', status: 'Active', coverageDetails: '1-year premium support with on-site service.' },
];

const getStatusColor = (status: Warranty['status']) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Expired':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'Void':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};


export default function WarrantyDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = typeof params.id === 'string' ? params.id : '';
    const [warranty, setWarranty] = useState<Warranty | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Mocking API fetch
        const foundWarranty = warranties.find(w => w.id === id);
        if (foundWarranty) {
            setWarranty(foundWarranty);
        } else {
            notFound();
        }
        setIsLoading(false);
    }, [id]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-9 w-64" />
                <Card><CardContent><Skeleton className="h-96" /></CardContent></Card>
            </div>
        )
    }

    if (!warranty) {
        return <div>Warranty not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Warranty Details</h1>
                    <p className="text-muted-foreground">Viewing details for warranty #{warranty.id}</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to List
                    </Button>
                     <Button>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl">{warranty.productName}</CardTitle>
                        <CardDescription>Serial / Registration No: {warranty.serialNumber}</CardDescription>
                    </div>
                     <Badge variant="secondary" className={cn("text-base", getStatusColor(warranty.status))}>
                        <ShieldCheck className="mr-1.5 h-4 w-4" />
                        {warranty.status}
                    </Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground">Customer</h4>
                            <p className="font-semibold">{warranty.customerName}</p>
                        </div>
                         <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground">Purchase Date</h4>
                            <p className="font-semibold">{format(new Date(warranty.purchaseDate), 'PPP')}</p>
                        </div>
                         <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground">Expiry Date</h4>
                            <p className="font-semibold">{format(new Date(warranty.expiryDate), 'PPP')}</p>
                        </div>
                    </div>
                     <div className="space-y-2 pt-4 border-t">
                        <h4 className="text-sm font-medium text-muted-foreground">Coverage Details</h4>
                        <p className="text-base text-foreground/90 whitespace-pre-wrap">{warranty.coverageDetails || 'No specific coverage details were provided.'}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
