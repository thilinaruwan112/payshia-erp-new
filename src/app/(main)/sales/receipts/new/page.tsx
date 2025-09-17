
import { ReceiptForm } from '@/components/receipt-form';
import type { User } from '@/lib/types';
import { fetcher } from '@/lib/api';

async function getData(): Promise<{ customers: User[] }> {
    try {
        const [customerResponse] = await Promise.all([
             fetcher('https://server-erp.payshia.com/customers'),
        ]);
        
        if (!customerResponse.ok) {
            throw new Error('Failed to fetch data for receipt form');
        }
        
        const customers = await customerResponse.json();
        
        return { customers: customers || [] };
    } catch (error) {
        console.error("Failed to fetch receipt data:", error);
        return { customers: [] };
    }
}


export default async function NewReceiptPage() {
  const { customers } = await getData();
  return <ReceiptForm customers={customers} />;
}
