
"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Product, ProductVariant } from "@/lib/types"
import { ScrollArea } from "./ui/scroll-area"
import Image from "next/image"
import { Checkbox } from "./ui/checkbox"
import { Skeleton } from "./ui/skeleton"
import { useLocation } from "./location-provider"
import { useToast } from "@/hooks/use-toast"

interface ProductWithApiResponse {
  product: Product;
  product_images: { img_url: string; image_type: string }[];
  variants: { variant: ProductVariant }[];
}


// The item that will be displayed and selected in the dialog
type SelectableVariant = {
    id: string; // This will be the variant ID
    name: string; // This will be the combined name, e.g., "T-Shirt - Small - Red"
    sku: string;
    productData: Product;
    imageUrl?: string;
};

interface ProductPickerDialogProps {
    children: React.ReactNode;
    // The callback now returns the full product and the selected variant
    onProductsSelected: (products: (Product & { variant: ProductVariant, variantName: string })[]) => void;
}

export function ProductPickerDialog({ children, onProductsSelected }: ProductPickerDialogProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [selectableVariants, setSelectableVariants] = React.useState<SelectableVariant[]>([]);
    const [selectedVariants, setSelectedVariants] = React.useState<SelectableVariant[]>([]);
    const { company_id } = useLocation();
    const { toast } = useToast();

    React.useEffect(() => {
        if (isOpen && company_id) {
            async function fetchProducts() {
                setIsLoading(true);
                try {
                    const response = await fetch(`https://server-erp.payshia.com/products/with-variants/by-company?company_id=${company_id}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch products');
                    }
                    const data: { products: ProductWithApiResponse[] } = await response.json();
                    
                    const variants: SelectableVariant[] = (data.products || []).flatMap(p => {
                        const frontImage = p.product_images.find(img => img.image_type === 'front img');
                        const imageUrl = frontImage ? `${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${frontImage.img_url}` : "https://placehold.co/64x64.png";

                        if (!p.variants || p.variants.length === 0) {
                             // Handle case where product has no variants
                            return [{
                                id: p.product.id,
                                name: p.product.name,
                                sku: p.product.barcode || `SKU-${p.product.id}`,
                                productData: p.product,
                                imageUrl: imageUrl
                            }];
                        }
                        return p.variants.map(v => ({
                            id: v.variant.id,
                            name: [p.product.name, v.variant.color, v.variant.size].filter(Boolean).join(' - '),
                            sku: v.variant.sku,
                            productData: p.product,
                            imageUrl: imageUrl
                        }));
                    });

                    setSelectableVariants(variants);

                } catch (error) {
                    console.error(error);
                     toast({ variant: 'destructive', title: 'Error', description: 'Could not load product data.' });
                } finally {
                    setIsLoading(false);
                }
            }
            fetchProducts();
        }
    }, [isOpen, company_id, toast]);

    const handleSelectVariant = (variant: SelectableVariant, checked: boolean) => {
        if (checked) {
            setSelectedVariants(prev => [...prev, variant]);
        } else {
            setSelectedVariants(prev => prev.filter(v => v.id !== variant.id));
        }
    }

    const handleConfirm = () => {
        const result = selectedVariants.map(sv => {
            const variantData = sv.productData.variants?.find(v => v.id === sv.id) || { id: sv.id, sku: sv.sku };
            return {
                ...sv.productData,
                variant: variantData,
                variantName: sv.name,
            };
        });
        onProductsSelected(result);
        setSelectedVariants([]);
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Select Products</DialogTitle>
                    <DialogDescription>
                        Choose products to add.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] border rounded-md">
                     <div className="p-4 space-y-4">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-2">
                                    <Skeleton className="h-5 w-5 rounded-sm" />
                                    <Skeleton className="h-12 w-12 rounded-md" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            selectableVariants.map(variant => (
                                <div key={variant.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50">
                                    <Checkbox
                                        id={`variant-${variant.id}`}
                                        onCheckedChange={(checked) => handleSelectVariant(variant, !!checked)}
                                        checked={!!selectedVariants.find(v => v.id === variant.id)}
                                    />
                                    <label htmlFor={`variant-${variant.id}`} className="flex items-center gap-4 cursor-pointer">
                                        <Image
                                            src={variant.imageUrl || "https://placehold.co/64x64.png"}
                                            alt={variant.name}
                                            width={48}
                                            height={48}
                                            className="rounded-md object-cover"
                                            data-ai-hint="product photo"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium">{variant.name}</p>
                                            <p className="text-sm text-muted-foreground">{variant.sku}</p>
                                        </div>
                                    </label>
                                </div>
                            ))
                        )}
                     </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={selectedVariants.length === 0}>
                        Add {selectedVariants.length > 0 ? `(${selectedVariants.length})` : ''} Products
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
