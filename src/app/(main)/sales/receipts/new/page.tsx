
import { ReceiptForm } from '@/components/receipt-form';
import { type User, type Invoice } from '@/lib/types';

async function getData(): Promise<{ customers: User[], invoices: Invoice[] }> {
    try {
        const [customerResponse, invoiceResponse] = await Promise.all([
             fetch('https://server-erp.payshia.com/customers'),
             fetch('https://server-erp.payshia.com/invoices')
        ]);
        
        if (!customerResponse.ok || !invoiceResponse.ok) {
            throw new Error('Failed to fetch data for receipt form');
        }
        
        const customers = await customerResponse.json();
        const invoices = await invoiceResponse.json();
        
        return { customers: customers || [], invoices: invoices || [] };
    } catch (error) {
        console.error("Failed to fetch receipt data:", error);
        return { customers: [], invoices: [] };
    }
}


export default async function NewReceiptPage() {
  const { customers, invoices } = await getData();
  return <ReceiptForm customers={customers} invoices={invoices} />;
}
