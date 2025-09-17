
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
        const response = await fetcher(`https://server-erp.payshia.com/locations/company?company_id=${company_id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        let data: Location[] = await response.json();
        
        const companyLocations = data.filter(loc => loc.company_id == company_id);

        setAvailableLocations(companyLocations);

        if (companyLocations.length > 0 && !sessionStorage.getItem('currentLocation')) {
            if (isPos) {
                const posEnabledLocations = companyLocations.filter(loc => loc.pos_status === "1");
                setAvailableLocations(posEnabledLocations);
                 if (posEnabledLocations.length === 1) {
                    handleSetCurrentLocation(posEnabledLocations[0]);
                 }
            } else {
                // If not in POS and no location is set, the dialog will be shown by the condition below.
            }
        } else if (companyLocations.length > 0 && sessionStorage.getItem('currentLocation')) {
            // Location is already set, do nothing.
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
  }, [toast, isPos, company_id]);

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

  const showLocationDialog = !isLoading && !isPos && availableLocations.length > 0 && !currentLocation;

  return (
    <LocationContext.Provider value={value as LocationContextType}>
        <LocationSelectionDialog 
            open={showLocationDialog}
            locations={availableLocations}
            onSelectLocation={handleSetCurrentLocation}
        />
        {!showLocationDialog && children}
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
