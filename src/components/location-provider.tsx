
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
    async function fetchLocations() {
      if (!company_id) {
          setIsLoading(false);
          return;
      };
      
      setIsLoading(true);
      try {
        const response = await fetch('https://server-erp.payshia.com/locations');
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        let data: Location[] = await response.json();
        
        const companyLocations = data.filter(loc => loc.company_id == company_id);

        setAvailableLocations(companyLocations);

        if (companyLocations.length > 0) {
            if (isPos) {
                const posEnabledLocations = companyLocations.filter(loc => loc.pos_status === "1");
                if (posEnabledLocations.length > 0) {
                     setAvailableLocations(posEnabledLocations);
                     // Auto-select if only one POS location is available
                     if (posEnabledLocations.length === 1) {
                         setCurrentLocation(posEnabledLocations[0]);
                     }
                } else {
                    // No POS locations, clear available locations for POS
                    setAvailableLocations([]);
                }
            } else {
                 const defaultLocation = companyLocations.find(l => l.location_name === 'Main Branch') || companyLocations[0];
                 setCurrentLocation(defaultLocation || null);
            }
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


  const value = useMemo(() => ({
    currentLocation,
    setCurrentLocation,
    availableLocations,
    isLoading,
    company_id
  }), [currentLocation, availableLocations, isLoading, company_id]);

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
