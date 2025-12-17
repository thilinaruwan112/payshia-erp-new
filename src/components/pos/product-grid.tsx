
'use client';

import React from 'react';
import type { PosProduct } from '@/app/(pos)/pos-system/page';
import { ProductCard } from './product-card';
import type { Location } from '@/lib/types';

interface ProductGridProps {
  products: PosProduct[];
  onProductSelect: (product: PosProduct) => void;
  currentLocation: Location | null;
  orderType?: 'Dine-In' | 'Take Away' | 'Delivery' | 'Retail';
  showImages: boolean;
}

export function ProductGrid({ products, onProductSelect, currentLocation, orderType, showImages }: ProductGridProps) {
  return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {products.map((product) => (
            <ProductCard
                key={product.variant.id}
                product={product}
                onSelect={onProductSelect}
                currentLocation={currentLocation}
                orderType={orderType}
                showImage={showImages}
            />
            ))}
        </div>
  );
}
