

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Location } from '@/lib/types';
import { useCurrency } from '@/components/currency-provider';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type StockTransfer = {
    id: string;
    from_location: string;
    to_location: string;
    transfer_date: string;
    status: 'pending' | 'in-transit' | 'completed';
    stock_transfer_number: string;
};


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
    const { currencySymbol } = useCurrency();
    const { toast } = useToast();
    const [transfers, setTransfers] = useState<StockTransfer[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const [transfersResponse, locationsResponse] = await Promise.all([
                    fetch('https://server-erp.payshia.com/stock-transfers'),
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
                transfers.map((transfer) => (
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
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))
              )}
               {!isLoading && transfers.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No stock transfers found.
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
