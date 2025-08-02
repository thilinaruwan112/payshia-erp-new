
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AttendancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          Monitor employee attendance and work hours.
        </p>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>Attendance System</CardTitle>
            <CardDescription>This feature is under development. Coming soon:</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Log check-in and check-out times.</li>
                <li>Generate attendance reports.</li>
                <li>Integration with biometric systems (future).</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
