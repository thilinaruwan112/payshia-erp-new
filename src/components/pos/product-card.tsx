
'use client';

import React from 'react';
import type { PosProduct } from '@/app/(pos)/pos-system/page';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Image from 'next/image';
import { useCurrency } from '../currency-provider';
import type { Location } from '@/lib/types';
import { useMemo } from 'react';

interface ProductCardProps {
  product: PosProduct;
  onSelect: (product: PosProduct) => void;
  currentLocation: Location | null;
  orderType?: 'Dine-In' | 'Take Away' | 'Delivery' | 'Retail';
}

export function ProductCard({ product, onSelect, currentLocation, orderType }: ProductCardProps) {
  const { currencySymbol } = useCurrency();
  
  const imageUrl = product.imageUrl || 'https://placehold.co/300x200.png';
  
  const basePrice = product.price as number;

  const displayPrice = useMemo(() => {
    if (!currentLocation) return basePrice;
    
    let inclusivePrice = basePrice;
    let serviceCharge = 0;
    
    // Service charge is only for Dine-In
    if (orderType === 'Dine-In' && currentLocation.service_charge_status === 'Enabled') {
        serviceCharge = basePrice * 0.10;
    }
    
    const baseForOtherTaxes = basePrice + serviceCharge;

    if (currentLocation.tdl_status === 'Enabled') {
      inclusivePrice += baseForOtherTaxes * 0.01;
    }
    
    if (currentLocation.sscl_status === 'Enabled') {
      inclusivePrice += baseForOtherTaxes * 0.025;
    }
    
    // VAT on the price after other taxes
    const baseForVat = inclusivePrice; 
    if (currentLocation.vat_status === 'Enabled') {
      inclusivePrice += baseForVat * 0.18;
    }
    
    // Add service charge at the very end to the final price
    inclusivePrice += serviceCharge;
    
    return inclusivePrice;
  }, [basePrice, currentLocation, orderType]);

  const showBothPrices = displayPrice.toFixed(2) !== basePrice.toFixed(2);


  return (
    <Card
      className="overflow-hidden cursor-pointer hover:border-primary transition-colors group flex flex-col"
      onClick={() => onSelect(product)}
    >
      <CardContent className="p-0 flex flex-col flex-grow">
        <Image
          src={imageUrl}
          alt={product.name}
          width={300}
          height={200}
          className="w-full h-32 object-cover"
          data-ai-hint="product photo"
        />
        <div className='p-3 flex flex-col flex-grow'>
            <h3 className="font-semibold text-base truncate group-hover:text-primary leading-tight">{product.variantName}</h3>
            <p className="text-sm text-muted-foreground flex-grow">{product.category}</p>
            <div className="mt-2">
               {showBothPrices ? (
                  <>
                    <p className="text-xs text-muted-foreground">Base: {currencySymbol}{basePrice.toFixed(2)}</p>
                    <p className="font-bold text-lg">{currencySymbol}{displayPrice.toFixed(2)}</p>
                  </>
                ) : (
                  <p className="font-bold text-lg">{currencySymbol}{basePrice.toFixed(2)}</p>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
