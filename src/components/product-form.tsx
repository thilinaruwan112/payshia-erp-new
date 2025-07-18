
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
import { collections, products } from "@/lib/data";
import { Trash2, UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

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
  category: z.string().min(1, { message: "Please select a category." }),
  sellingPrice: z.coerce.number().min(0, { message: "Selling Price must be a positive number." }),
  costPrice: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  wholesalePrice: z.coerce.number().optional(),
  price2: z.coerce.number().optional(),
  foreignPrice: z.coerce.number().optional(),
  variants: z.array(
    z.object({
      sku: z.string().min(1, { message: "SKU is required." }),
      color: z.string().optional(),
      size: z.string().optional(),
    })
  ).min(1, { message: "At least one variant is required." }),
  collections: z.array(z.string()).optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const defaultValues: Partial<ProductFormValues> = {
  name: "",
  printName: "",
  tamilName: "",
  sinhalaName: "",
  displayName: "",
  description: "",
  stockUnit: "Nos",
  status: "active",
  sellingPrice: 0,
  variants: [{ sku: "", color: "", size: "" }],
  collections: [],
};

export function ProductForm() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    name: "variants",
    control: form.control,
  });
  
  const existingCategories = [...new Set(products.map(p => p.category))];

  function onSubmit(data: ProductFormValues) {
    console.log(data);
    toast({
      title: "Product Created",
      description: "The new product has been saved successfully.",
    });
    router.push('/products');
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-nowrap">Create Product</h1>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button" onClick={() => router.back()} className="w-full">Cancel</Button>
                <Button type="submit" className="w-full">Save Product</Button>
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
                                        <Input type="number" placeholder="0.00" {...field} startIcon="$" />
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
                                        <Input type="number" placeholder="0.00" {...field} startIcon="$" />
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
                                        <Input type="number" placeholder="0.00" {...field} startIcon="$" />
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
                                        <Input type="number" placeholder="0.00" {...field} startIcon="$" />
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
                                        <Input type="number" placeholder="0.00" {...field} startIcon="$" />
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
                                        <Input type="number" placeholder="0.00" {...field} startIcon="$" />
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
                                    name={`variants.${index}.color`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Color</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Black" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.size`}
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Size</FormLabel>
                                        <FormControl>
                                            <Input placeholder="S" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                               {fields.length > 1 && (
                                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
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
                            onClick={() => append({ sku: "", color: "", size: "" })}
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
                            name="category"
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
                                        {existingCategories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        You can manage categories in your product settings.
                                    </FormDescription>
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
