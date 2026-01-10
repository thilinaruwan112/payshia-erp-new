
'use client'

import React, { useState, useCallback } from 'react';
import { ItemMasterReportView } from '@/components/reports/item-master-report-view';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, Printer, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/components/location-provider';
import { useRouter } from 'next/navigation';
import { fetcher } from '@/lib/api';

export default function ItemMasterReportPage() {
    const [products, setProducts] = useState([]);
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [isFetching, setIsFetching] = useState(false);
    const router = useRouter();

    const handleViewReport = useCallback(async () => {
        setIsFetching(true);
        try {
            if (!company_id) throw new Error("Company ID is missing.");
            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${company_id}`;
            const response = await fetcher(url);
            if (!response.ok) throw new Error('Failed to fetch report data');
            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsFetching(false);
        }
    }, [company_id, toast]);
    
    const handlePrint = () => {
        const url = `/reports-print/item-master-report/print?company_id=${company_id}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Item Master Report</h1>
                    <p className="text-muted-foreground">View a complete list of all your products and variants.</p>
                </div>
                 <Button variant="outline" onClick={() => router.push('/reports')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Reports
                </Button>
            </div>
             <div className="flex items-center gap-2">
                <Button onClick={handleViewReport} disabled={isFetching}>
                    {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                    View Report
                </Button>
                <Button variant="outline" onClick={handlePrint} disabled={products.length === 0}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </Button>
            </div>
            {products.length > 0 && <ItemMasterReportView products={products} />}
        </div>
    );
}
