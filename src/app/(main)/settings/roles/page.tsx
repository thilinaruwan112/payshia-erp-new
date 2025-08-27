
import { RoleManagement } from '@/components/settings/role-management';

export default function RolesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Define user roles and manage what they can see and do in the system.
          </p>
        </div>
      </div>
      <RoleManagement />
    </div>
  );
}
