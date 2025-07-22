
import { LoyaltySchemaForm } from '@/components/loyalty-schema-form';

export default function LoyaltySchemaPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Loyalty Schema</h1>
                    <p className="text-muted-foreground">
                        Define the point thresholds for your customer loyalty tiers.
                    </p>
                </div>
            </div>
            <LoyaltySchemaForm />
        </div>
    );
}
