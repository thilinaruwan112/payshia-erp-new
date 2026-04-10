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
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TaxFormDialog } from '@/components/tax-form';
import { useState, useEffect } from 'react';
import { useLocation } from '@/components/location-provider';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tax } from '@/lib/types';
import { fetcher } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


export default function TaxesPage() {
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
    const { company_id } = useLocation();
    const { toast } = useToast();

    const fetchTaxes = async () => {
        if (!company_id) {
            setIsLoading(false);
            return;
        };
        setIsLoading(true);
        try {
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/taxes/filter/by-company?company_id=${company_id}`);
            if (!response.ok) throw new Error('Failed to fetch taxes.');
            const data: any[] = await response.json();
            
            const formattedData: Tax[] = (data || []).map(item => ({
                id: item.tax_id,
                tax_code: item.tax_code,
                tax_name: item.tax_name,
                rate: parseFloat(item.rate),
                apply_on: item.apply_on,
                sort_order: parseInt(item.sort_order, 10),
                is_active: parseInt(item.is_active, 10),
                company_id: parseInt(item.company_id, 10),
                location_id: parseInt(item.location_id, 10),
                created_by: item.created_by,
                created_at: item.created_at,
            }));

            setTaxes(formattedData);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load taxes.'
            });
            setTaxes([]);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (company_id) {
          fetchTaxes();
        } else {
          setIsLoading(false);
        }
    }, [company_id, toast]);

    const handleDelete = async () => {
        if (!selectedTax) return;
        try {
            const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/taxes/${selectedTax.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete tax.');
            }
            toast({ title: 'Tax Deleted', description: `The tax "${selectedTax.tax_name}" has been deleted.` });
            fetchTaxes();
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
             toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsConfirmOpen(false);
            setSelectedTax(null);
        }
    }

    return (
        <>
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Taxes</h1>
                    <p className="text-muted-foreground">
                        Manage your company's tax rates and settings.
                    </p>
                </div>
                <TaxFormDialog onSave={fetchTaxes}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Tax
                    </Button>
                </TaxFormDialog>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Configured Taxes</CardTitle>
                    <CardDescription>A list of all tax rates for your company.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tax Code</TableHead>
                                <TableHead>Tax Name</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({length: 3}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : taxes.length > 0 ? (
                                taxes.map(tax => (
                                    <TableRow key={tax.id}>
                                        <TableCell className="font-mono">{tax.tax_code}</TableCell>
                                        <TableCell className="font-medium">{tax.tax_name}</TableCell>
                                        <TableCell>{tax.rate}%</TableCell>
                                        <TableCell>
                                            <Badge variant={tax.is_active ? 'default' : 'secondary'} className={cn(tax.is_active ? 'bg-green-100 text-green-800' : '')}>
                                                {tax.is_active ? 'Active' : 'Inactive'}
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
                                                    <TaxFormDialog tax={tax} onSave={fetchTaxes}>
                                                        <DropdownMenuItem onSelect={e => e.preventDefault()}>Edit</DropdownMenuItem>
                                                    </TaxFormDialog>
                                                    <DropdownMenuItem 
                                                        className="text-destructive"
                                                        onSelect={() => {
                                                            setSelectedTax(tax);
                                                            setIsConfirmOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No taxes configured.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the tax {' '}
                        <span className="font-bold text-foreground">{selectedTax?.tax_name}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSelectedTax(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}