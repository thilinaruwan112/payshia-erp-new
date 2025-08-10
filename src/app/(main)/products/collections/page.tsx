
'use client'

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
import type { Collection } from '@/lib/data';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCollections() {
      try {
        const response = await fetch('https://server-erp.payshia.com/collections/company?company_id=1');
        if (!response.ok) {
          throw new Error('Failed to fetch collections');
        }
        const data: Collection[] = await response.json();
        
        const counts = await Promise.all(data.map(async (collection) => {
            const countResponse = await fetch(`https://server-erp.payshia.com/collection-products/count/${collection.id}`);
            if (!countResponse.ok) {
                console.error(`Failed to fetch count for collection ${collection.id}`);
                return { ...collection, productCount: 0 };
            }
            const countData = await countResponse.json();
            return { ...collection, productCount: Number(countData.product_count) };
        }));

        setCollections(counts);

      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCollections();
  }, []);

  const handleDelete = async () => {
    if (!selectedCollection) return;

    try {
        const response = await fetch(`https://server-erp.payshia.com/collections/${selectedCollection.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete collection');
        }
        setCollections(collections.filter(c => c.id !== selectedCollection.id));
        toast({
            title: 'Collection Deleted',
            description: `The collection "${selectedCollection.title}" has been deleted.`,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: 'destructive',
            title: 'Failed to delete collection',
            description: errorMessage,
        });
    } finally {
        setIsConfirmOpen(false);
        setSelectedCollection(null);
    }
  };


  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground">
            Group your products into collections.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/products/collections/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Collection
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Collections</CardTitle>
          <CardDescription>
            Manage your product collections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] hidden sm:table-cell">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="hidden sm:table-cell">Product Count</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell className="hidden sm:table-cell">
                            <Skeleton className="h-16 w-16 rounded-md" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            <Skeleton className="h-4 w-64" />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                            <Skeleton className="h-4 w-12" />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                             <Skeleton className="h-6 w-20 rounded-full" />
                        </TableCell>
                        <TableCell className="text-right">
                             <Skeleton className="h-8 w-8 rounded-md" />
                        </TableCell>
                    </TableRow>
                 ))
              ) : (
                collections.map((collection) => (
                    <TableRow key={collection.id}>
                    <TableCell className="hidden sm:table-cell">
                        <Image
                            alt={collection.title}
                            className="aspect-square rounded-md object-cover"
                            height="64"
                            src={`https://placehold.co/64x64.png`}
                            width="64"
                            data-ai-hint="collection photo"
                        />
                    </TableCell>
                    <TableCell className="font-medium">{collection.title}</TableCell>
                    <TableCell className="hidden md:table-cell truncate max-w-sm">{collection.description}</TableCell>
                    <TableCell className="hidden sm:table-cell text-center">{collection.productCount}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant={collection.status === 'active' ? 'default' : 'secondary'} className={cn(
                            collection.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : ''
                        )}>
                            {collection.status}
                        </Badge>
                    </TableCell>
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
                            <Link href={`/products/collections/${collection.id}`}>Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onSelect={() => {
                                  setSelectedCollection(collection);
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
              This action cannot be undone. This will permanently delete the collection {' '}
              <span className="font-bold text-foreground">{selectedCollection?.title}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCollection(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
