import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesChart } from '@/components/sales-chart';
import { StockChart } from '@/components/stock-chart';

export default function ReportsPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Sales Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Monthly sales performance.</p>
          <SalesChart />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Inventory Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Stock levels by product.</p>
          <StockChart />
        </CardContent>
      </Card>
    </div>
  );
}
