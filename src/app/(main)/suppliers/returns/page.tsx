
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Undo2 } from 'lucide-react';

export default function SupplierReturnsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Returns</h1>
          <p className="text-muted-foreground">
            Manage returns of goods to your suppliers.
          </p>
        </div>
      </div>

      <Card className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
        <CardHeader>
          <Undo2 className="h-12 w-12 mx-auto text-muted-foreground" />
          <CardTitle className="mt-4">Supplier Returns</CardTitle>
          <CardDescription>
            This feature is under construction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You will soon be able to create and manage supplier returns from this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
