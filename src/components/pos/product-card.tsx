
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
  
  const displayPrice = useMemo(() => {
    const basePrice = product.price as number;
    if (!currentLocation) return basePrice;
    
    let inclusivePrice = basePrice;
    
    if (orderType === 'Dine-In' && currentLocation.service_charge_status === 'Enabled') {
        inclusivePrice += basePrice * 0.10; // Add 10% Service Charge
    }
    
    // Always add these taxes if enabled
    if (currentLocation.tdl_status === 'Enabled') {
      inclusivePrice += (basePrice + (orderType === 'Dine-In' ? basePrice * 0.10 : 0)) * 0.01;
    }

    const baseForSscl = basePrice + (orderType === 'Dine-In' ? basePrice * 0.10 : 0);
    if (currentLocation.sscl_status === 'Enabled') {
      inclusivePrice += baseForSscl * 0.025;
    }
    
    const baseForVat = baseForSscl + ((baseForSscl) * 0.01 * (currentLocation.tdl_status === 'Enabled' ? 1: 0)) + ((baseForSscl) * 0.025 * (currentLocation.sscl_status === 'Enabled' ? 1: 0));
    if (currentLocation.vat_status === 'Enabled') {
      inclusivePrice += baseForVat * 0.18;
    }

    return inclusivePrice;
  }, [product.price, currentLocation, orderType]);


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
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
