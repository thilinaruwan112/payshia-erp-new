
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
  
  const displayPrice = useMemo(() => {
    const basePrice = product.price as number;
    if (!currentLocation) return basePrice;

    let inclusivePrice = basePrice;
    
    if (orderType === 'Dine-In' && currentLocation.service_charge_status === 'Enabled') {
        inclusivePrice += basePrice * 0.10; // Add 10% Service Charge
    }
    
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
      <TableCell className="text-right font-mono font-bold text-base">
        {currencySymbol}{displayPrice.toFixed(2)}
      </TableCell>
    </TableRow>
  );
}
