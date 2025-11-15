
'use client';

import React from 'react';
import type { PosProduct } from '@/app/(pos)/pos-system/page';
import Image from 'next/image';
import { useCurrency } from '../currency-provider';
import type { Location } from '@/lib/types';
import { TableRow, TableCell } from '../ui/table';
import { useMemo } from 'react';

interface ProductListCardProps {
  product: PosProduct;
  onSelect: (product: PosProduct) => void;
  currentLocation: Location | null;
  orderType?: 'Dine-In' | 'Take Away' | 'Delivery' | 'Retail';
}

export function ProductListCard({ product, onSelect, currentLocation, orderType }: ProductListCardProps) {
  const { currencySymbol } = useCurrency();
  
  const imageUrl = product.imageUrl || 'https://placehold.co/64x64.png';
  
  const basePrice = product.price as number;

  const displayPrice = useMemo(() => {
    if (!currentLocation) return basePrice;

    let inclusivePrice = basePrice;
    let serviceCharge = 0;
    
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
    
    const baseForVat = inclusivePrice;
    if (currentLocation.vat_status === 'Enabled') {
      inclusivePrice += baseForVat * 0.18;
    }
    
    inclusivePrice += serviceCharge;
    
    return inclusivePrice;
  }, [basePrice, currentLocation, orderType]);

  const showBothPrices = displayPrice.toFixed(2) !== basePrice.toFixed(2);


  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => onSelect(product)}
    >
      <TableCell>
        <Image
          src={imageUrl}
          alt={product.name}
          width={64}
          height={64}
          className="w-16 h-16 object-cover rounded-md border"
          data-ai-hint="product photo"
        />
      </TableCell>
      <TableCell>
        <p className="font-semibold">{product.variantName}</p>
        <p className="text-sm text-muted-foreground">{product.category}</p>
      </TableCell>
      <TableCell className="text-right">
        {showBothPrices ? (
          <>
            <p className="text-xs text-muted-foreground">Base: {currencySymbol}{basePrice.toFixed(2)}</p>
            <p className="font-bold text-base">{currencySymbol}{displayPrice.toFixed(2)}</p>
          </>
        ) : (
          <p className="font-bold text-base">{currencySymbol}{basePrice.toFixed(2)}</p>
        )}
      </TableCell>
    </TableRow>
  );
}
