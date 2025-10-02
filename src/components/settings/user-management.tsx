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
import Link from 'next/link';

interface CompanyUser {
  id: string;
  company_id: string;
  user_id: string;
}

function AddNewUserDialog({ onAdd }: { onAdd: (email: string, role: string, status: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [status, setStatus] = useState('2'); // Default to 'User'
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    setIsSubmitting(true);
    await onAdd(email, role, status);
    setIsSubmitting(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Assign User to Company
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new user</DialogTitle>
          <DialogDescription>
            Enter the user's email and assign their initial role and status.
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
             <div className="space-y-2">
                <Label htmlFor="status">User Status</Label>
                 <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                        <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Admin</SelectItem>
                        <SelectItem value="2">User</SelectItem>
                        <SelectItem value="3">Steward</SelectItem>
                        <SelectItem value="4">Supplier</SelectItem>
                        <SelectItem value="5">Customer</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!email || isSubmitting}>
             {isSubmitting ? 'Adding...' : 'Add User'}
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

  const fetchCompanyUsers = async () => {
    if (!company_id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [companyUsersRes, allUsersRes] = await Promise.all([
        fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/company-users`),
        fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`),
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
  };

  useEffect(() => {
    fetchCompanyUsers();
  }, [toast, company_id]);
  
  const handleAddNewUser = async (email: string, role: string, status: string) => {
    if (!company_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Company ID is not available.' });
      return;
    }
    
    let userId;

    try {
      // 1. Check if user exists by email
      const checkResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/check-email`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      const checkResult = await checkResponse.json();
      
      if (checkResponse.ok && checkResult.user) {
        userId = checkResult.user.id;
      } else {
        // 2. If not, create a new user with minimal info
        const createUserPayload = {
          email: email,
          user_name: email,
          pass: `default-${Date.now()}`, // Temporary password
          acc_type: role,
          user_status: 'Active',
          first_name: email.split('@')[0], // Default first name
        };
        const createUserResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, {
          method: 'POST',
          body: JSON.stringify(createUserPayload),
        });
        const createResult = await createUserResponse.json();
        if (!createUserResponse.ok || createResult.status !== 'success') {
          throw new Error(createResult.message || 'Failed to create a new user.');
        }
        userId = createResult.data.id;
      }

      if (!userId) {
          throw new Error("Could not retrieve user ID.");
      }

      // 3. Assign the user to the company
      const assignPayload = {
        user_id: userId,
        company_id: company_id,
        role: role,
        status: status,
        created_by: 'admin',
        updated_by: 'admin',
      };
      const assignResponse = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/company-users/assign`, {
        method: 'POST',
        body: JSON.stringify(assignPayload),
      });

      if (!assignResponse.ok) {
        const errorData = await assignResponse.json();
        throw new Error(errorData.message || 'Failed to assign user to the company.');
      }

      toast({
        title: 'User Added Successfully',
        description: `${email} has been added to your company.`,
      });
      
      fetchCompanyUsers(); // Refresh the user list

    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
       toast({
        variant: "destructive",
        title: "Failed to Add User",
        description: errorMessage,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                 <CardTitle>All Users</CardTitle>
                <CardDescription>A list of all users in your company.</CardDescription>
            </div>
             <AddNewUserDialog onAdd={handleAddNewUser} />
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
