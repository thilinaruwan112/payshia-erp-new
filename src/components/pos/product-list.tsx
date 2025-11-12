
'use client';

import React from 'react';
import type { PosProduct } from '@/app/(pos)/pos-system/page';
import { ProductListCard } from './product-list-card';
import type { Location } from '@/lib/types';
import { Table, TableBody, TableHeader, TableRow, TableHead } from '../ui/table';

interface ProductListProps {
  products: PosProduct[];
  onProductSelect: (product: PosProduct) => void;
  currentLocation: Location | null;
}

export function ProductList({ products, onProductSelect, currentLocation }: ProductListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Image</TableHead>
          <TableHead>Product Details</TableHead>
          <TableHead className="text-right">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <ProductListCard
            key={product.variant.id}
            product={product}
            onSelect={onProductSelect}
            currentLocation={currentLocation}
          />
        ))}
      </TableBody>
    </Table>
  );
}
