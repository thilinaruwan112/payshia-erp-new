



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
import { MoreHorizontal, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Location, StockTransfer } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';


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

export default function StockTransfersPage() {
    const { toast } = useToast();
    const [transfers, setTransfers] = useState<StockTransfer[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const [transfersResponse, locationsResponse] = await Promise.all([
                    fetch('https://server-erp.payshia.com/stock-transfers/filter/by-company?company_id=1'),
                    fetch('https://server-erp.payshia.com/locations')
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
    }, [toast]);
    
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
        <Button asChild className="w-full sm:w-auto">
          <Link href="/transfers/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Transfer
          </Link>
        </Button>
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
