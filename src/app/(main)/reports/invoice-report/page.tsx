
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function InvoiceReportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoice Report</h1>
        <p className="text-muted-foreground">
          A detailed breakdown of all invoices.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Report Under Development</CardTitle>
            <CardDescription>This report is currently being built. Please check back later.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>View a list of all invoices within a date range.</li>
                <li>Filter by status (Draft, Sent, Paid, Overdue).</li>
                <li>Export invoice data for analysis.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
