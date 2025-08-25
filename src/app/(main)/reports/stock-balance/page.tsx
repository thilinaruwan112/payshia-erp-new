
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StockBalancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock Balance Report</h1>
        <p className="text-muted-foreground">
          View current stock levels for all products.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Report Under Development</CardTitle>
            <CardDescription>This report is currently being built. Please check back later.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>See current stock levels for each product variant.</li>
                <li>Filter by location, category, or supplier.</li>
                <li>Export stock data to CSV.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
