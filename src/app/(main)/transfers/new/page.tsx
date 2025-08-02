
import { TransferForm } from '@/components/transfer-form';
import type { Location } from '@/lib/types';

async function getLocations(): Promise<Location[]> {
    try {
        const res = await fetch('https://server-erp.payshia.com/locations');
        if (!res.ok) {
            console.error('Failed to fetch locations:', res.statusText);
            return [];
        }
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch locations:', error);
        return [];
    }
}


export default async function NewTransferPage() {
  const locations = await getLocations();
  return <TransferForm locations={locations} />;
}
