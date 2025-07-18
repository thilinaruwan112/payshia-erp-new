
'use client';

import React, { useState, useEffect } from 'react';
import type { Product } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Plus, X } from 'lucide-react';
import { Separator } from '../ui/separator';

interface AddToCartDialogProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, discount: number) => void;
}

export function AddToCartDialog({
  product,
  onClose,
  onAddToCart,
}: AddToCartDialogProps) {
  const [quantity, setQuantity] = useState('1');
  const [discount, setDiscount] = useState('0');

  useEffect(() => {
    if (product) {
      setQuantity('1');
      setDiscount('0');
    }
  }, [product]);

  const handleAddToCart = () => {
    if (product) {
      const numQuantity = parseFloat(quantity);
      const numDiscount = parseFloat(discount);
      if (numQuantity > 0) {
        onAddToCart(product, numQuantity, numDiscount);
      }
    }
  };

  const handleNumpadClick = (value: string) => {
    if (quantity === '0' || quantity === '1') {
      if (value === '.') {
        setQuantity(quantity + value);
      } else {
        setQuantity(value);
      }
    } else if (value === '.' && quantity.includes('.')) {
      return; // Do not add multiple decimals
    }
     else {
      setQuantity(quantity + value);
    }
  };

  const handleClear = () => {
    setQuantity('1');
  };

  const isOpen = !!product;
  const discountedPrice = product ? product.price - parseFloat(discount) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0">
        {product && (
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left Column: Product Info */}
            <div className="p-6 flex flex-col">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl">{product.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{product.variants[0].sku}</p>
              </DialogHeader>

              <div className="bg-muted/50 rounded-lg p-4 flex justify-center items-center mb-4">
                <Image
                  src={`https://placehold.co/200x150.png`}
                  alt={product.name}
                  width={200}
                  height={150}
                  className="rounded-md object-cover"
                  data-ai-hint="product photo"
                />
              </div>

              <div className="grid grid-cols-4 gap-y-3 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground">Stock</p>
                  <p className="font-bold">25</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unit</p>
                  <p className="font-bold">{product.stockUnit || 'Nos'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-bold">${product.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Min</p>
                  <p className="font-bold text-red-500">${(product.minPrice || 0).toFixed(2)}</p>
                </div>
                 <div>
                  <p className="text-muted-foreground">Wholesale</p>
                  <p className="font-bold">${(product.wholesalePrice || 0).toFixed(2)}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-muted-foreground">Barcode</p>
                  <p className="font-mono tracking-widest">{product.variants[0].sku}</p>
                </div>
              </div>
              
              <div className="mt-auto grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item-discount">Item Discount</Label>
                  <Input 
                    id="item-discount" 
                    type="number" 
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="discounted-price">Discounted Price</Label>
                  <Input id="discounted-price" readOnly value={discountedPrice.toFixed(2)} />
                </div>
              </div>
            </div>

            {/* Right Column: Numpad */}
            <div className="p-6 bg-muted/30 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold">Select Quantity</h3>
              </div>
              <Input 
                readOnly 
                value={quantity}
                className="h-14 text-3xl font-bold text-right mb-4"
              />
              <div className="grid grid-cols-3 gap-2 flex-1">
                {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((num) => (
                    <Button key={num} variant="outline" type="button" onClick={() => handleNumpadClick(num)} className="h-full text-2xl bg-background">
                        {num}
                    </Button>
                ))}
                <Button variant="outline" type="button" onClick={() => handleNumpadClick('0')} className="h-full text-2xl bg-background">0</Button>
                <Button variant="outline" type="button" onClick={() => handleNumpadClick('.')} className="h-full text-2xl bg-background">.</Button>
                <Button variant="outline" type="button" onClick={handleClear} className="h-full text-2xl bg-destructive/20 text-destructive-foreground hover:bg-destructive/30">C</Button>
              </div>
              <Button onClick={handleAddToCart} disabled={!quantity || parseFloat(quantity) <= 0} className="w-full h-14 text-lg mt-4">
                <Plus className="mr-2 h-5 w-5" /> Add
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
