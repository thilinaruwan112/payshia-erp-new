
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PayrollPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
        <p className="text-muted-foreground">
          Process payroll and manage employee salaries.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Payroll Processing</CardTitle>
            <CardDescription>This feature is under development. Coming soon:</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Automated salary calculation.</li>
                <li>Generate payslips and reports.</li>
                <li>Integration with accounting for seamless journal entries.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
