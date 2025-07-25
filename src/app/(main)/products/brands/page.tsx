
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
import type { Brand } from '@/lib/data';
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

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchBrands() {
      setIsLoading(true);
      try {
        const response = await fetch('https://server-erp.payshia.com/brands');
        if (!response.ok) {
          throw new Error('Failed to fetch brands');
        }
        const data = await response.json();
        setBrands(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load brands',
          description: 'Could not fetch brands from the server.',
        });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBrands();
  }, [toast]);

  const handleDelete = async () => {
    if (!selectedBrand) return;

    try {
        const response = await fetch(`https://server-erp.payshia.com/brands/${selectedBrand.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete brand');
        }
        setBrands(brands.filter(b => b.id !== selectedBrand.id));
        toast({
            title: 'Brand Deleted',
            description: `The brand "${selectedBrand.name}" has been deleted.`,
        });
    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: 'destructive',
            title: 'Failed to delete brand',
            description: errorMessage,
        });
    } finally {
        setIsConfirmOpen(false);
        setSelectedBrand(null);
    }
  };


  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
            <p className="text-muted-foreground">
              Manage your product brands.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/products/brands/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Brand
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Brands</CardTitle>
            <CardDescription>
              A list of all brands in your system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand Name</TableHead>
                  <TableHead>Description</TableHead>
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
                      <TableCell>
                        <Skeleton className="h-4 w-64" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  brands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell>{brand.description}</TableCell>
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
                              <Link href={`/products/brands/${brand.id}`}>
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onSelect={() => {
                                  setSelectedBrand(brand);
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
              This action cannot be undone. This will permanently delete the brand {' '}
              <span className="font-bold text-foreground">{selectedBrand?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedBrand(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
