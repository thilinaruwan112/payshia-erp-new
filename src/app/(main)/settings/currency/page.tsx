
import { CurrencyForm } from '@/components/currency-form';

export default function CurrencySettingsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Currency Settings</h1>
                    <p className="text-muted-foreground">
                        Manage the default currency for the application.
                    </p>
                </div>
            </div>
            <CurrencyForm />
        </div>
    );
}
