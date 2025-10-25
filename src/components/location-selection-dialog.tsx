
'use client';

import React from 'react';
import type { Location } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building, Truck } from 'lucide-react';
import { PayshiaPosLogo } from './pos/payshia-pos-logo';

interface LocationSelectionDialogProps {
  open: boolean;
  locations: Location[];
  onSelectLocation: (location: Location) => void;
}

export function LocationSelectionDialog({
  open,
  locations,
  onSelectLocation,
}: LocationSelectionDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-3xl p-0 flex flex-col h-auto max-h-[100vh]" hideCloseButton>
        <DialogHeader className="p-6 border-b shrink-0">
            <PayshiaPosLogo />
             <DialogDescription className="text-muted-foreground pt-2">
                Choose the location you are currently operating from to begin sales.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {locations.map((loc) => (
                <div
                  key={loc.location_id}
                  className="bg-card p-6 rounded-lg border hover:border-primary transition-all cursor-pointer flex flex-col text-center items-center gap-4"
                  onClick={() => onSelectLocation(loc)}
                >
                    <div className="p-4 bg-muted rounded-full border">
                        <Building className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-grow">
                        <p className="font-semibold text-lg">{loc.location_name}</p>
                        <p className="text-sm text-muted-foreground">{loc.city}</p>
                    </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
