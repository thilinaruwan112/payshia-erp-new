
import { OpeningStockForm } from '@/components/opening-stock-form';
import React from 'react';

export default function OpeningStockPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Opening Stock</h1>
                    <p className="text-muted-foreground">
                        Set the initial stock levels for your products.
                    </p>
                </div>
            </div>
            <OpeningStockForm />
        </div>
    );
}
