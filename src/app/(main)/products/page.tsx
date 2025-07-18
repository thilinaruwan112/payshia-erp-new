
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
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Star } from 'lucide-react';
import { products, inventory } from '@/lib/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import Link from 'next/link';
import { checkPlanLimit } from '@/lib/plan-limits';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function ProductsPage() {
  const { hasAccess, limit, usage, name } = await checkPlanLimit('products');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your products and view their inventory. You are on the{' '}
            <span className="font-semibold text-primary">{name}</span> plan.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto" disabled={!hasAccess}>
          <Link href="/products/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {!hasAccess && (
        <Alert>
          <Star className="h-4 w-4" />
          <AlertTitle>Upgrade to add more products</AlertTitle>
          <AlertDescription>
            You have reached the limit of {limit} products on the {name} plan.
            <Button asChild variant="link" className="p-0 pl-1 h-auto">
              <Link href="/billing">Upgrade your plan</Link>
            </Button>
            to add more.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            Showing {usage} of {limit} products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Inventory</TableHead>
                <TableHead className="hidden lg:table-cell">Price</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const totalStock = inventory
                  .filter((item) => item.productId === product.id)
                  .reduce((sum, item) => sum + item.stock, 0);

                return (
                  <TableRow key={product.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt={product.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={`https://placehold.co/64x64.png`}
                        width="64"
                        data-ai-hint="product photo"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground lg:hidden">{product.category}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                       <Badge variant={totalStock > 0 ? (totalStock > 20 ? "outline" : "secondary") : "destructive"} className={totalStock > 0 ? (totalStock > 20 ? 'text-accent-foreground border-accent' : '') : ''}>
                        {totalStock > 20 ? 'In Stock' : totalStock > 0 ? 'Low Stock' : 'Out of Stock'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{totalStock} in stock</TableCell>
                    <TableCell className="hidden lg:table-cell">${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
