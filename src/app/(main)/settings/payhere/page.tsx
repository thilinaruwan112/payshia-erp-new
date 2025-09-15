
import { PayhereForm } from '@/components/payhere-form';

export default function PayhereSettingsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">PayHere Settings</h1>
                    <p className="text-muted-foreground">
                        Configure your PayHere payment gateway credentials.
                    </p>
                </div>
            </div>
            <PayhereForm />
        </div>
    );
}
