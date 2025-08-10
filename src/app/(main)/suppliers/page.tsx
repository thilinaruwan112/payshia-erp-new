
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
import type { Supplier } from '@/lib/types';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSuppliers() {
      setIsLoading(true);
      try {
        const response = await fetch('https://server-erp.payshia.com/suppliers/filter/by-company?company_id=1');
        if (!response.ok) {
          throw new Error('Failed to fetch suppliers');
        }
        const data = await response.json();
        setSuppliers(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load suppliers',
          description: 'Could not fetch suppliers from the server.',
        });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSuppliers();
  }, [toast]);

  const handleDelete = async () => {
    if (!selectedSupplier) return;

    try {
      const response = await fetch(`https://server-erp.payshia.com/suppliers/${selectedSupplier.supplier_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete supplier');
      }
      setSuppliers(suppliers.filter(s => s.supplier_id !== selectedSupplier.supplier_id));
      toast({
        title: 'Supplier Deleted',
        description: `The supplier "${selectedSupplier.supplier_name}" has been deleted.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        variant: 'destructive',
        title: 'Failed to delete supplier',
        description: errorMessage,
      });
    } finally {
      setIsConfirmOpen(false);
      setSelectedSupplier(null);
    }
  };


  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Suppliers</h1>
            <p className="text-muted-foreground">
              Manage your suppliers and vendors.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/suppliers/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Supplier
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Suppliers</CardTitle>
            <CardDescription>
              A list of all your suppliers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="hidden md:table-cell">Contact Person</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                       <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                       <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                       <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier.supplier_id}>
                      <TableCell className="font-medium">
                        {supplier.supplier_name}
                        <div className="block md:hidden text-sm text-muted-foreground">{supplier.contact_person}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{supplier.contact_person}</TableCell>
                      <TableCell className="hidden sm:table-cell">{supplier.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{supplier.telephone}</TableCell>
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
                              <Link href={`/suppliers/${supplier.supplier_id}`}>Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onSelect={() => {
                                  setSelectedSupplier(supplier);
                                  setIsConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
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
              This action cannot be undone. This will permanently delete the supplier {' '}
              <span className="font-bold text-foreground">{selectedSupplier?.supplier_name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSupplier(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
