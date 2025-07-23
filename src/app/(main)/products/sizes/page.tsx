
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
import type { Size } from '@/lib/types';
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

export default function SizesPage() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSizes() {
      setIsLoading(true);
      try {
        const response = await fetch('https://server-erp.payshia.com/sizes');
        if (!response.ok) {
          throw new Error('Failed to fetch sizes');
        }
        const data = await response.json();
        setSizes(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load sizes',
          description: 'Could not fetch sizes from the server.',
        });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSizes();
  }, [toast]);

  const handleDelete = async () => {
    if (!selectedSize) return;

    try {
        const response = await fetch(`https://server-erp.payshia.com/sizes/${selectedSize.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete size');
        }
        setSizes(sizes.filter(s => s.id !== selectedSize.id));
        toast({
            title: 'Size Deleted',
            description: `The size "${selectedSize.value}" has been deleted.`,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: 'destructive',
            title: 'Failed to delete size',
            description: errorMessage,
        });
    } finally {
        setIsConfirmOpen(false);
        setSelectedSize(null);
    }
  };

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sizes</h1>
          <p className="text-muted-foreground">
            Manage your product sizes.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/products/sizes/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Size
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sizes</CardTitle>
          <CardDescription>
            A list of all sizes in your system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Size Value</TableHead>
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
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                sizes.map((size) => (
                  <TableRow key={size.id}>
                    <TableCell className="font-medium">{size.value}</TableCell>
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
                            <Link href={`/products/sizes/${size.id}`}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                              className="text-destructive"
                              onSelect={() => {
                                  setSelectedSize(size);
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
              This action cannot be undone. This will permanently delete the size {' '}
              <span className="font-bold text-foreground">{selectedSize?.value}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSize(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
