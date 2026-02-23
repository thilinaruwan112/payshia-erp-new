
'use client'

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
    transaction_date: string;
    description: string;
    in: string;
    out: string;
    balance: number;
}

interface ReportData {
    transactions: Transaction[];
    summary: {
        total_in: number;
        total_out: number;
        final_balance: number;
    };
}

export const BinCardReportView = ({ reportData }: { reportData: ReportData }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const transactions = reportData?.transactions || [];
    const summary = reportData?.summary || { total_in: 0, total_out: 0, final_balance: 0 };

    const totalPages = Math.ceil(transactions.length / itemsPerPage);
    const paginatedTransactions = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Bin Card Report</CardTitle>
                <CardDescription>Detailed stock movement for the selected item and period.</CardDescription>
                {summary && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total In</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold text-green-600">{summary.total_in.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Out</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold text-destructive">{summary.total_out.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Final Balance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{summary.final_balance.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="w-[40%]">Description</TableHead>
                            <TableHead className="text-right">In</TableHead>
                            <TableHead className="text-right">Out</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedTransactions.length > 0 ? paginatedTransactions.map((tx, index) => (
                            <TableRow key={`${tx.transaction_date}-${index}`}>
                                <TableCell>{format(new Date(tx.transaction_date), 'yyyy-MM-dd')}</TableCell>
                                <TableCell>{tx.description}</TableCell>
                                <TableCell className="text-right font-mono text-green-600">{parseFloat(tx.in) > 0 ? parseFloat(tx.in).toFixed(2) : '-'}</TableCell>
                                <TableCell className="text-right font-mono text-destructive">{parseFloat(tx.out) > 0 ? parseFloat(tx.out).toFixed(2) : '-'}</TableCell>
                                <TableCell className="text-right font-mono font-bold">{tx.balance.toFixed(2)}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No transactions found for this period.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                     {summary && paginatedTransactions.length > 0 && (
                        <TableFooter>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell colSpan={2} className="text-right">Totals</TableCell>
                                <TableCell className="text-right font-mono text-green-600">{summary.total_in.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono text-destructive">{summary.total_out.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">{summary.final_balance.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </CardContent>
            {transactions.length > itemsPerPage && (
                <CardFooter className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {paginatedTransactions.length} of {transactions.length} transactions.
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
