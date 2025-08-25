
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SupplierBalancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supplier Balance Report</h1>
        <p className="text-muted-foreground">
          View outstanding balances for all your suppliers.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Report Under Development</CardTitle>
            <CardDescription>This report is currently being built. Please check back later.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>List all suppliers with a non-zero balance.</li>
                <li>See total amount owed (Accounts Payable).</li>
                <li>Drill down to see individual purchase orders and payments.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
