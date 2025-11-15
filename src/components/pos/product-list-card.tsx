

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
        {showInclusivePrice ? (
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
