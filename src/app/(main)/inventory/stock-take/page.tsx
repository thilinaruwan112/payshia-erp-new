
'use client';

import { StockTakeForm } from '@/components/stock-take-form';

export default function StockTakePage() {
    return (
        <div className="flex flex-col gap-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Take</h1>
                    <p className="text-muted-foreground">
                        Conduct full or partial inventory counts to ensure stock accuracy.
                    </p>
                </div>
            </div>
            <StockTakeForm />
        </div>
    );
}
