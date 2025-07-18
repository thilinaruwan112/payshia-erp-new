
'use client';

import React from 'react';
import type { Product } from '@/lib/types';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Image from 'next/image';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <Card
      className="overflow-hidden cursor-pointer hover:border-primary transition-colors group"
      onClick={() => onSelect(product)}
    >
      <CardContent className="p-0">
        <Image
          src={`https://placehold.co/300x200.png`}
          alt={product.name}
          width={300}
          height={200}
          className="w-full h-32 object-cover"
          data-ai-hint="product photo"
        />
        <div className='p-4'>
            <h3 className="font-semibold text-lg truncate group-hover:text-primary">{product.name}</h3>
            <p className="text-sm text-muted-foreground">{product.category}</p>
            <p className="font-bold text-xl mt-2">${product.price.toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
