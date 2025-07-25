
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { Location } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    async function fetchLocations() {
      setIsLoading(true);
      try {
        const response = await fetch('https://server-erp.payshia.com/locations');
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        const data: Location[] = await response.json();
        setAvailableLocations(data);
        if (data.length > 0) {
          // Find a default store, otherwise take the first one
          const defaultLocation = data.find(l => l.location_name === 'Downtown Store') || data[0];
          setCurrentLocation(defaultLocation);
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
  }, [toast]);


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
