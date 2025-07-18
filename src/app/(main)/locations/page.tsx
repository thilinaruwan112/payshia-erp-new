
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
import { MoreHorizontal, PlusCircle, Star } from 'lucide-react';
import { locations } from '@/lib/data';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { checkPlanLimit } from '@/lib/plan-limits';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function LocationsPage() {
  const { hasAccess, limit, usage, name } = await checkPlanLimit('locations');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground">
            Manage your warehouses, stores, and other stock locations. You are on the <span className="font-semibold text-primary">{name}</span> plan.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto" disabled={!hasAccess}>
          <Link href="/locations/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Location
          </Link>
        </Button>
      </div>

       {!hasAccess && (
        <Alert>
          <Star className="h-4 w-4" />
          <AlertTitle>Upgrade to add more locations</AlertTitle>
          <AlertDescription>
            You have reached the limit of {limit} locations on the {name} plan.
            <Button asChild variant="link" className="p-0 pl-1 h-auto">
              <Link href="/billing">Upgrade your plan</Link>
            </Button>
            to add more.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Locations</CardTitle>
          <CardDescription>
            Showing {usage} of {limit} locations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead>Sales Channels</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">
                    {location.name}
                    <div className="block sm:hidden text-muted-foreground text-sm">{location.type}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{location.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {location.salesChannels.map(channel => (
                        <Badge key={channel} variant="secondary">{channel}</Badge>
                      ))}
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete
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
