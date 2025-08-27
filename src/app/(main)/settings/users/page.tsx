
import { UserManagement } from '@/components/settings/user-management';

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Invite and manage users for your company.
          </p>
        </div>
      </div>
      <UserManagement />
    </div>
  );
}
