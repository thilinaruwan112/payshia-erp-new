
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building } from 'lucide-react';

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
      <DialogContent className="sm:max-w-2xl" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-2xl">Select Your Location</DialogTitle>
          <DialogDescription>
            Choose the location you are currently operating from to begin. This can be changed later.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ScrollArea className="h-96">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
              {locations.map((loc) => (
                <Card
                  key={loc.location_id}
                  className="hover:border-primary hover:shadow-lg transition-all cursor-pointer flex flex-col"
                  onClick={() => onSelectLocation(loc)}
                >
                  <CardHeader className="flex-grow">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-primary/10 rounded-full">
                         <Building className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-center">{loc.location_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground text-center">
                    <p>{loc.address_line1}</p>
                    <p className="font-medium">{loc.city}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
