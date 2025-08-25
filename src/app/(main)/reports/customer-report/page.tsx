
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomerReportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer Report</h1>
        <p className="text-muted-foreground">
          Detailed insights into your customer base.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Report Under Development</CardTitle>
            <CardDescription>This report is currently being built. Please check back later.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Analyze customer demographics and purchase history.</li>
                <li>Identify your most valuable customers (by spend or frequency).</li>
                <li>Segment customers for targeted marketing campaigns.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
