
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LeavePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
        <p className="text-muted-foreground">
          Track and manage employee leave requests.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Leave Tracking</CardTitle>
            <CardDescription>This feature is under development. Coming soon:</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Submit and approve leave requests.</li>
                <li>Track leave balances for all employees.</li>
                <li>Define custom leave types and policies.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
