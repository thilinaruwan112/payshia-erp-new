
'use client';

import React from 'react';
import type { PosProduct } from '@/app/(pos)/pos-system/page';
import { ProductCard } from './product-card';
import { ScrollArea } from '../ui/scroll-area';

interface ProductGridProps {
  products: PosProduct[];
  onProductSelect: (product: PosProduct) => void;
}

export function ProductGrid({ products, onProductSelect }: ProductGridProps) {
  return (
    <ScrollArea className="h-full">
        {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                <ProductCard
                    key={product.variant.id}
                    product={product}
                    onSelect={onProductSelect}
                />
                ))}
            </div>
        ) : (
            <div className='flex items-center justify-center h-full min-h-[400px] text-muted-foreground'>
                <p>No products found.</p>
            </div>
        )}
    </ScrollArea>
  );
}
