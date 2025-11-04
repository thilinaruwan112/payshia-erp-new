
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { MoreHorizontal, PlusCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Location, StockTransfer, RequisitionNote } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocation } from '@/components/location-provider';
import { fetcher } from '@/lib/api';
import { format } from 'date-fns';


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

const getRequisitionStatusColor = (status: string) => {
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


export default function StockTransfersPage() {
    const { toast } = useToast();
    const [transfers, setTransfers] = useState<StockTransfer[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const { company_id } = useLocation();
    const itemsPerPage = 15;
    const [requisitionNotes, setRequisitionNotes] = useState<RequisitionNote[]>([]);
    const [isLoadingRequisitions, setIsLoadingRequisitions] = useState(false);

    const fetchRequisitions = async () => {
        if (!company_id) return;
        setIsLoadingRequisitions(true);
        try {
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/transaction-notes/filter/by-company?company_id=${company_id}`);
            if (!response.ok) throw new Error('Failed to fetch requisition notes');
            const data = await response.json();
            setRequisitionNotes(data || []);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not fetch requisition notes.'
            })
        } finally {
            setIsLoadingRequisitions(false);
        }
    };


    useEffect(() => {
        async function fetchData() {
            if (!company_id) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const [transfersResponse, locationsResponse] = await Promise.all([
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stock-transfers/filter/by-company?company_id=${company_id}`),
                    fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations/company?company_id=${company_id}`)
                ]);

                if (!transfersResponse.ok) throw new Error('Failed to fetch stock transfers');
                if (!locationsResponse.ok) throw new Error('Failed to fetch locations');

                const transfersData = await transfersResponse.json();
                const locationsData = await locationsResponse.json();

                setTransfers(transfersData || []);
                setLocations(locationsData || []);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                toast({
                    variant: 'destructive',
                    title: 'Failed to load data',
                    description: errorMessage,
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [toast, company_id]);
    
    const getLocationName = (id: string) => {
        return locations.find(loc => loc.location_id === id)?.location_name || `ID: ${id}`;
    }

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransfers = transfers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(transfers.length / itemsPerPage);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Transfers</h1>
          <p className="text-muted-foreground">
            Move inventory between your locations.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <Dialog onOpenChange={(open) => open && fetchRequisitions()}>
                 <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                        <FileText className="mr-2 h-4 w-4" />
                        Goods Requisition
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                     <DialogHeader>
                        <DialogTitle>Goods Requisition Notes</DialogTitle>
                        <DialogDescription>
                            A log of all past stock requisition notes.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
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
                            {isLoadingRequisitions ? (
                                Array.from({length: 3}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : requisitionNotes.length > 0 ? (
                                requisitionNotes.map((note) => (
                                    <TableRow key={note.id}>
                                        <TableCell className="font-medium">{note.note_number || `TN-${note.id}`}</TableCell>
                                        <TableCell>{note.from_location}</TableCell>
                                        <TableCell>{note.to_location}</TableCell>
                                        <TableCell>{format(new Date(note.note_date), 'dd MMM, yyyy')}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className={cn("capitalize", getRequisitionStatusColor(note.status))}>
                                                {note.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/inventory/goods-requisition/${note.id}`} target="_blank">View</Link>
                                            </Button>
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
                    </div>
                </DialogContent>
            </Dialog>
            <Button asChild className="w-full sm:w-auto">
            <Link href="/transfers/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Transfer
            </Link>
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Stock Transfers</CardTitle>
          <CardDescription>
            A history of all your inventory movements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-350px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer #</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    Array.from({length: 5}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                        </TableRow>
                    ))
                ) : (
                  currentTransfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.stock_transfer_number}</TableCell>
                      <TableCell>{getLocationName(transfer.from_location)}</TableCell>
                      <TableCell>{getLocationName(transfer.to_location)}</TableCell>
                      <TableCell>
                          <Badge variant="secondary" className={cn(getStatusColor(transfer.status))}>
                          {transfer.status}
                          </Badge>
                      </TableCell>
                      <TableCell>{new Date(transfer.transfer_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/transfers/${transfer.id}`}>View Details</Link>
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                      </TableRow>
                  ))
                )}
                 {!isLoading && currentTransfers.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                          No stock transfers found.
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
         <CardFooter className="flex justify-end items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                 <span className="sr-only">Next Page</span>
              </Button>
            </div>
          </CardFooter>
      </Card>
    </div>
  );
}
