
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Trash2, Send } from 'lucide-react';
import type { User } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from '../location-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { fetcher } from '@/lib/api';

interface CompanyUser {
  id: string;
  company_id: string;
  user_id: string;
}

function InviteUserDialog({ onInvite }: { onInvite: (email: string, role: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvite = async () => {
    setIsSubmitting(true);
    await onInvite(email, role);
    setIsSubmitting(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a new user</DialogTitle>
          <DialogDescription>
            Enter the user's email and select a role. They will receive an email to join your company.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                 <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="agent">Sales Agent</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleInvite} disabled={!email || isSubmitting}>
             {isSubmitting ? 'Sending...' : 'Send Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { company_id } = useLocation();

  useEffect(() => {
    async function fetchCompanyUsers() {
      if (!company_id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [companyUsersRes, allUsersRes] = await Promise.all([
          fetcher('https://server-erp.payshia.com/company-users'),
          fetcher('https://server-erp.payshia.com/users'),
        ]);

        if (!companyUsersRes.ok) throw new Error('Failed to fetch company user links');
        if (!allUsersRes.ok) throw new Error('Failed to fetch all users');

        const companyUsersData = await companyUsersRes.json();
        const allUsersData = await allUsersRes.json();
        
        if (companyUsersData.status !== 'success' || allUsersData.status !== 'success') {
          throw new Error('API returned an error status');
        }

        const companyUserLinks: CompanyUser[] = companyUsersData.data || [];
        const allUsers: User[] = allUsersData.data || [];

        const userIdsForCompany = companyUserLinks
          .filter(link => link.company_id === String(company_id))
          .map(link => link.user_id);
          
        const usersInCompany = allUsers.filter(user => userIdsForCompany.includes(user.id));
        
        setUsers(usersInCompany);

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load users',
          description: error instanceof Error ? error.message : 'Could not fetch users from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompanyUsers();
  }, [toast, company_id]);
  
  const handleInvite = async (email: string, role: string) => {
    toast({
        title: 'Invitation Sent (Simulated)',
        description: `An invitation has been sent to ${email} for the ${role} role.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <CardTitle>All Users</CardTitle>
                <CardDescription>A list of all users in your company.</CardDescription>
            </div>
            <InviteUserDialog onInvite={handleInvite} />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.first_name?.charAt(0) || 'U'}{user.last_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-muted-foreground">{user.user_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{user.acc_type}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                     <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                     </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit Role</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
