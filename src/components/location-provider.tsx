
"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';
import { locations } from '@/lib/data';
import type { Location } from '@/lib/types';

interface LocationContextType {
  currentLocation: Location;
  setCurrentLocation: (location: Location) => void;
  availableLocations: Location[];
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<Location>(locations[1]); // Default to 'Downtown Store'
  const availableLocations = locations;

  const value = useMemo(() => ({
    currentLocation,
    setCurrentLocation,
    availableLocations
  }), [currentLocation, availableLocations]);

  return (
    <LocationContext.Provider value={value}>
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
