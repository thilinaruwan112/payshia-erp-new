
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

interface ProductCardProps {
  product: PosProduct;
  onSelect: (product: PosProduct) => void;
  currentLocation: Location | null;
}

export function ProductCard({ product, onSelect, currentLocation }: ProductCardProps) {
  const { currencySymbol } = useCurrency();
  
  const imageUrl = product.imageUrl || 'https://placehold.co/300x200.png';
  const displayPrice = product.price as number;

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
