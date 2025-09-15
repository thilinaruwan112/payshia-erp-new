
import { AnalyticsForm } from '@/components/analytics-form';

export default function AnalyticsSettingsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics & Tracking</h1>
                    <p className="text-muted-foreground">
                        Configure your marketing and analytics platform integrations.
                    </p>
                </div>
            </div>
            <AnalyticsForm />
        </div>
    );
}
