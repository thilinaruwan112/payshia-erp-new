
'use client';

import React from 'react';
import type { PosProduct } from '@/app/(pos)/pos-system/page';
import { ProductCard } from './product-card';
import type { ActiveOrder, Location } from '@/lib/types';

interface ProductGridProps {
  products: PosProduct[];
  orderType: ActiveOrder['orderType'] | undefined;
  onProductSelect: (product: PosProduct) => void;
  currentLocation: Location | null;
}

export function ProductGrid({ products, orderType, onProductSelect, currentLocation }: ProductGridProps) {
  return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {products.map((product) => (
            <ProductCard
                key={product.variant.id}
                product={product}
                orderType={orderType}
                onSelect={onProductSelect}
                currentLocation={currentLocation}
            />
            ))}
        </div>
  );
}
