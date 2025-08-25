
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BinCardReportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bin Card Report</h1>
        <p className="text-muted-foreground">
          Track the movement of inventory for a specific item.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Report Under Development</CardTitle>
            <CardDescription>This report is currently being built. Please check back later.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Select a product to view its complete transaction history.</li>
                <li>See all stock movements, including sales, purchases, and transfers.</li>
                <li>Trace inventory from receipt to sale.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
