
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Collection, Product } from "@/lib/types";
import { ProductPickerDialog } from "./product-picker-dialog";
import React from "react";
import Image from "next/image";
import { X, UploadCloud, Loader2 } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useLocation } from "./location-provider";

const collectionFormSchema = z.object({
  title: z.string().min(3, {
    message: "Collection title must be at least 3 characters.",
  }),
  description: z.string().optional(),
  cover_image_url: z.string().optional(),
  status: z.enum(["active", "draft"]),
  products: z.array(z.string()).optional(),
});

type CollectionFormValues = z.infer<typeof collectionFormSchema>;

interface CollectionFormProps {
    collection?: Collection & { products?: Product[] };
}

export function CollectionForm({ collection }: CollectionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const { company_id } = useLocation();
  
  const [selectedProducts, setSelectedProducts] = React.useState<Product[]>(collection?.products || []);

  const defaultValues: Partial<CollectionFormValues> = {
    title: collection?.title || "",
    description: collection?.description || "",
    cover_image_url: collection?.cover_image_url || "",
    status: collection?.status || "active",
    products: selectedProducts.map(p => p.id),
  };

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { setValue } = form;

  async function onSubmit(data: CollectionFormValues) {
    if (!company_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No company selected.' });
      return;
    }
    setIsLoading(true);
    const url = collection ? `https://server-erp.payshia.com/collections/${collection.id}` : 'https://server-erp.payshia.com/collections';
    const method = collection ? 'PUT' : 'POST';

    const collectionPayload = {
      title: data.title,
      description: data.description,
      cover_image_url: data.cover_image_url,
      status: data.status,
      company_id: company_id,
    };
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(collectionPayload),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Something went wrong');
        }

        const collectionId = collection?.id || result.id;

        // Sync products
        const initialProductIds = new Set(collection?.products?.map(p => p.id) || []);
        const currentProducts = selectedProducts;
        
        // Add only newly added products (those without a collectionProductId)
        const productsToAdd = currentProducts.filter(p => !p.collectionProductId);

        for (const productToAdd of productsToAdd) {
            await fetch('https://server-erp.payshia.com/collection-products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collection_id: collectionId, product_id: parseInt(productToAdd.id, 10) }),
            });
        }

        toast({
            title: collection ? "Collection Updated" : "Collection Created",
            description: `The collection "${data.title}" has been saved.`,
        });
        router.push('/products/collections');
        router.refresh();

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: "destructive",
            title: "Failed to save collection",
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  }

  const handleProductsSelected = (newProducts: Product[]) => {
    const updatedProducts = [...selectedProducts];
    newProducts.forEach(newProduct => {
        if (!updatedProducts.find(p => p.id === newProduct.id)) {
            updatedProducts.push(newProduct);
        }
    });
    setSelectedProducts(updatedProducts);
    setValue('products', updatedProducts.map(p => p.id), { shouldValidate: true });
  }

  const removeProduct = async (productToRemove: Product) => {
    // If product is not saved yet (no collectionProductId), just remove from UI state
    if (!productToRemove.collectionProductId) {
       const updatedProducts = selectedProducts.filter(p => p.id !== productToRemove.id);
       setSelectedProducts(updatedProducts);
       setValue('products', updatedProducts.map(p => p.id), { shouldValidate: true });
       return;
    }

    // If it's a saved product, call the API to delete the association
    try {
        const response = await fetch(`https://server-erp.payshia.com/collection-products/${productToRemove.collectionProductId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to remove product from collection');
        }

        // On successful deletion, update the UI state
        const updatedProducts = selectedProducts.filter(p => p.id !== productToRemove.id);
        setSelectedProducts(updatedProducts);
        setValue('products', updatedProducts.map(p => p.id), { shouldValidate: true });
        
        toast({
            title: 'Product Removed',
            description: `"${productToRemove.name}" has been removed from the collection.`,
        });

    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
         toast({
            variant: 'destructive',
            title: 'Error Removing Product',
            description: errorMessage,
        });
    }
  }

  const pageTitle = collection ? `Edit Collection: ${collection.title}` : 'Create Collection';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-nowrap">{pageTitle}</h1>
                <p className="text-muted-foreground">{collection ? 'Update the details for this collection.' : 'Add a new collection to your system.'}</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full" disabled={isLoading}>Cancel</Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? 'Saving...' : 'Save Collection'}
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Collection Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Collection Title</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Summer Collection" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="A short description for the collection." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Products</CardTitle>
                        <CardDescription>Add products to this collection.</CardDescription>
                    </div>
                    <ProductPickerDialog onProductsSelected={handleProductsSelected}>
                        <Button type="button" variant="outline">Add Products</Button>
                    </ProductPickerDialog>
                </CardHeader>
                <CardContent>
                    {selectedProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                           {selectedProducts.map(product => (
                             <div key={product.id} className="relative group">
                                <Image
                                    src={product.product_image_url || "https://placehold.co/150x150.png"}
                                    alt={product.name}
                                    width={150}
                                    height={150}
                                    className="rounded-lg object-cover aspect-square"
                                    data-ai-hint="product photo"
                                />
                                <Button 
                                    variant="destructive" 
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeProduct(product)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <p className="text-sm font-medium mt-2 truncate">{product.name}</p>
                             </div>
                           ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                            <p>No products in this collection yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
             <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
              </Card>
             <Card>
                <CardHeader>
                  <CardTitle>Cover Image</CardTitle>
                  <CardDescription>
                    This will be displayed on the collection page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4">
                  {form.watch('cover_image_url') ? (
                    <div className="relative">
                       <Image
                        src="https://placehold.co/200x200.png"
                        alt="Cover image preview"
                        width={200}
                        height={200}
                        className="rounded-lg object-cover aspect-video"
                        data-ai-hint="collection cover photo"
                      />
                       <Button 
                          variant="destructive" 
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => form.setValue('cover_image_url', '')}
                      >
                          <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-4 text-sm text-muted-foreground">
                        No image uploaded
                      </p>
                    </div>
                  )}
                  <Button variant="outline" type="button" className="w-full">
                    Upload Image
                  </Button>
                </CardContent>
              </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
