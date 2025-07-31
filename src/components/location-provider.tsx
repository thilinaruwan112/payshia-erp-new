
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { Location } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';

interface LocationContextType {
  currentLocation: Location | null;
  setCurrentLocation: (location: Location) => void;
  availableLocations: Location[];
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const pathname = usePathname();
  const isPos = pathname.startsWith('/pos-system');

  useEffect(() => {
    async function fetchLocations() {
      setIsLoading(true);
      try {
        const response = await fetch('https://server-erp.payshia.com/locations');
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        let data: Location[] = await response.json();
        setAvailableLocations(data);

        if (data.length > 0) {
          let defaultLocation;
          if (isPos) {
            // For POS, find the first location with POS enabled
            defaultLocation = data.find(l => l.pos_status === "1");
          } else {
            // For main app, use Downtown Store or first available
            defaultLocation = data.find(l => l.location_name === 'Downtown Store') || data[0];
          }
          setCurrentLocation(defaultLocation || null);
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load locations',
          description: 'Could not fetch business locations from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchLocations();
  }, [toast, isPos]);


  const value = useMemo(() => ({
    currentLocation,
    setCurrentLocation,
    availableLocations,
    isLoading
  }), [currentLocation, availableLocations, isLoading]);

  return (
    <LocationContext.Provider value={value as LocationContextType}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
