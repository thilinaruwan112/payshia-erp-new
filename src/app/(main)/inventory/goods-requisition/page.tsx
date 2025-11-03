

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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import React, { useEffect, useState } from 'react';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fetcher } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type RequisitionItem = {
    id: string;
    transaction_note_id: string;
    product_id: string;
    product_variant_id: string;
    quantity: string;
    patch_code: string;
    expire_date: string;
    company_id: string;
    is_active: string;
    updated_by: string | null;
    updated_at: string;
};

type RequisitionNote = {
    id: string;
    from_location: string;
    to_location: string;
    note_date: string;
    status: string;
    company_id: string;
    created_by: string;
    note_number: string;
    is_active: string;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
    items: RequisitionItem[];
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};


export default function GoodsRequisitionPage() {
    const { company_id } = useLocation();
    const { toast } = useToast();
    const [notes, setNotes] = useState<RequisitionNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!company_id) {
            setIsLoading(false);
            return;
        };

        async function fetchData() {
            setIsLoading(true);
            try {
                const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/transaction-notes/filter/by-company?company_id=${company_id}`);
                if (!response.ok) throw new Error('Failed to fetch requisition notes');
                const data = await response.json();
                setNotes(data || []);
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch requisition notes.'
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
                <h1 className="text-3xl font-bold tracking-tight">Goods Requisition Notes</h1>
                <p className="text-muted-foreground">
                    A log of all past stock requisition notes.
                </p>
                </div>
                 <Button asChild className="w-full sm:w-auto">
                    <Link href="/inventory/goods-requisition/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Requisition
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Requisition History</CardTitle>
                    <CardDescription>
                        Browse and review previously created notes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Note Number</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        Array.from({length: 5}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell className="text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                            </TableRow>
                        ))
                    ) : notes.length > 0 ? (
                         notes.map((note) => (
                            <TableRow key={note.id}>
                                <TableCell className="font-medium">{note.note_number || `TN-${note.id}`}</TableCell>
                                <TableCell>{note.from_location}</TableCell>
                                <TableCell>{note.to_location}</TableCell>
                                <TableCell>{format(new Date(note.note_date), 'dd MMM, yyyy')}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="secondary" className={cn("capitalize", getStatusColor(note.status))}>
                                        {note.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/inventory/goods-requisition/${note.id}`}>View Details</Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No requisition notes found.
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

