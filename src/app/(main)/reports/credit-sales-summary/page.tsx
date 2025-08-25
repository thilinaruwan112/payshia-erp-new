
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreditSalesSummaryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Credit Sales Summary</h1>
        <p className="text-muted-foreground">
          Review all sales made on credit.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Report Under Development</CardTitle>
            <CardDescription>This report is currently being built. Please check back later.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>List all unpaid or partially paid invoices.</li>
                <li>See aging of receivables (e.g., 30, 60, 90+ days).</li>
                <li>Filter by customer to see total credit exposure.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
