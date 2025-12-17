
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
import { ImageIcon } from 'lucide-react';

interface ProductCardProps {
  product: PosProduct;
  onSelect: (product: PosProduct) => void;
  currentLocation: Location | null;
  orderType?: 'Dine-In' | 'Take Away' | 'Delivery' | 'Retail';
  showImage: boolean;
}

export function ProductCard({ product, onSelect, currentLocation, orderType, showImage }: ProductCardProps) {
  const { currencySymbol } = useCurrency();
  
  const imageUrl = product.imageUrl || 'https://placehold.co/300x200.png';
  
  const basePrice = product.price as number;

  const displayPrice = useMemo(() => {
    if (!currentLocation || !orderType) return basePrice;
    
    let baseForTaxes = basePrice;

    // Service charge is only for Dine-In
    if (orderType === 'Dine-In' && currentLocation.service_charge_status === 'Enabled') {
        baseForTaxes += basePrice * 0.10;
    }
    
    let tdl = 0;
    if (currentLocation.tdl_status === 'Enabled') {
      tdl = baseForTaxes * 0.01;
    }

    let sscl = 0;
    if (currentLocation.sscl_status === 'Enabled') {
      sscl = (baseForTaxes + tdl) * 0.025;
    }
    
    const baseForVat = baseForTaxes + tdl + sscl;
    let vat = 0;
    if (currentLocation.vat_status === 'Enabled') {
      vat = baseForVat * 0.18;
    }
    
    return baseForTaxes + tdl + sscl + vat;
  }, [basePrice, currentLocation, orderType]);

  const showInclusivePrice = orderType && displayPrice.toFixed(2) !== basePrice.toFixed(2);


  return (
    <Card
      className="overflow-hidden cursor-pointer hover:border-primary transition-colors group flex flex-col"
      onClick={() => onSelect(product)}
    >
      <CardContent className="p-0 flex flex-col flex-grow">
        {showImage ? (
            <Image
                src={imageUrl}
                alt={product.name}
                width={300}
                height={200}
                className="w-full h-32 object-cover"
                data-ai-hint="product photo"
            />
        ) : (
             <div className="w-full h-32 bg-muted flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            </div>
        )}
        <div className='p-3 flex flex-col flex-grow'>
            <h3 className="font-semibold text-base truncate group-hover:text-primary leading-tight">{product.variantName}</h3>
            <p className="text-sm text-muted-foreground flex-grow">{product.category}</p>
            <div className="mt-2">
               {showInclusivePrice ? (
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
