
'use client';

import React from 'react';
import type { PosProduct } from '@/app/(pos)/pos-system/page';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Image from 'next/image';
import { useCurrency } from '../currency-provider';
import type { ActiveOrder, Location } from '@/lib/types';

interface ProductCardProps {
  product: PosProduct;
  orderType: ActiveOrder['orderType'] | undefined;
  onSelect: (product: PosProduct) => void;
  currentLocation: Location | null;
  showInclusivePriceOnly?: boolean;
}

export function ProductCard({ product, orderType, onSelect, currentLocation, showInclusivePriceOnly = false }: ProductCardProps) {
  const { currencySymbol } = useCurrency();
  
  const imageUrl = product.imageUrl || 'https://placehold.co/300x200.png';

  const calculateInclusivePrice = (basePrice: number) => {
    if (!currentLocation) return basePrice;

    let serviceCharge = 0;
    if (orderType === 'Dine-In' && currentLocation.service_charge_status === 'Enabled') {
        serviceCharge = basePrice * 0.10;
    }
    
    let tdl = 0;
    if (currentLocation.tdl_status === 'Enabled') {
      tdl = (basePrice + serviceCharge) * 0.01;
    }

    const baseForSscl = basePrice + serviceCharge;
    let sscl = 0;
    if (currentLocation.sscl_status === 'Enabled') {
      sscl = baseForSscl * 0.025;
    }
    
    const baseForVat = baseForSscl + tdl + sscl;
    let vat = 0;
    if (currentLocation.vat_status === 'Enabled') {
      vat = baseForVat * 0.18;
    }

    return basePrice + serviceCharge + tdl + sscl + vat;
  }

  const showInclusivePriceOnPos = orderType === 'Dine-In' || orderType === 'Take Away';
  const inclusivePrice = calculateInclusivePrice(product.price as number);
  const displayPrice = showInclusivePriceOnly ? inclusivePrice : (product.price as number);

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:border-primary transition-colors group"
      onClick={() => onSelect(product)}
    >
      <CardContent className="p-0">
        <Image
          src={imageUrl}
          alt={product.name}
          width={300}
          height={200}
          className="w-full h-32 object-cover"
          data-ai-hint="product photo"
        />
        <div className='p-4'>
            <h3 className="font-semibold text-base truncate group-hover:text-primary leading-tight">{product.variantName}</h3>
            <p className="text-sm text-muted-foreground">{product.category}</p>
            <div className="mt-2">
                <p className="font-bold text-xl">{currencySymbol}{displayPrice.toFixed(2)}</p>
                {!showInclusivePriceOnly && showInclusivePriceOnPos && (
                    <p className="text-xs text-muted-foreground font-semibold">
                        (Incl. Tax: {currencySymbol}{inclusivePrice.toFixed(2)})
                    </p>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
