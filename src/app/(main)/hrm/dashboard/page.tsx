
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  Briefcase,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { users } from '@/lib/data';
import { useMemo } from 'react';

export default function HrmDashboardPage() {
    
  const hrmStats = useMemo(() => {
    const totalEmployees = users.filter(u => u.role !== 'Customer').length;
    const roles = [...new Set(users.filter(u => u.role !== 'Customer').map(u => u.role))];
    const totalRoles = roles.length;
    
    return { totalEmployees, totalRoles };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HRM Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your human resources effectively.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{hrmStats.totalEmployees}</div>
                    <p className="text-xs text-muted-foreground">Total active employees</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{hrmStats.totalRoles}</div>
                    <p className="text-xs text-muted-foreground">Distinct roles in the company</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">On Leave Today</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">2</div>
                    <p className="text-xs text-muted-foreground">Employees on scheduled leave</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">4</div>
                    <p className="text-xs text-muted-foreground">Leave or expense requests</p>
                </CardContent>
            </Card>
      </div>
       <Card>
        <CardHeader>
            <CardTitle>HRM Features</CardTitle>
            <CardDescription>This section is under development. Features coming soon:</CardDescription>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Employee Profiles & Management</li>
                <li>Payroll Processing</li>
                <li>Leave Management & Tracking</li>
                <li>Attendance System</li>
                <li>Performance Reviews</li>
            </ul>
        </CardContent>
       </Card>
    </div>
  );
}
