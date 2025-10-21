
'use client';

import { StockAdjustmentForm } from '@/components/stock-adjustment-form';

export default function StockAdjustmentPage() {
    return (
        <div className="flex flex-col gap-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Adjustment</h1>
                    <p className="text-muted-foreground">
                        Manually adjust stock levels for reasons like damages or corrections.
                    </p>
                </div>
            </div>
            <StockAdjustmentForm />
        </div>
    );
}
