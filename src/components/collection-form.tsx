
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
import { products } from "@/lib/data";
import type { Collection, Product } from "@/lib/types";
import { ProductPickerDialog } from "./product-picker-dialog";
import React from "react";
import Image from "next/image";
import { X, UploadCloud } from "lucide-react";

const collectionFormSchema = z.object({
  title: z.string().min(3, {
    message: "Collection title must be at least 3 characters.",
  }),
  coverImage: z.string().optional(),
  products: z.array(z.string()).optional(),
});

type CollectionFormValues = z.infer<typeof collectionFormSchema>;

interface CollectionFormProps {
    collection?: Collection;
}

export function CollectionForm({ collection }: CollectionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [selectedProducts, setSelectedProducts] = React.useState<Product[]>(
    collection ? products.slice(0, collection.productCount) : []
  );

  const defaultValues: Partial<CollectionFormValues> = {
    title: collection?.title || "",
    coverImage: collection?.coverImage || "",
    products: selectedProducts.map(p => p.id),
  };

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { setValue } = form;

  function onSubmit(data: CollectionFormValues) {
    console.log(data);
    toast({
      title: collection ? "Collection Updated" : "Collection Created",
      description: `The collection "${data.title}" has been saved.`,
    });
    router.push('/products/collections');
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

  const removeProduct = (productId: string) => {
    const updatedProducts = selectedProducts.filter(p => p.id !== productId);
    setSelectedProducts(updatedProducts);
    setValue('products', updatedProducts.map(p => p.id), { shouldValidate: true });
  }

  const pageTitle = collection ? 'Edit Collection' : 'Create Collection';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-nowrap">{pageTitle}</h1>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full">Save Collection</Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Collection Details</CardTitle>
                </CardHeader>
                <CardContent>
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
                                    src="https://placehold.co/150x150.png"
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
                                    onClick={() => removeProduct(product.id)}
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
                  <CardTitle>Cover Image</CardTitle>
                  <CardDescription>
                    This will be displayed on the collection page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4">
                  {form.watch('coverImage') ? (
                    <div className="relative">
                       <Image
                        src={form.watch('coverImage') as string}
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
                          onClick={() => form.setValue('coverImage', '')}
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
