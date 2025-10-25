
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

interface LocationSelectionDialogProps {
  open: boolean;
  locations: Location[];
  onSelectLocation: (location: Location) => void;
}

const PayshiaPosLogo = () => (
  <div className="flex items-center gap-2">
    <Truck className="h-8 w-8 text-primary transform -scale-x-100" />
    <span className="text-3xl font-bold tracking-tight">
      PAYSHIA <span className="text-primary">POS</span>
    </span>
  </div>
);

export function LocationSelectionDialog({
  open,
  locations,
  onSelectLocation,
}: LocationSelectionDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-3xl p-0 bg-black text-white flex flex-col h-auto max-h-[90vh]" hideCloseButton>
        <DialogHeader className="p-6 border-b border-gray-800 shrink-0">
            <PayshiaPosLogo />
             <DialogDescription className="text-gray-400 pt-2">
                Choose the location you are currently operating from to begin sales.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {locations.map((loc) => (
                <div
                  key={loc.location_id}
                  className="bg-gray-900 p-6 rounded-lg border border-gray-800 hover:border-primary transition-all cursor-pointer flex flex-col text-center items-center gap-4"
                  onClick={() => onSelectLocation(loc)}
                >
                    <div className="p-4 bg-gray-800 rounded-full border border-gray-700">
                        <Building className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-grow">
                        <p className="font-semibold text-lg">{loc.location_name}</p>
                        <p className="text-sm text-gray-400">{loc.city}</p>
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
