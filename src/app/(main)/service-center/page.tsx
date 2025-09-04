
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { MoreHorizontal, PlusCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLocation } from '@/components/location-provider';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

// Mock data - in a real app, this would come from an API
const jobs = [
    { id: 'JOB-001', customer: 'John Doe', item: 'Toyota Camry (ABC-1234)', reportedIssue: 'Engine making strange noise', status: 'New', date: '2023-10-26' },
    { id: 'JOB-002', customer: 'Jane Smith', item: 'Apple iPhone 14 Pro (SN: XYZ)', reportedIssue: 'Screen replacement', status: 'In Progress', date: '2023-10-25' },
    { id: 'JOB-003', customer: 'Jim Brown', item: 'Ford Ranger (DEF-9012)', reportedIssue: 'Routine 50,000km service', status: 'Completed', date: '2023-10-24' },
    { id: 'JOB-004', customer: 'Emily White', item: 'Dell XPS 15 Laptop', reportedIssue: 'Battery not charging', status: 'Awaiting Parts', date: '2023-10-23' },
    { id: 'JOB-005', customer: 'Michael Green', item: 'Honda Civic (GHI-3456)', reportedIssue: 'AC not cooling', status: 'In Progress', date: '2023-10-22' },
    { id: 'JOB-006', customer: 'Jessica Black', item: 'Samsung Galaxy S23', reportedIssue: 'Water damage', status: 'Invoiced', date: '2023-10-21' },
    { id: 'JOB-007', customer: 'Chris Blue', item: 'Sony PlayStation 5', reportedIssue: 'Disc drive not reading games', status: 'New', date: '2023-10-20' },
    { id: 'JOB-008', customer: 'Amanda Yellow', item: 'Nissan Rogue (JKL-7890)', reportedIssue: 'Check engine light on', status: 'Completed', date: '2023-10-19' },
    { id: 'JOB-009', customer: 'Kevin Purple', item: 'MacBook Air M2', reportedIssue: 'Keyboard issue', status: 'In Progress', date: '2023-10-18' },
    { id: 'JOB-010', customer: 'Laura Orange', item: 'LG Refrigerator', reportedIssue: 'Not cooling properly', status: 'Awaiting Parts', date: '2023-10-17' },
    { id: 'JOB-011', customer: 'Brian Red', item: 'Toyota Corolla (MNO-1234)', reportedIssue: 'Brake replacement', status: 'Completed', date: '2023-10-16' },
    { id: 'JOB-012', customer: 'Megan Silver', item: 'GoPro Hero 11', reportedIssue: 'Lens scratch repair', status: 'New', date: '2023-10-15' },
];


type JobStatus = 'New' | 'In Progress' | 'Awaiting Parts' | 'Completed' | 'Invoiced';

const getStatusColor = (status: JobStatus) => {
  switch (status) {
    case 'New':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'Awaiting Parts':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'Completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Invoiced':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};


export default function ServiceCenterPage() {
  const { company_id } = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;

  const filteredJobs = jobs.filter(job => 
    job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.item.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and track all customer service jobs.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/service-center/jobs/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Job
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <CardTitle>Current Jobs</CardTitle>
                <CardDescription>
                    A list of all ongoing and recent service jobs.
                </CardDescription>
            </div>
            <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                    placeholder="Search by Job ID, customer, item..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset page on new search
                    }}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Customer / Item</TableHead>
                <TableHead className="hidden md:table-cell">Reported Issue</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-64" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                ))
              ) : paginatedJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono">{job.id}</TableCell>
                  <TableCell>
                    <p className="font-medium">{job.customer}</p>
                    <p className="text-sm text-muted-foreground">{job.item}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                      {job.reportedIssue}
                  </TableCell>
                   <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className={cn(getStatusColor(job.status as JobStatus))}>
                            {job.status}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="sm:hidden">
                        <Badge variant="secondary" className={cn(getStatusColor(job.status as JobStatus))}>
                            {job.status}
                        </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                           <Link href={`/service-center/jobs/${job.id}`}>View/Edit Job</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
                Showing <strong>{paginatedJobs.length}</strong> of <strong>{filteredJobs.length}</strong> jobs
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous Page</span>
                </Button>
                <span className="text-sm">
                    Page {currentPage} of {totalPages}
                </span>
                 <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next Page</span>
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
