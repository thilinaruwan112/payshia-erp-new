
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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { type Collection } from '@/lib/data';
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

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const response = await fetch('https://server-erp.payshia.com/collections');
        if (!response.ok) {
          throw new Error('Failed to fetch collections');
        }
        const data = await response.json();
        setCollections(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCollections();
  }, []);

  return (
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
                            src={collection.cover_image_url || `https://placehold.co/64x64.png`}
                            width="64"
                            data-ai-hint="collection photo"
                        />
                    </TableCell>
                    <TableCell className="font-medium">{collection.title}</TableCell>
                    <TableCell className="hidden md:table-cell truncate max-w-sm">{collection.description}</TableCell>
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
                            <DropdownMenuItem className="text-destructive">
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
  );
}
