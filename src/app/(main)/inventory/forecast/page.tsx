import { ForecastingForm } from '@/components/forecasting-form';

export default function InventoryForecastPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Inventory Forecasting</h1>
          <p className="text-muted-foreground">
            Predict future stock needs and optimize inventory levels.
          </p>
        </div>
      </div>
      <ForecastingForm />
    </div>
  );
}
