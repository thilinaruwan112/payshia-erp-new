
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PerformancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance</h1>
        <p className="text-muted-foreground">
          Manage employee performance reviews and goals.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Performance Reviews</CardTitle>
            <CardDescription>This feature is under development. Coming soon:</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Set and track employee goals (KPIs).</li>
                <li>Conduct periodic performance reviews.</li>
                <li>Provide feedback and document review history.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
