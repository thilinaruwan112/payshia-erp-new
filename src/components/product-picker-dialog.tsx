
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
import { products } from "@/lib/data"
import type { Product } from "@/lib/types"
import { ScrollArea } from "./ui/scroll-area"
import Image from "next/image"
import { Checkbox } from "./ui/checkbox"

interface ProductPickerDialogProps {
    children: React.ReactNode;
    onProductsSelected: (products: Product[]) => void;
}

export function ProductPickerDialog({ children, onProductsSelected }: ProductPickerDialogProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedProducts, setSelectedProducts] = React.useState<Product[]>([]);

    const handleSelectProduct = (product: Product, checked: boolean) => {
        if (checked) {
            setSelectedProducts(prev => [...prev, product]);
        } else {
            setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
        }
    }

    const handleConfirm = () => {
        onProductsSelected(selectedProducts);
        setSelectedProducts([]);
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
                        Choose products to add to the collection.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] border rounded-md">
                     <div className="p-4 space-y-4">
                        {products.map(product => (
                            <div key={product.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50">
                                <Checkbox
                                    id={`product-${product.id}`}
                                    onCheckedChange={(checked) => handleSelectProduct(product, !!checked)}
                                    checked={!!selectedProducts.find(p => p.id === product.id)}
                                />
                                <label htmlFor={`product-${product.id}`} className="flex items-center gap-4 cursor-pointer">
                                    <Image
                                        src="https://placehold.co/64x64.png"
                                        alt={product.name}
                                        width={48}
                                        height={48}
                                        className="rounded-md object-cover"
                                        data-ai-hint="product photo"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-sm text-muted-foreground">{product.category}</p>
                                    </div>
                                </label>
                            </div>
                        ))}
                     </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={selectedProducts.length === 0}>
                        Add {selectedProducts.length > 0 ? `(${selectedProducts.length})` : ''} Products
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
