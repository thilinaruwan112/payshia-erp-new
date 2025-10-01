

'use client'

import { type GoodsReceivedNote, type Supplier } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCurrency } from '../currency-provider';
import { useLocation } from '../location-provider';
import { useToast } from '@/hooks/use-toast';
import { fetcher } from '@/lib/api';

const getStatusText = (status: string) => {
  switch (status) {
    case '0': return 'Pending';
    case '1': return 'Approved';
    case '2': return 'Rejected';
    case '3': return 'Cancelled';
    default: return 'Received';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case '0': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case '1': case 'Received': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case '2': case '3': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

export const GrnReportView = ({ grns }: { grns: GoodsReceivedNote[] }) => {
    const { currencySymbol } = useCurrency();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const { company_id } = useLocation();
    const itemsPerPage = 10;
    
    useEffect(() => {
        async function fetchSuppliers() {
            if (!company_id) return;
            try {
                const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/filter/by-company?company_id=${company_id}`);
                if (response.ok) {
                    setSuppliers(await response.json());
                }
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch supplier list for report.'});
            }
        }
        fetchSuppliers();
    }, [company_id, toast]);

    const grnsWithSupplier = useMemo(() => {
        return grns.map(grn => ({
            ...grn,
            supplierName: suppliers.find(s => s.supplier_id === grn.supplier_id)?.supplier_name || `ID: ${grn.supplier_id}`
        }));
    }, [grns, suppliers]);

    const filteredGrns = grnsWithSupplier.filter(grn =>
        grn.grn_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grn.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredGrns.length / itemsPerPage);
    const paginatedGrns = filteredGrns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>GRN Report</CardTitle>
                <CardDescription>A list of all Goods Received Notes in the system.</CardDescription>
                <div className="pt-4">
                    <Input
                        placeholder="Search by GRN number or supplier name..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="max-w-sm"
                    />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>GRN Number</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedGrns.map((grn) => (
                            <TableRow key={grn.id}>
                                <TableCell>{grn.grn_number}</TableCell>
                                <TableCell>{grn.supplierName}</TableCell>
                                <TableCell>{format(new Date(grn.created_at), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={cn(getStatusColor(grn.grn_status))}>
                                        {getStatusText(grn.grn_status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(grn.grand_total).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {paginatedGrns.length} of {filteredGrns.length} GRNs.
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
        </Card>
    );
};
