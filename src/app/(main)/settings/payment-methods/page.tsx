
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
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLocation } from '@/components/location-provider';
import { fetcher } from '@/lib/api';
import { PaymentMethodFormDialog } from '@/components/payment-method-form-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PaymentMethod {
    id: string;
    method: string;
    created_at: string;
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const { toast } = useToast();
  const { company_id } = useLocation();

  const fetchMethods = async () => {
    if (!company_id) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/payment-method`);
        if (!response.ok) {
            throw new Error('Failed to fetch payment methods');
        }
        const data = await response.json();
        setMethods(data || []);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Failed to load payment methods',
            description: 'Could not fetch data from the server.',
        });
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMethods();
  }, [company_id]);

  const handleDelete = async () => {
    if (!selectedMethod) return;
    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/payment-method/${selectedMethod.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete payment method.');
        }
        setMethods(methods.filter(m => m.id !== selectedMethod.id));
        toast({
            title: 'Payment Method Deleted',
            description: `The method "${selectedMethod.method}" has been deleted.`,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: 'destructive',
            title: 'Failed to delete method',
            description: errorMessage,
        });
    } finally {
        setIsConfirmOpen(false);
        setSelectedMethod(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
            <p className="text-muted-foreground">
              Manage the payment options available in your POS and invoices.
            </p>
          </div>
           <PaymentMethodFormDialog onSave={fetchMethods}>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Method
                </Button>
            </PaymentMethodFormDialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Payment Methods</CardTitle>
            <CardDescription>
              A list of all payment methods configured in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method Name</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  methods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell className="font-medium">{method.method}</TableCell>
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
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => {
                                  setSelectedMethod(method);
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
                {!isLoading && methods.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center">
                            No payment methods found.
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
              This action cannot be undone. This will permanently delete the payment method {' '}
              <span className="font-bold text-foreground">{selectedMethod?.method}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedMethod(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
