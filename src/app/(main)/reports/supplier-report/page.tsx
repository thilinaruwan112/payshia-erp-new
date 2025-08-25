
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SupplierReportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Supplier Report</h1>
        <p className="text-muted-foreground">
          Analyze your purchasing activity by supplier.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Report Under Development</CardTitle>
            <CardDescription>This report is currently being built. Please check back later.</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>View total purchase value per supplier.</li>
                <li>Analyze most frequently purchased items from each supplier.</li>
                <li>Track supplier performance and lead times.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
