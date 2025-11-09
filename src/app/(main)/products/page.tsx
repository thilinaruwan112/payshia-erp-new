

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
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Star, Trash2, UploadCloud } from 'lucide-react';
import type { Product, InventoryItem, ProductVariant, ProductImage } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import Link from 'next/link';
import { checkPlanLimit } from '@/lib/plan-limits';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import React, { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCurrency } from '@/components/currency-provider';
import { useLocation } from '@/components/location-provider';
import { ImageUploadDialog } from '@/components/image-upload-dialog';
import { fetcher } from '@/lib/api';

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  frontImageUrl?: string | null;
}


export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState({ hasAccess: true, limit: Infinity, usage: 0, name: '...' });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedProductForUpload, setSelectedProductForUpload] = useState<ProductWithVariants | null>(null);
  const { toast } = useToast();
  const { currencySymbol } = useCurrency();
  const { company_id } = useLocation();

  const fetchProducts = useCallback(async () => {
    if (!company_id) {
        setIsLoading(false);
        return;
    };
    setIsLoading(true);
    try {
      const [productsResponse, limitResponse] = await Promise.all([
         fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/get/filter/by-company?company_id=${company_id}`),
         checkPlanLimit('products'),
      ]);
      
      if (!productsResponse.ok) throw new Error('Failed to fetch products');
      
      const productsData: Product[] = await productsResponse.json();
      
      const productsWithDetails = await Promise.all(
        productsData.map(async (p) => {
          const detailsResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/details/${p.id}`, { cache: 'no-store' });
          if (!detailsResponse.ok) {
            console.error(`Failed to fetch details for product ${p.id}`);
            return { ...p, variants: [], frontImageUrl: p.product_image_url };
          }
          const detailsData = await detailsResponse.json();

          // Fetch the front image specifically
          let frontImageUrl: string | null = null;
          if (detailsData.variants && detailsData.variants.length > 0) {
              const firstVariant = detailsData.variants[0];
              const imageResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-images/get/img?company_id=${company_id}&product_id=${p.id}&product_variant_id=${firstVariant.id}`);
              if (imageResponse.ok) {
                  const images: ProductImage[] = await imageResponse.json();
                  const frontImage = images.find(img => img.image_type === 'front img');
                  frontImageUrl = frontImage ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${frontImage.img_url}` : null;
              }
          }
           if (!frontImageUrl) {
            frontImageUrl = p.product_image_url ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${p.product_image_url}` : null;
          }

          return { 
            ...p, 
            price: parseFloat(p.price as any), 
            variants: detailsData.variants || [],
            frontImageUrl: frontImageUrl,
          };
        })
      );
      
      setProducts(productsWithDetails);
      setPlanDetails(limitResponse);

    } catch (error) {
       toast({
        variant: "destructive",
        title: "Failed to load products",
        description: "Could not fetch products from the server.",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [company_id, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${selectedProduct.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete product');
        }
        setProducts(products.filter(p => p.id !== selectedProduct.id));
        toast({
            title: 'Product Deleted',
            description: `The product "${selectedProduct.name}" has been deleted.`,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: 'destructive',
            title: 'Failed to delete product',
            description: errorMessage,
        });
    } finally {
        setIsConfirmOpen(false);
        setSelectedProduct(null);
    }
  };

  const handleUploadComplete = () => {
    setUploadDialogOpen(false);
    setSelectedProductForUpload(null);
    fetchProducts(); // Refresh data after upload
  };


  return (
    <>
      <ImageUploadDialog
        isOpen={isUploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        productId={selectedProductForUpload?.id || null}
        productVariants={selectedProductForUpload?.variants || []}
        companyId={company_id}
        onUploadComplete={handleUploadComplete}
       />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Manage your products and view their inventory. You are on the{' '}
              <span className="font-semibold text-primary">{planDetails.name}</span> plan.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto" disabled={!planDetails.hasAccess}>
            <Link href="/products/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>

        {!planDetails.hasAccess && (
          <Alert>
            <Star className="h-4 w-4" />
            <AlertTitle>Upgrade to add more products</AlertTitle>
            <AlertDescription>
              You have reached the limit of {planDetails.limit} products on the {planDetails.name} plan.
              <Button asChild variant="link" className="p-0 pl-1 h-auto">
                <Link href="/billing">Upgrade your plan</Link>
              </Button>
              to add more.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
            <CardDescription>
              Showing {products.length} of {planDetails.limit === Infinity ? 'unlimited' : planDetails.limit} products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Inventory</TableHead>
                  <TableHead className="hidden lg:table-cell">Price</TableHead>
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
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                         <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="text-right">
                         <Skeleton className="h-8 w-8 rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  products.map((product) => {
                    const totalStock = (product.variants || []).reduce((sum, variant) => {
                        return sum + (Number(variant.stock) || 0);
                    }, 0);
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="hidden sm:table-cell">
                          <Image
                            alt={product.name}
                            className="aspect-square rounded-md object-cover"
                            src={product.frontImageUrl || "https://placehold.co/64x64.png"}
                            width={64}
                            height={64}
                            data-ai-hint="product photo"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground lg:hidden">{product.category}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                           <Badge variant={'secondary'} className={cn(
                              product.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                           )}>
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{totalStock} in stock</TableCell>
                        <TableCell className="hidden lg:table-cell">{currencySymbol}{(product.price as number).toFixed(2)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                               <DropdownMenuItem asChild>
                                <Link href={`/products/${product.slug}`}>Edit</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => {
                                  setSelectedProductForUpload(product);
                                  setUploadDialogOpen(true);
                              }}>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                <span>Upload Image</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>Duplicate</DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onSelect={() => {
                                    setSelectedProduct(product);
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
                    );
                  })
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
                This action cannot be undone. This will permanently delete the product {' '}
                <span className="font-bold text-foreground">{selectedProduct?.name}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedProduct(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );
}



