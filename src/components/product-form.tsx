
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
import { Trash2, UploadCloud, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import type { Product, Supplier, ProductVariant, ProductImage } from "@/lib/types";
import { useLocation } from "./location-provider";
import { Combobox } from "./ui/combobox";
import { ImageUploadDialog } from "./image-upload-dialog";
import Image from "next/image";
import { fetcher } from "@/lib/api";

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

type CustomField = {
  field_id: string;
  field_name: string;
  description: string;
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
  barcode: z.string().optional(),
  colorId: z.string().optional(),
  sizeId: z.string().optional(),
  price: z.coerce.number().min(0, { message: "Selling Price must be a positive number." }),
  cost_price: z.coerce.number().optional(),
  min_price: z.coerce.number().optional(),
  wholesale_price: z.coerce.number().optional(),
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
  recipeType: z.enum(["standard", "a_la_carte", "item_recipe"]).optional(),
  item_type: z.enum(["raw", "menu", "both"]).optional(),
  variants: z.array(variantSchema).min(1, { message: "At least one variant is required." }),
  supplier: z.array(z.string()).optional(),
  customFields: z.array(customFieldSchema).optional(),
  base_location: z.string().min(1, { message: "Base location is required." }),
  available_locations: z.array(z.string()).min(1, { message: "At least one location must be selected." }),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product & { images?: ProductImage[], custom_fields?: CustomField[] };
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [savedProductId, setSavedProductId] = React.useState<string | null>(product?.id || null);
  const [savedVariants, setSavedVariants] = React.useState<ProductVariant[]>(product?.variants || []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customFieldMasters, setCustomFieldMasters] = useState<CustomFieldMaster[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>(product?.images || []);
  const { company_id, availableLocations } = useLocation();

  const normalizeRecipeType = (apiValue?: string) => {
    if (apiValue === 'ala cart') return 'a_la_carte';
    if (apiValue === 'standard' || apiValue === 'item_recipe') return apiValue;
    return 'standard';
  };
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
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
      recipeType: normalizeRecipeType(product?.recipe_type) as ProductFormValues['recipeType'],
      item_type: product?.item_type || "both",
      variants: product?.variants?.map(v => ({
          id: v.id,
          sku: v.sku,
          barcode: v.barcode || "",
          colorId: v.color_id ?? undefined,
          sizeId: v.size_id ?? undefined,
          price: v.price ? parseFloat(String(v.price)) : 0,
          cost_price: v.cost_price ? parseFloat(String(v.cost_price)) : 0,
          min_price: v.min_price ? parseFloat(String(v.min_price)) : 0,
          wholesale_price: v.wholesale_price ? parseFloat(String(v.wholesale_price)) : 0,
      })) || [{ sku: "", barcode: "", colorId: "", sizeId: "", price: 0 }],
      supplier: [],
      customFields: [],
      base_location: product?.base_location || "",
      available_locations: product?.available_locations?.split(',') || [],
    },
    mode: "onChange",
  });
  
  const { fields, append, remove } = useFieldArray({
    name: "variants",
    control: form.control,
  });

  const fetchData = useCallback(async () => {
    if (!company_id) return;
  
    const urls: { [key: string]: string } = {
      categories: `${process.env.NEXT_PUBLIC_API_BASE_URL}/master-categories/company?company_id=${company_id}`,
      brands: `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/company?company_id=${company_id}`,
      colors: `${process.env.NEXT_PUBLIC_API_BASE_URL}/product-colors/company?company_id=${company_id}`,
      sizes: `${process.env.NEXT_PUBLIC_API_BASE_URL}/sizes/filter/company?company_id=${company_id}`,
      suppliers: `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/filter/by-company?company_id=${company_id}`,
      customFields: `${process.env.NEXT_PUBLIC_API_BASE_URL}/custom-fields/filter/by-company?company_id=${company_id}`,
    };
  
    try {
      const responses = await Promise.all(Object.values(urls).map(url => fetcher(url)));
      const dataPromises = responses.map(res => res.json());
      const [
        categoriesData,
        brandsData,
        colorsData,
        sizesData,
        suppliersData,
        customFieldsData,
      ] = await Promise.all(dataPromises);
  
      setCategories(categoriesData || []);
      setBrands(brandsData || []);
      setColors(colorsData || []);
      setSizes(sizesData || []);
      setSuppliers(suppliersData || []);
      setCustomFieldMasters(customFieldsData || []);
      
      // Now that master data is loaded, set form values that depend on it
      if (product?.supplier && suppliersData.length > 0) {
        const supplierNames = product.supplier.split(',').map(s => s.trim());
        const supplierIds = suppliersData
            .filter((s: Supplier) => supplierNames.includes(s.supplier_name))
            .map((s: Supplier) => s.supplier_id);
        form.setValue('supplier', supplierIds);
      }

      if (product?.custom_fields && customFieldsData.length > 0) {
        const existingCustomFields = product.custom_fields.map(cf => ({
            master_custom_field_id: cf.field_id,
            value: cf.value,
        }));
        const masterIdsInProduct = new Set(existingCustomFields.map(f => f.master_custom_field_id));
        const missingMasterFields = customFieldsData
            .filter((mf: CustomFieldMaster) => !masterIdsInProduct.has(mf.id))
            .map((mf: CustomFieldMaster) => ({
                master_custom_field_id: mf.id,
                value: '',
            }));
        form.setValue('customFields', [...existingCustomFields, ...missingMasterFields]);
      } else if (customFieldsData.length > 0 && !product?.custom_fields) {
        form.setValue('customFields', customFieldsData.map((mf: CustomFieldMaster) => ({
            master_custom_field_id: mf.id,
            value: '',
        })));
      }

      // Fetch images only if a product exists
      if (product) {
        let allImages: ProductImage[] = [];
        const variantsToFetch = product.variants && product.variants.length > 0 ? product.variants : [{ id: product.id, sku: '', product_id: product.id }];
        for (const variant of variantsToFetch) {
          if (!variant.id) continue;
          try {
            const imgResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-images/get/img?company_id=${company_id}&product_id=${product.id}&product_variant_id=${variant.id}`);
            if (imgResponse.ok) {
              const imgData = await imgResponse.json();
              if (Array.isArray(imgData)) {
                allImages = [...allImages, ...imgData];
              }
            }
          } catch(e) {
             console.error(`Failed to fetch images for variant ${variant.id}`, e);
          }
        }
        const uniqueImages = Array.from(new Map(allImages.map(img => [img.id, img])).values());
        setProductImages(uniqueImages);
      }
    } catch (error) {
      console.error("Data fetching error:", error);
      toast({
        variant: "destructive",
        title: "Failed to load initial data",
        description: "Could not fetch necessary data from the server.",
      });
    }
  }, [company_id, product, toast, form]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRemoveVariant = async (index: number) => {
    const variantId = form.getValues(`variants.${index}.id`);
    
    if (!variantId) {
        remove(index);
        return;
    }

    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-variants/${variantId}`, {
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
      price: data.variants[0]?.price || 0,
      cost_price: data.variants[0]?.cost_price || 0,
      min_price: data.variants[0]?.min_price || 0,
      wholesale_price: data.variants[0]?.wholesale_price || 0,
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
      item_type: data.item_type || "both",
      base_location: data.base_location,
      product_image_url: "",
      recipe_type: data.recipeType === 'a_la_carte' ? 'ala cart' : data.recipeType || 'standard',
      barcode: "",
      available_locations: data.available_locations.join(','),
      variants: data.variants.map(v => ({
        id: v.id,
        sku: v.sku,
        barcode: v.barcode || v.sku,
        color: colors.find(c => c.id === v.colorId)?.name || "",
        size: sizes.find(s => s.id === v.sizeId)?.value || "",
        color_id: v.colorId ? parseInt(v.colorId, 10) : undefined,
        size_id: v.sizeId ? parseInt(v.sizeId, 10) : undefined,
        price: v.price,
        cost_price: v.cost_price,
        min_price: v.min_price,
        wholesale_price: v.wholesale_price,
      })),
    };
    
    const url = product ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/${product.id}` : `${process.env.NEXT_PUBLIC_API_BASE_URL}/products`;

    const method = product ? 'PUT' : 'POST';

    try {
      const response = await fetcher(url, {
        method: method,
        body: JSON.stringify(apiPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }

      const returnedProduct = result.product;
      const productId = returnedProduct.id;
      
      const detailsResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/details/full/slug/?slug=${returnedProduct.slug}`);
      const detailsData = await detailsResponse.json();

      setSavedProductId(productId);
      setSavedVariants(detailsData.variants);

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

            await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/custom-field-products`, {

              method: 'POST',
              body: JSON.stringify(customFieldPayload),
            });
          }
        }
      }

      toast({
        title: product ? "Product Updated" : "Product Created",
        description: result.message || "The product has been saved successfully.",
      });
      setUploadDialogOpen(true);
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

  const handleDeleteImage = async (imageId: string) => {
    try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-images/${imageId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete image');
        }
        setProductImages(prev => prev.filter(img => img.id !== imageId));
        toast({ title: 'Image Deleted' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    }
  };

  const pageTitle = product ? `Edit Product: ${product.name}` : 'Create Product';
  const customFieldsInForm = form.watch('customFields');

  const frontImage = productImages.find(img => img.image_type === 'front img');
  const otherImages = productImages.filter(img => img.image_type !== 'front img');


  return (
    <>
    <ImageUploadDialog
      isOpen={isUploadDialogOpen}
      onOpenChange={setUploadDialogOpen}
      productId={savedProductId}
      companyId={company_id}
      productVariants={savedVariants}
      onUploadComplete={() => {
        setUploadDialogOpen(false);
        router.push('/products');
        router.refresh();
      }}
    />
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
                    <CardHeader className="flex flex-row items-center justify-between">
                         <div>
                            <CardTitle>Media</CardTitle>
                            <CardDescription>Images for this product.</CardDescription>
                        </div>
                        {savedProductId && (
                            <Button type="button" variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Upload Images
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {productImages.length === 0 ? (
                             <button
                                type="button"
                                className="w-full border-2 border-dashed border-muted rounded-lg p-12 text-center hover:border-primary/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => setUploadDialogOpen(true)}
                                disabled={!savedProductId}
                             >
                                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="mt-4 text-sm text-muted-foreground">
                                    {savedProductId ? 'Click to upload images' : 'No images uploaded. Save the product to upload.'}
                                </p>
                            </button>
                        ) : (
                            <>
                                {frontImage && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-medium mb-2 text-muted-foreground">Front Image</h3>
                                        <div className="relative w-full max-w-xs">
                                            <Image
                                                src={`${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${frontImage.img_url}`}
                                                alt={product?.name || 'Front image'}
                                                width={400}
                                                height={400}
                                                className="rounded-lg object-cover aspect-square border"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 h-7 w-7"
                                                onClick={() => handleDeleteImage(frontImage.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {otherImages.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium mb-2 text-muted-foreground">{frontImage ? 'Other Images' : 'Images'}</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {otherImages.map(image => (
                                                <div key={image.id} className="relative group">
                                                    <Image
                                                        src={`${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${image.img_url}`}
                                                        alt={product?.name || 'Product image'}
                                                        width={150}
                                                        height={150}
                                                        className="rounded-lg object-cover aspect-square border"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleDeleteImage(image.id)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                    </div>
                                    </div>
                                )}
                           </>
                        )}
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
                      .map((masterField, masterIndex) => {
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
                        <CardTitle>Variants</CardTitle>
                        <CardDescription>Add variants like size or color. Each variant must have a unique SKU and its own price.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {fields.map((field, index) => (
                           <div key={field.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6 items-end border p-4 rounded-md mb-4 relative">
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
                                    name={`variants.${index}.barcode`}
                                    render={({ field }) => (
                                        <FormItem className="col-span-full sm:col-span-1">
                                        <FormLabel>Barcode</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123456789012" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div></div>
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
                                 <div></div>
                                 {/* Pricing fields */}
                                  <FormField
                                    control={form.control}
                                    name={`variants.${index}.price`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Selling Price</FormLabel>
                                            <FormControl><Input type="number" placeholder="0.00" {...field} startIcon="Rs" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                  <FormField
                                    control={form.control}
                                    name={`variants.${index}.cost_price`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cost</FormLabel>
                                            <FormControl><Input type="number" placeholder="0.00" {...field} startIcon="Rs" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name={`variants.${index}.min_price`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Min Price</FormLabel>
                                            <FormControl><Input type="number" placeholder="0.00" {...field} startIcon="Rs" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.wholesale_price`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Wholesale</FormLabel>
                                            <FormControl><Input type="number" placeholder="0.00" {...field} startIcon="Rs" /></FormControl>
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
                            onClick={() => append({ sku: "", barcode: "", colorId: "", sizeId: "", price: 0 })}
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
                        <FormField
                          control={form.control}
                          name="item_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Item Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an item type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="raw">Raw</SelectItem>
                                  <SelectItem value="menu">Menu</SelectItem>
                                  <SelectItem value="both">Both</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="space-y-2">
                           <FormField
                                control={form.control}
                                name="base_location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Base Location</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                <SelectValue placeholder="Select the main location" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableLocations.map(loc => (
                                                    <SelectItem key={loc.location_id} value={loc.location_id}>{loc.location_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <FormField
                                control={form.control}
                                name="available_locations"
                                render={() => (
                                    <FormItem>
                                        <div className="mb-4">
                                            <FormLabel>Available Locations</FormLabel>
                                            <FormDescription>
                                                Select all locations where this product is available.
                                            </FormDescription>
                                        </div>
                                        <div className="space-y-2">
                                            {availableLocations.map((location) => (
                                                <FormField
                                                    key={location.location_id}
                                                    control={form.control}
                                                    name="available_locations"
                                                    render={({ field }) => (
                                                        <FormItem
                                                            key={location.location_id}
                                                            className="flex flex-row items-center space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(location.location_id)}
                                                                onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), location.location_id])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                        (value) => value !== location.location_id
                                                                        )
                                                                    )
                                                                }}
                                                            />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                {location.location_name}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
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
    </>
  );
}
