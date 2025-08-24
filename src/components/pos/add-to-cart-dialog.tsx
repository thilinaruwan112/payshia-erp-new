

'use client';

import React, { useState, useEffect } from 'react';
import type { PosProduct, StockInfo } from '@/app/(pos)/pos-system/page';
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
import { Plus, X, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useLocation } from '../location-provider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AddToCartDialogProps {
  product: PosProduct | null;
  onClose: () => void;
  onAddToCart: (product: PosProduct, quantity: number, discount: number, batch: StockInfo) => void;
}

export function AddToCartDialog({
  product,
  onClose,
  onAddToCart,
}: AddToCartDialogProps) {
  const [quantity, setQuantity] = useState('1');
  const [discount, setDiscount] = useState('0');
  const [stockInfo, setStockInfo] = useState<{ totalStock: number, batches: StockInfo[] } | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const { currentLocation, company_id } = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchStock() {
      if (product && currentLocation && company_id) {
        setIsLoadingStock(true);
        setStockInfo(null);
        setSelectedBatch("");
        try {
          const response = await fetch(`https://server-erp.payshia.com/stock-entries/summary?company_id=${company_id}&product_id=${product.id}&product_variant_id=${product.variant.id}&location_id=${currentLocation.location_id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch stock data.');
          }
          const data = await response.json();
          const totalStock = data.total_stock[0]?.stock_balance ? parseFloat(data.total_stock[0].stock_balance) : 0;
          const availableBatches = data.grouped_by_expire_date.filter((b: StockInfo) => parseFloat(b.stock_balance) > 0);
          
          setStockInfo({ totalStock, batches: availableBatches });
          
          // Set default batch to the one expiring soonest
          if (availableBatches.length > 0) {
            setSelectedBatch(JSON.stringify(availableBatches[0]));
          }

        } catch (error) {
            toast({
              variant: "destructive",
              title: "Error fetching stock",
              description: "Could not retrieve live stock information for this product."
            })
        } finally {
          setIsLoadingStock(false);
        }
      }
    }

    if (product) {
      setQuantity('1');
      setDiscount('0');
      fetchStock();
    }
  }, [product, currentLocation, company_id, toast]);

  const handleAddToCart = () => {
    if (product && selectedBatch) {
      const numQuantity = parseFloat(quantity);
      const numDiscount = parseFloat(discount);
      const batchData = JSON.parse(selectedBatch) as StockInfo;

      if (numQuantity > parseFloat(batchData.stock_balance)) {
          toast({
              variant: 'destructive',
              title: 'Insufficient Stock',
              description: `Only ${batchData.stock_balance} units available in this batch.`
          });
          return;
      }

      if (numQuantity > 0) {
        onAddToCart(product, numQuantity, numDiscount, batchData);
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
  const discountedPrice = product ? (product.price as number) - parseFloat(discount) : 0;
  const currentBatchStock = selectedBatch ? JSON.parse(selectedBatch).stock_balance : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0">
        {product && (
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left Column: Product Info */}
            <div className="p-6 flex flex-col">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl">{product.variantName}</DialogTitle>
                <p className="text-sm text-muted-foreground">{product.variant.sku || 'No SKU'}</p>
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
              
               <div className="grid grid-cols-2 gap-4 mb-4">
                  <FormField
                      label="Available Stock"
                      value={isLoadingStock ? <Loader2 className="h-4 w-4 animate-spin"/> : `${stockInfo?.totalStock || 0} ${product.stock_unit || 'Nos'}`}
                  />
                  <div className="space-y-1">
                    <Label>Batch / Expiry</Label>
                     <Select onValueChange={setSelectedBatch} value={selectedBatch} disabled={isLoadingStock || !stockInfo?.batches.length}>
                        <SelectTrigger>
                            <SelectValue placeholder={isLoadingStock ? "Loading..." : "Select batch"} />
                        </SelectTrigger>
                        <SelectContent>
                            {stockInfo?.batches.map(batch => (
                                <SelectItem key={`${batch.patch_code}-${batch.expire_date}`} value={JSON.stringify(batch)}>
                                    EXP: {format(new Date(batch.expire_date), 'dd/MM/yy')} (Qty: {batch.stock_balance})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                 <p className="text-sm text-muted-foreground">In batch: <span className="font-bold text-foreground">{currentBatchStock}</span></p>
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
              <Button onClick={handleAddToCart} disabled={!quantity || parseFloat(quantity) <= 0 || !selectedBatch} className="w-full h-14 text-lg mt-4">
                <Plus className="mr-2 h-5 w-5" /> Add
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const FormField = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-bold text-base">{value}</p>
    </div>
);
