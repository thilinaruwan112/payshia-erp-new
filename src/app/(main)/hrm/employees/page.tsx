
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmployeesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <p className="text-muted-foreground">
          Manage employee profiles and information.
        </p>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Employee Management</CardTitle>
            <CardDescription>This feature is under development. Coming soon:</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Add, edit, and view employee profiles.</li>
                <li>Manage contact information, job roles, and departments.</li>
                <li>Store and manage employee documents securely.</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
