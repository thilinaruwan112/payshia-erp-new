
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SalesSummaryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Summary Report</h1>
        <p className="text-muted-foreground">
          A summary of your sales performance.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Report Under Development</CardTitle>
            <CardDescription>This report is currently being built. Please check back later.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>View sales totals by date range.</li>
                <li>Filter sales by location, channel, and product.</li>
                <li>Analyze trends in revenue and profit margins.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
