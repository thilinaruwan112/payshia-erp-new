
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
import { Trash2, UploadCloud, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import type { Product, Supplier } from "@/lib/types";
import { useLocation } from "./location-provider";
import { Combobox } from "./ui/combobox";

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

type CustomFieldMaster = {
    id: string;
    field_name: string;
    description: string;
}

const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, { message: "SKU is required." }),
  colorId: z.string().optional(),
  sizeId: z.string().optional(),
});

const customFieldSchema = z.object({
    master_custom_field_id: z.string(),
    value: z.string(),
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
  recipeType: z.enum(["standard", "a_la_carte", "item_recipe"]).optional(),
  variants: z.array(variantSchema).min(1, { message: "At least one variant is required." }),
  supplier: z.array(z.string()).optional(),
  customFields: z.array(customFieldSchema).optional(),
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customFieldMasters, setCustomFieldMasters] = useState<CustomFieldMaster[]>([]);
  const { company_id } = useLocation();

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
    
    if (company_id) {
        fetchData(`https://server-erp.payshia.com/master-categories/company?company_id=${company_id}`, setCategories, 'categories');
        fetchData(`https://server-erp.payshia.com/brands/company?company_id=${company_id}`, setBrands, 'brands');
        fetchData(`https://server-erp.payshia.com/product-colors/company?company_id=${company_id}`, setColors, 'colors');
        fetchData(`https://server-erp.payshia.com/sizes/filter/company?company_id=${company_id}`, setSizes, 'sizes');
        fetchData(`https://server-erp.payshia.com/suppliers/filter/by-company?company_id=${company_id}`, setSuppliers, 'suppliers');
        fetchData(`https://server-erp.payshia.com/custom-fields/filter/by-company?company_id=${company_id}`, setCustomFieldMasters, 'custom fields');
    }
  }, [toast, company_id]);
  
  const defaultValues: Partial<ProductFormValues> = {
    name: product?.name || "",
    printName: product?.print_name || "",
    tamilName: product?.tamil_name || "",
    sinhalaName: product?.sinhala_name || "",
    displayName: product?.display_name || "",
    description: product?.description || "",
    stockUnit: product?.stock_unit || "Nos",
    status: product?.status || "active",
    categoryId: product?.category_id || "",
    brandId: product?.brand_id || "",
    sellingPrice: product?.price ? parseFloat(String(product.price)) : 0,
    costPrice: product?.cost_price ? parseFloat(String(product.cost_price)) : 0,
    minPrice: product?.min_price ? parseFloat(String(product.min_price)) : 0,
    wholesalePrice: product?.wholesale_price ? parseFloat(String(product.wholesale_price)) : 0,
    recipeType: product?.recipe_type || "standard",
    variants: product?.variants?.map(v => ({
        id: v.id,
        sku: v.sku,
        colorId: v.color_id ?? undefined,
        sizeId: v.size_id ?? undefined,
    })) || [{ sku: "", colorId: "", sizeId: "" }],
    supplier: product?.supplier?.split(',').map(sName => {
        const foundSupplier = suppliers.find(s => s.supplier_name === sName.trim());
        return foundSupplier ? foundSupplier.supplier_id : '';
    }).filter(Boolean) || [],
    customFields: [],
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
    mode: "onChange",
  });
  
  useEffect(() => {
    if (customFieldMasters.length > 0 && form.getValues('customFields')?.length === 0) {
        form.setValue('customFields', customFieldMasters.map(field => ({
            master_custom_field_id: field.id,
            value: '', 
        })));
    }
  }, [customFieldMasters, form]);
  
  useEffect(() => {
    if (product?.supplier && suppliers.length > 0) {
        const supplierIds = product.supplier.split(',').map(sName => {
            const foundSupplier = suppliers.find(s => s.supplier_name === sName.trim());
            return foundSupplier ? foundSupplier.supplier_id : null;
        }).filter(Boolean) as string[];
        form.setValue('supplier', supplierIds);
    }
  }, [product, suppliers, form]);

  const { fields, append, remove } = useFieldArray({
    name: "variants",
    control: form.control,
  });

  const handleRemoveVariant = async (index: number) => {
    const variantId = form.getValues(`variants.${index}.id`);
    
    if (!variantId) {
        remove(index);
        return;
    }

    try {
        const response = await fetch(`https://server-erp.payshia.com/product-variants/${variantId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete variant');
        }
        
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
    if (!company_id) {
        toast({ variant: 'destructive', title: 'Error', description: 'No company selected.' });
        return;
    }
    setIsLoading(true);

    const selectedCategory = categories.find(c => c.id === data.categoryId);
    
    const apiPayload = {
      name: data.name,
      description: data.description || "",
      category: selectedCategory?.name || "",
      category_id: parseInt(data.categoryId, 10),
      brand_id: data.brandId ? parseInt(data.brandId, 10) : undefined,
      price: data.sellingPrice,
      cost_price: data.costPrice || 0,
      min_price: data.minPrice || 0,
      wholesale_price: data.wholesalePrice || 0,
      stock_unit: data.stockUnit || "PCS",
      status: data.status,
      sinhala_name: data.sinhalaName || "",
      tamil_name: data.tamilName || "",
      print_name: data.printName || data.name,
      display_name: data.displayName || data.name,
      supplier: data.supplier?.join(',') || "",
      company_id: company_id,
      lead_time_days: 0,
      reorder_level_qty: 0,
      item_type: "finished_good",
      base_location: "warehouse_a",
      product_image_url: "",
      recipe_type: data.recipeType === 'a_la_carte' ? 'ala cart' : data.recipeType || 'standard',
      barcode: "",
      available_locations: "warehouse_a",
      variants: data.variants.map(v => ({
        id: v.id,
        sku: v.sku,
        color: colors.find(c => c.id === v.colorId)?.name || "",
        size: sizes.find(s => s.id === v.sizeId)?.value || "",
        color_id: v.colorId ? parseInt(v.colorId, 10) : undefined,
        size_id: v.sizeId ? parseInt(v.sizeId, 10) : undefined,
        barcode: v.sku,
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

      const productId = product?.id || result.product.id;

      if (data.customFields && data.customFields.length > 0) {
        for (const cf of data.customFields) {
          if (cf.value) { 
            const customFieldPayload = {
              master_custom_field_id: parseInt(cf.master_custom_field_id, 10),
              company_id: company_id,
              created_by: "admin",
              updated_by: "admin",
              product_id: parseInt(productId, 10),
              value: cf.value
            };
            await fetch('https://server-erp.payshia.com/custom-field-products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(customFieldPayload),
            });
          }
        }
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
  const customFieldsInForm = form.watch('customFields');


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
                    <CardTitle>Custom Fields</CardTitle>
                    <CardDescription>Add extra details for this product.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {customFieldMasters.length > 0 && customFieldsInForm && customFieldMasters
                      .filter(masterField => customFieldsInForm.some(cf => cf.master_custom_field_id === masterField.id))
                      .map((masterField) => {
                          const fieldIndex = customFieldsInForm.findIndex(cf => cf.master_custom_field_id === masterField.id);
                          if (fieldIndex === -1) return null;

                          return (
                              <FormField
                                key={masterField.id}
                                control={form.control}
                                name={`customFields.${fieldIndex}.value`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{masterField.field_name}</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder={masterField.description || `Enter ${masterField.field_name}`}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                          )
                    })}
                    {customFieldMasters.length === 0 && (
                      <p className="text-sm text-muted-foreground">No custom fields defined. You can add them in the product settings.</p>
                    )}
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
                                             <Combobox
                                                options={colors.map(c => ({ value: c.id, label: c.name }))}
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                placeholder="Select a color"
                                                notFoundText="No color found."
                                            />
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
                                             <Combobox
                                                options={sizes.map(s => ({ value: s.id, label: s.value }))}
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                placeholder="Select a size"
                                                notFoundText="No size found."
                                            />
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
                                    <Combobox
                                        options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select a category"
                                        notFoundText="No category found."
                                    />
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
                                     <Combobox
                                        options={brands.map(b => ({ value: b.id, label: b.name }))}
                                        value={field.value || ""}
                                        onChange={field.onChange}
                                        placeholder="Select a brand"
                                        notFoundText="No brand found."
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="recipeType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Recipe Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select a recipe type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="standard">Standard</SelectItem>
                                        <SelectItem value="a_la_carte">A La Carte</SelectItem>
                                        <SelectItem value="item_recipe">Item Recipe</SelectItem>
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
                        <CardTitle>Suppliers</CardTitle>
                        <CardDescription>Select the suppliers for this product.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="supplier"
                            render={() => (
                                <FormItem>
                                    <div className="space-y-2">
                                        {suppliers.map((supplier) => (
                                            <FormField
                                                key={supplier.supplier_id}
                                                control={form.control}
                                                name="supplier"
                                                render={({ field }) => {
                                                    return (
                                                    <FormItem
                                                        key={supplier.supplier_id}
                                                        className="flex flex-row items-start space-x-3 space-y-0"
                                                    >
                                                        <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(supplier.supplier_id)}
                                                            onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...(field.value || []), supplier.supplier_id])
                                                                : field.onChange(
                                                                    field.value?.filter(
                                                                    (value) => value !== supplier.supplier_id
                                                                    )
                                                                )
                                                            }}
                                                        />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                            {supplier.supplier_name}
                                                        </FormLabel>
                                                    </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
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
