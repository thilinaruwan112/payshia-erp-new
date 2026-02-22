
'use client'

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '../currency-provider';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface TransferItem {
    id: string;
    product_name: string;
    sku: string;
    quantity: string;
}

interface Transfer {
    id: string;
    stock_transfer_number: string;
    from_location_name: string;
    to_location_name: string;
    transfer_date: string;
    status: 'pending' | 'in-transit' | 'completed';
    total_quantity: string;
    items: TransferItem[];
}

interface ReportData {
    transfers: Transfer[];
    summary: {
        total_transfers: number;
        pending_transfers: number;
        completed_transfers: number;
        total_quantity_transferred: number;
    };
}

const getStatusColor = (status: Transfer['status']) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'in-transit': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

export const StockTransferReportView = ({ reportData }: { reportData: ReportData }) => {
    const { currencySymbol } = useCurrency();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const transfers = reportData?.transfers || [];
    const summary = reportData?.summary;

    const totalPages = Math.ceil(transfers.length / itemsPerPage);
    const paginatedTransfers = transfers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Stock Transfer Report</CardTitle>
                <CardDescription>A summary of stock movements between locations for the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-muted rounded-lg">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Transfers</h3>
                        <p className="text-2xl font-bold">{summary?.total_transfers || 0}</p>
                    </div>
                     <div className="p-4 bg-muted rounded-lg">
                        <h3 className="text-sm font-medium text-muted-foreground">Pending</h3>
                        <p className="text-2xl font-bold">{summary?.pending_transfers || 0}</p>
                    </div>
                     <div className="p-4 bg-muted rounded-lg">
                        <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
                        <p className="text-2xl font-bold">{summary?.completed_transfers || 0}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Qty Moved</h3>
                        <p className="text-2xl font-bold">{(summary?.total_quantity_transferred || 0).toLocaleString()}</p>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Transfer #</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedTransfers.length > 0 ? paginatedTransfers.map((transfer) => (
                            <TableRow key={transfer.id}>
                                <TableCell>{transfer.stock_transfer_number}</TableCell>
                                <TableCell>{transfer.from_location_name}</TableCell>
                                <TableCell>{transfer.to_location_name}</TableCell>
                                <TableCell>{format(new Date(transfer.transfer_date), 'yyyy-MM-dd')}</TableCell>
                                <TableCell><Badge variant="secondary" className={cn(getStatusColor(transfer.status))}>{transfer.status}</Badge></TableCell>
                                <TableCell className="text-right font-mono">{parseFloat(transfer.total_quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/transfers/${transfer.id}`}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Details
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">No transfers found for the selected criteria.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            {transfers.length > itemsPerPage && (
                 <CardFooter className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {paginatedTransfers.length} of {transfers.length} transfers.
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            )}
        </Card>
    );
};
