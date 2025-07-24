
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { collections } from "@/lib/data";
import { Trash2, UploadCloud, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import type { Product } from "@/lib/types";

type Category = {
  id: string;
  name: string;
};

type Brand = {
  id: string;
  name: string;
};

type Color = {
  id: string;
  name: string;
};

type Size = {
    id: string;
    value: string;
}

const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, { message: "SKU is required." }),
  colorId: z.string().optional(),
  sizeId: z.string().optional(),
});

const productFormSchema = z.object({
  name: z.string().min(3, {
    message: "Product name must be at least 3 characters.",
  }),
  printName: z.string().optional(),
  tamilName: z.string().optional(),
  sinhalaName: z.string().optional(),
  displayName: z.string().optional(),
  description: z.string().optional(),
  stockUnit: z.string().optional(),
  status: z.enum(["active", "draft"]),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  brandId: z.string().optional(),
  sellingPrice: z.coerce.number().min(0, { message: "Selling Price must be a positive number." }),
  costPrice: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  wholesalePrice: z.coerce.number().optional(),
  price2: z.coerce.number().optional(),
  foreignPrice: z.coerce.number().optional(),
  variants: z.array(variantSchema).min(1, { message: "At least one variant is required." }),
  collections: z.array(z.string()).optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);

  const defaultValues: Partial<ProductFormValues> = {
    name: product?.name || "",
    printName: product?.print_name || "",
    tamilName: product?.tamilName || "",
    sinhalaName: product?.sinhala_name || "",
    displayName: product?.displayName || "",
    description: product?.description || "",
    stockUnit: product?.stock_unit || "Nos",
    status: product?.status || "active",
    categoryId: product?.category_id || "",
    brandId: product?.brand_id || "",
    sellingPrice: product?.price ? parseFloat(String(product.price)) : 0,
    costPrice: product?.cost_price ? parseFloat(String(product.cost_price)) : 0,
    minPrice: product?.min_price ? parseFloat(String(product.min_price)) : 0,
    wholesalePrice: product?.wholesale_price ? parseFloat(String(product.wholesale_price)) : 0,
    variants: product?.variants?.map(v => ({
        id: v.id,
        sku: v.sku,
        colorId: v.color_id ?? undefined,
        sizeId: v.size_id ?? undefined,
    })) || [{ sku: "", colorId: "", sizeId: "" }],
  };

  useEffect(() => {
    async function fetchData(url: string, setData: Function, type: string) {
       try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${type}`);
        }
        const data = await response.json();
        setData(data);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: `Failed to load ${type}`,
          description: `Could not fetch ${type} from the server.`,
        });
      }
    }
    fetchData('https://server-erp.payshia.com/categories', setCategories, 'categories');
    fetchData('https://server-erp.payshia.com/brands', setBrands, 'brands');
    fetchData('https://server-erp.payshia.com/colors', setColors, 'colors');
    fetchData('https://server-erp.payshia.com/sizes', setSizes, 'sizes');
  }, [toast]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    name: "variants",
    control: form.control,
  });

  const handleRemoveVariant = async (index: number) => {
    const variantId = fields[index].id;

    // If the variant doesn't have an ID, it's a new one that hasn't been saved yet.
    // Just remove it from the form state.
    if (!variantId) {
        remove(index);
        return;
    }

    // If it has an ID, it exists on the server, so we need to make an API call.
    try {
        const response = await fetch(`https://server-erp.payshia.com/product-variants/${variantId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete variant');
        }

        // Only remove from the UI after successful deletion from the server.
        remove(index);
        toast({
            title: 'Variant Deleted',
            description: 'The variant has been successfully removed.',
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
            variant: 'destructive',
            title: 'Error Deleting Variant',
            description: errorMessage,
        });
    }
  };

  async function onSubmit(data: ProductFormValues) {
    setIsLoading(true);

    const selectedCategory = categories.find(c => c.id === data.categoryId);

    const apiPayload = {
      name: data.name,
      description: data.description,
      category: selectedCategory?.name,
      category_id: parseInt(data.categoryId, 10),
      price: data.sellingPrice,
      cost_price: data.costPrice,
      min_price: data.minPrice,
      wholesale_price: data.wholesalePrice,
      stock_unit: data.stockUnit,
      status: data.status,
      sinhala_name: data.sinhalaName,
      print_name: data.printName,
      brand_id: data.brandId ? parseInt(data.brandId, 10) : undefined,
      variants: data.variants.map(v => ({
        id: v.id,
        sku: v.sku,
        color: colors.find(c => c.id === v.colorId)?.name,
        size: sizes.find(s => s.id === v.sizeId)?.value,
        color_id: v.colorId ? parseInt(v.colorId, 10) : undefined,
        size_id: v.sizeId ? parseInt(v.sizeId, 10) : undefined,
      })),
    };
    
    const url = product ? `https://server-erp.payshia.com/products/${product.id}` : 'https://server-erp.payshia.com/products';
    const method = product ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }

      toast({
        title: product ? "Product Updated" : "Product Created",
        description: result.message || "The product has been saved successfully.",
      });
      router.push('/products');
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        variant: "destructive",
        title: product ? "Failed to Update Product" : "Failed to Create Product",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const pageTitle = product ? `Edit Product: ${product.name}` : 'Create Product';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-nowrap">{pageTitle}</h1>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full" disabled={isLoading}>Cancel</Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {product ? "Save Changes" : "Save Product"}
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Product Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Classic T-Shirt" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Display Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Classic T-Shirt (Unisex)" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="printName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Print Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Name for printing on labels/receipts" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="tamilName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tamil Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Product name in Tamil" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sinhalaName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Sinhala Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Product name in Sinhala" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell your customers about this great product."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="stockUnit"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Stock Unit</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a unit" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Nos">Nos (Numbers)</SelectItem>
                                            <SelectItem value="KG">KG (Kilogram)</SelectItem>
                                            <SelectItem value="Gram">Gram</SelectItem>
                                            <SelectItem value="Litre">Litre</SelectItem>
                                            <SelectItem value="ml">ml (Millilitre)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Media</CardTitle>
                        <CardDescription>Add images for your product.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-sm text-muted-foreground">Drag and drop images here, or click to browse.</p>
                            <Button variant="outline" type="button" className="mt-4">Browse Files</Button>
                         </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pricing</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="sellingPrice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Selling Price</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} startIcon="Rs" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="costPrice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cost</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} startIcon="Rs" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="minPrice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Minimum Price</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} startIcon="Rs" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="wholesalePrice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Wholesale Price</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} startIcon="Rs" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="price2"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price 2</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} startIcon="Rs" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="foreignPrice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Foreign Price</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} startIcon="Rs" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Variants</CardTitle>
                        <CardDescription>Add variants like size or color. Each variant must have a unique SKU.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {fields.map((field, index) => (
                           <div key={field.id} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end border p-4 rounded-md mb-4 relative">
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.sku`}
                                    render={({ field }) => (
                                        <FormItem className="col-span-full sm:col-span-1">
                                        <FormLabel>SKU</FormLabel>
                                        <FormControl>
                                            <Input placeholder="TS-BLK-S" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.colorId`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Color</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                <SelectValue placeholder="Select a color" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {colors.map(color => (
                                                    <SelectItem key={color.id} value={color.id}>{color.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.sizeId`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Size</FormLabel>
                                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                <SelectValue placeholder="Select a size" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {sizes.map(size => (
                                                    <SelectItem key={size.id} value={size.id}>{size.value}</SelectItem>
                                                ))}
                                            </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                               {fields.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveVariant(index)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove variant</span>
                                </Button>
                               )}
                           </div>
                        ))}
                         <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ sku: "", colorId: "", sizeId: "" })}
                        >
                            Add another variant
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Product status</CardTitle>
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
                        <CardTitle>Product organization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Categories are fetched from your server.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="brandId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Brand</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select a brand" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {brands.map(brand => (
                                            <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="collections"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel>Collections</FormLabel>
                                        <FormDescription>
                                            Add this product to a collection.
                                        </FormDescription>
                                    </div>
                                    {collections.map((item) => (
                                        <FormField
                                        key={item.id}
                                        control={form.control}
                                        name="collections"
                                        render={({ field }) => {
                                            return (
                                            <FormItem
                                                key={item.id}
                                                className="flex flex-row items-start space-x-3 space-y-0"
                                            >
                                                <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                    return checked
                                                        ? field.onChange([...(field.value || []), item.id])
                                                        : field.onChange(
                                                            field.value?.filter(
                                                            (value) => value !== item.id
                                                            )
                                                        )
                                                    }}
                                                />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                {item.title}
                                                </FormLabel>
                                            </FormItem>
                                            )
                                        }}
                                        />
                                    ))}
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                    </CardContent>
                </Card>
            </div>
        </div>
      </form>
    </Form>
  );
}
