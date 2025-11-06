
'use client';

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
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fetcher } from '@/lib/api';
import { useCurrency } from '@/components/currency-provider';

type ProductionRunItem = {
    id: string;
    target_qty: string;
    actual_qty: string;
}

type ProductionRun = {
    id: string;
    location_id: string;
    cost_value: string;
    created_at: string;
    items: ProductionRunItem[];
}

export default function ProductionRunHistoryPage() {
    const { company_id } = useLocation();
    const { toast } = useToast();
    const { currencySymbol } = useCurrency();
    const [runs, setRuns] = useState<ProductionRun[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        };

        async function fetchData() {
            setIsLoading(true);
            try {
                const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/mission-plus/company/${company_id}`);
                if (!response.ok) throw new Error('Failed to fetch production run history');
                const data = await response.json();
                setRuns(data || []);
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch production run history.'
                })
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [company_id, toast]);


    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                <h1 className="text-3xl font-bold tracking-tight">Bulk Production History</h1>
                <p className="text-muted-foreground">
                    A log of all past bulk production runs.
                </p>
                </div>
                 <Button asChild className="w-full sm:w-auto">
                    <Link href="/production/run/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Run
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Run History</CardTitle>
                    <CardDescription>
                        Browse and review previously completed production runs.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Run ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Total Planned Qty</TableHead>
                            <TableHead className="text-right">Total Actual Yield</TableHead>
                            <TableHead className="text-right">Total Cost</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        Array.from({length: 5}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-24" /></TableCell>
                            </TableRow>
                        ))
                    ) : runs.length > 0 ? (
                         runs.map((run) => {
                            const totalPlannedQty = run.items.reduce((sum, item) => sum + parseFloat(item.target_qty), 0);
                            const totalActualQty = run.items.reduce((sum, item) => sum + parseFloat(item.actual_qty), 0);
                            
                            return (
                                <TableRow key={run.id}>
                                    <TableCell className="font-mono">MP-{run.id}</TableCell>
                                    <TableCell>{format(new Date(run.created_at), 'dd MMM, yyyy')}</TableCell>
                                    <TableCell className="text-right font-mono">{totalPlannedQty.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-mono">{totalActualQty.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(run.cost_value).toFixed(2)}</TableCell>
                                </TableRow>
                            );
                         })
                    ) : (
                         <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No production runs found.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
    );
}
