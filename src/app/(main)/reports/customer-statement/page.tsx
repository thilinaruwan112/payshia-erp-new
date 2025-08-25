
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomerStatementPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer Statement</h1>
        <p className="text-muted-foreground">
          Generate a statement of account for a customer.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Report Under Development</CardTitle>
            <CardDescription>This report is currently being built. Please check back later.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Select a customer and date range to generate a statement.</li>
                <li>View all invoices, payments, and returns.</li>
                <li>Calculate and display the outstanding balance.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
