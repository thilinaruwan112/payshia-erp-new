
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FixedAssetsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fixed Assets</h1>
        <p className="text-muted-foreground">
          Manage your company's long-term assets.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Feature Under Development</CardTitle>
            <CardDescription>This module is currently being built. Coming soon:</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Track and manage company assets like vehicles, machinery, and electronics.</li>
                <li>Automate depreciation calculations (Straight-Line, Double Declining Balance).</li>
                <li>Generate reports on asset value and depreciation.</li>
                <li>Manage asset disposal and write-offs.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
