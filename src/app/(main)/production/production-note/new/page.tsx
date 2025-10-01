

import { ProductionNoteForm } from '@/components/production-note-form';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import Link from 'next/link';

export default function NewProductionNotePage() {
  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Create Production Note
            </h1>
            <p className="text-muted-foreground">
              Record the production of a finished good from its raw materials.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/production/production-note">
              <History className="mr-2 h-4 w-4" />
              See All
            </Link>
          </Button>
        </div>
        <ProductionNoteForm />
    </div>
  );
}
