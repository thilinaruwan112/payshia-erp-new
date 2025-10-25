
"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { Location } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
import { LocationSelectionDialog } from './location-selection-dialog';
import { fetcher } from '@/lib/api';

interface LocationContextType {
  currentLocation: Location | null;
  setCurrentLocation: (location: Location) => void;
  availableLocations: Location[];
  isLoading: boolean;
  company_id: number | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [company_id, setCompanyId] = useState<number | null>(null);
  const { toast } = useToast();
  const pathname = usePathname();
  const isPos = pathname.startsWith('/pos-system');

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('companyId');
    if (storedCompanyId) {
      setCompanyId(parseInt(storedCompanyId, 10));
    } else {
        setIsLoading(false); // No company ID, so no locations to fetch
    }
  }, []);

  useEffect(() => {
    const storedLocation = sessionStorage.getItem('currentLocation');
    if (storedLocation) {
        try {
            setCurrentLocation(JSON.parse(storedLocation));
        } catch (e) {
            console.error("Failed to parse stored location", e);
        }
    }
  }, [])

  useEffect(() => {
    async function fetchLocations() {
      if (!company_id) {
          setIsLoading(false);
          return;
      };
      
      setIsLoading(true);
      try {
        const response = await fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/locations/company?company_id=${company_id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        let data: Location[] = await response.json();
        
        const companyLocations = data.filter(loc => String(loc.company_id) === String(company_id));

        setAvailableLocations(companyLocations);

        const storedLocation = sessionStorage.getItem('currentLocation');
        if (storedLocation) {
            const parsedLocation: Location = JSON.parse(storedLocation);
             if (companyLocations.some(l => l.location_id === parsedLocation.location_id)) {
                setCurrentLocation(parsedLocation);
            } else {
                sessionStorage.removeItem('currentLocation');
                setCurrentLocation(null);
            }
        } else if (companyLocations.length === 1) {
            // If only one location, set it automatically
            handleSetCurrentLocation(companyLocations[0]);
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
  }, [toast, company_id]);

  const handleSetCurrentLocation = (location: Location) => {
    setCurrentLocation(location);
    sessionStorage.setItem('currentLocation', JSON.stringify(location));
  };


  const value = useMemo(() => ({
    currentLocation,
    setCurrentLocation: handleSetCurrentLocation,
    availableLocations,
    isLoading,
    company_id
  }), [currentLocation, availableLocations, isLoading, company_id]);

  const posEnabledLocations = availableLocations.filter(loc => loc.pos_status === "1");
  const shouldShowDialog = !isLoading && availableLocations.length > 0 && !currentLocation;


  return (
    <LocationContext.Provider value={value as LocationContextType}>
        <LocationSelectionDialog 
            open={shouldShowDialog}
            locations={isPos ? posEnabledLocations : availableLocations}
            onSelectLocation={handleSetCurrentLocation}
        />
        {!shouldShowDialog && children}
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
