
'use client';

import React from 'react';
import type { PosProduct } from '@/app/(pos)/pos-system/page';
import Image from 'next/image';
import { useCurrency } from '../currency-provider';
import type { Location } from '@/lib/types';
import { TableRow, TableCell } from '../ui/table';

interface ProductListCardProps {
  product: PosProduct;
  onSelect: (product: PosProduct) => void;
  currentLocation: Location | null;
}

export function ProductListCard({ product, onSelect, currentLocation }: ProductListCardProps) {
  const { currencySymbol } = useCurrency();
  
  const imageUrl = product.imageUrl || 'https://placehold.co/64x64.png';
  const displayPrice = product.price as number;

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
