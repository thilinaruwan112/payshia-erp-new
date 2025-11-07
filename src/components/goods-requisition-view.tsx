
'use client'

import { type RequisitionNote } from '@/lib/types';
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
import { format } from 'date-fns';
import { fetcher } from '@/lib/api';

interface GoodsRequisitionViewProps {
    id: string;
}

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


export function GoodsRequisitionView({ id }: GoodsRequisitionViewProps) {
  const router = useRouter();
  const [note, setNote] = useState<RequisitionNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/transaction-notes/${id}`);
        if (!response.ok) {
           if (response.status === 404) notFound();
           throw new Error('Failed to fetch requisition note data');
        }
        const data: RequisitionNote = await response.json();
        setNote(data);

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load requisition note',
          description: error instanceof Error ? error.message : 'Could not fetch data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, toast]);
  
  const handlePrint = () => {
    // Placeholder for print functionality
    toast({ title: 'Print function not yet implemented.' });
  };

  if (isLoading) {
    return <GoodsRequisitionViewSkeleton />;
  }

  if (!note) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>Could not load requisition data.</CardDescription>
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
              Requisition: {note.note_number}
            </h1>
            <p className="text-muted-foreground">
                Created on {new Date(note.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
              </Button>
              <Button onClick={handlePrint} disabled>
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
                    <p className="text-sm font-medium text-muted-foreground">From</p>
                    <p className="font-semibold">{note.from_location || 'N/A'}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">To</p>
                    <p className="font-semibold">{note.to_location || 'N/A'}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                    <p className="font-semibold">{new Date(note.note_date).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant="secondary" className={cn("capitalize", getStatusColor(note.status))}>
                           {note.status}
                    </Badge>
                </div>
             </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Items</CardTitle>
                <CardDescription>List of products requested in this note.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product ID</TableHead>
                            <TableHead>Variant ID</TableHead>
                            <TableHead>Batch Code</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {note.items?.map((item) => (
                           <TableRow key={item.id}>
                                <TableCell>{item.product_id}</TableCell>
                                <TableCell>{item.product_variant_id}</TableCell>
                                <TableCell>{item.patch_code}</TableCell>
                                <TableCell>{item.expire_date}</TableCell>
                                <TableCell className="text-right">{parseFloat(item.quantity)}</TableCell>
                           </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
         </Card>
    </div>
  );
}

function GoodsRequisitionViewSkeleton() {
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
                <div className="space-y-2">
                    <TableRow>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    </TableRow>
                     <TableRow>
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
