
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { MoreHorizontal, Search, CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
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
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

// Mock data - in a real app, this would come from an API
const jobs = [
    { id: 'JOB-001', customer: 'John Doe', item: 'Toyota Camry (ABC-1234)', reportedIssue: 'Engine making strange noise', status: 'New', date: '2023-10-26' },
    { id: 'JOB-002', customer: 'Jane Smith', item: 'Apple iPhone 14 Pro (SN: XYZ)', reportedIssue: 'Screen replacement', status: 'In Progress', date: '2023-10-25' },
    { id: 'JOB-003', customer: 'Jim Brown', item: 'Ford Ranger (DEF-9012)', reportedIssue: 'Routine 50,000km service', status: 'Completed', date: '2023-10-24' },
    { id: 'JOB-004', customer: 'Emily White', item: 'Dell XPS 15 Laptop', reportedIssue: 'Battery not charging', status: 'Awaiting Parts', date: '2023-10-23' },
    { id: 'JOB-005', customer: 'Michael Green', item: 'Honda Civic (GHI-3456)', reportedIssue: 'AC not cooling', status: 'In Progress', date: '2023-10-22' },
    { id: 'JOB-006', customer: 'Jessica Black', item: 'Samsung Galaxy S23', reportedIssue: 'Water damage', status: 'Invoiced', date: '2023-10-21' },
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


export default function FindJobPage() {
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);
  const [results, setResults] = React.useState(jobs);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Find Job</h1>
          <p className="text-muted-foreground">
            Use advanced filters to locate a specific service job.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
                <Label htmlFor="job-id">Job ID</Label>
                <Input id="job-id" placeholder="e.g. JOB-001" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input id="customer-name" placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="item-details">Item / Serial No.</Label>
                <Input id="item-details" placeholder="e.g. Toyota Camry, ABC-1234" />
            </div>
            <div className="space-y-2">
                 <Label htmlFor="status">Status</Label>
                 <Select>
                    <SelectTrigger id="status">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="awaiting-parts">Awaiting Parts</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="invoiced">Invoiced</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2 lg:col-span-2">
                <Label>Date Range</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                        date.to ? (
                            <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(date.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date range</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
            </div>
        </CardContent>
        <CardFooter>
            <Button>
                <Search className="mr-2 h-4 w-4" />
                Search
            </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>Found {results.length} jobs matching your criteria.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Customer / Item</TableHead>
                    <TableHead>Reported Issue</TableHead>
                    <TableHead>
                    <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {results.map((job) => (
                    <TableRow key={job.id}>
                    <TableCell className="font-mono">{job.id}</TableCell>
                    <TableCell>
                        <p className="font-medium">{job.customer}</p>
                        <p className="text-sm text-muted-foreground">{job.item}</p>
                    </TableCell>
                    <TableCell>
                        <p>{job.reportedIssue}</p>
                        <div className="mt-1">
                            <Badge variant="secondary" className={cn(getStatusColor(job.status as JobStatus))}>
                                {job.status}
                            </Badge>
                        </div>
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
      </Card>
    </div>
  );
}
