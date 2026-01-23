
'use client'

import { type Invoice, type User, type Product, type ProductVariant } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useLocation } from './location-provider';
import { Separator } from './ui/separator';
import { fetcher } from '@/lib/api';
import { useCurrency } from './currency-provider';


interface InvoiceViewProps {
    id: string;
}

const getStatusColor = (status: Invoice['invoice_status']) => {
  switch (status) {
    case 'Draft':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'Sent':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Paid':
    case 'Active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Overdue':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

const getStatusText = (status: string): string => {
    if (status === '1') return 'Active';
    if (status === '2') return 'Pending';
    if (status === '3') return 'Cancelled';
    if (status === '4') return 'Draft';
    return status;
}

const AddressDisplay = ({ title, addressSource }: { title: string, addressSource: any }) => {
    if (!addressSource) return null;

    const firstName = addressSource.first_name || addressSource.customer_first_name;
    const lastName = addressSource.last_name || addressSource.customer_last_name;
    const addressLine1 = addressSource.address_line1;
    const addressLine2 = addressSource.address_line2;
    const city = addressSource.city || addressSource.city_id; // Prefer 'city' if available
    const phone = addressSource.phone || addressSource.phone_number;
    const email = (addressSource.user_id && addressSource.user_id.includes('@')) ? addressSource.user_id : (addressSource.email || addressSource.email_address);
    
    const addressParts = [addressLine1, addressLine2, city].filter(Boolean).join(', ');

    return (
        <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="font-semibold">{firstName} {lastName}</p>
            {addressParts && <p className="text-sm text-muted-foreground">{addressParts}</p>}
            {email && <p className="text-sm text-muted-foreground">{email}</p>}
            {phone && <p className="text-sm text-muted-foreground">{phone}</p>}
        </div>
    );
};


export function InvoiceView({ id }: InvoiceViewProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { company_id } = useLocation();
  const [isVehicleDialogVisible, setVehicleDialogVisible] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [printType, setPrintType] = useState<'dispatch' | 'gatepass' | null>(null);
  const { currencySymbol } = useCurrency();


  useEffect(() => {
    async function fetchData() {
      if (!id || !company_id) return;
      setIsLoading(true);
      try {
        const [invoiceResponse, productsResponse, variantsResponse] = await Promise.all([
          fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/invoices/full/?invoicenumber=${id}&company_id=${company_id}`),
          fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products`),
          fetcher(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product-variants`),
        ]);

        if (!invoiceResponse.ok) {
           if (invoiceResponse.status === 404) notFound();
           throw new Error('Failed to fetch invoice data');
        }
        const data: Invoice = await invoiceResponse.json();
        setInvoice(data);
        if (data.customer) {
          setCustomer(data.customer);
        }

        if (productsResponse.ok) {
          setProducts(await productsResponse.json());
        }
        if (variantsResponse.ok) {
          setVariants(await variantsResponse.json());
        }

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load invoice',
          description: error instanceof Error ? error.message : 'Could not fetch data from the server.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, company_id, toast]);

  const getProductName = (productId: number, variantId?: string) => {
    const product = products.find(p => p.id === String(productId));
    if (!product) return 'Unknown Product';
    
    if (variantId) {
      const variant = variants.find(v => v.id === variantId);
      if (variant) {
        const variantAttributes = [variant.color, variant.size].filter(Boolean).join(' - ');
        return variantAttributes ? `${product.name} - ${variantAttributes}` : `${product.name} (${variant.sku})`;
      }
    }
    return product.name;
  };
  
  const invoiceItems = invoice?.items?.map(item => ({
    ...item,
    productName: getProductName(item.product_id, item.product_variant_id),
    total_cost: parseFloat(String(item.item_price)) * parseFloat(String(item.quantity)),
  }));

  if (isLoading) {
    return <InvoiceViewSkeleton />;
  }

  if (!invoice) {
    return <div>Invoice not found or failed to load.</div>;
  }
  
  const handlePrint = (showBankDetails: boolean) => {
    const url = `/sales-print/invoices/${invoice.invoice_number}/print?company_id=${invoice.company_id}&showBankDetails=${showBankDetails}`;
    window.open(url, '_blank');
  };

  const handlePrintWithVehicle = () => {
    if (printType) {
      const url = `/sales-print/invoices/${invoice.invoice_number}/${printType === 'dispatch' ? 'dispatch-note' : 'gate-pass'}?vehicleNo=${encodeURIComponent(vehicleNumber)}`;
      window.open(url, '_blank');
      setVehicleDialogVisible(false);
      setVehicleNumber('');
      setPrintType(null);
    }
  }
  
  const addresses = (invoice as any).addresses;
  let billTo = customer; // fallback
  let shipTo = null;

  if (addresses) {
      billTo = addresses.billing || addresses.shipping;
      shipTo = addresses.shipping;
      // If billing exists and is different from shipping, show both.
      // If only shipping exists, it's used for billTo, and shipTo is the same, so we won't show it twice.
      if (addresses.billing && JSON.stringify(addresses.billing) === JSON.stringify(addresses.shipping)) {
          shipTo = null;
      }
  } else if ((invoice as any).billing_address) {
      billTo = (invoice as any).billing_address;
  }

  const statusText = getStatusText(invoice.invoice_status);


  return (
    <>
    <div className="space-y-6 print:text-black">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Invoice: {invoice.invoice_number}
            </h1>
            <p className="text-muted-foreground">
                Created on {new Date(invoice.invoice_date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
              </Button>
               <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Print Options</AlertDialogTitle>
                            <AlertDialogDescription>
                                Do you want to include bank details for payment on the printed invoice?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                             <AlertDialogAction onClick={() => handlePrint(false)}>
                                Print without Bank Details
                            </AlertDialogAction>
                            <AlertDialogAction onClick={() => handlePrint(true)}>
                                Print with Bank Details
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
               <Button variant="outline" onClick={() => { setPrintType('dispatch'); setVehicleDialogVisible(true); }}>
                  <FileText className="mr-2 h-4 w-4" />
                  Dispatch Note
              </Button>
               <Button variant="outline" onClick={() => { setPrintType('gatepass'); setVehicleDialogVisible(true); }}>
                  <FileText className="mr-2 h-4 w-4" />
                  Gate Pass
              </Button>
          </div>
        </div>

        <Card className="print-card-styles">
            <CardHeader className="flex flex-col md:flex-row items-start justify-between">
                <div>
                     <CardTitle>Invoice {invoice.invoice_number}</CardTitle>
                     <CardDescription>
                         <Badge variant="secondary" className={cn('mt-2', getStatusColor(statusText))}>
                           {statusText}
                        </Badge>
                     </CardDescription>
                </div>
                <div className="text-left md:text-right mt-4 md:mt-0">
                    <p className="font-semibold text-lg">Payshia ERP</p>
                    <p className="text-sm text-muted-foreground">#455, 533A3, Pelmadulla</p>
                </div>
            </CardHeader>
             <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 mb-8">
                     <AddressDisplay title="Billed To" addressSource={billTo} />
                     {shipTo && <AddressDisplay title="Shipped To" addressSource={shipTo} />}
                     <div className="space-y-1 text-left md:text-right md:col-start-2 row-start-1">
                        <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
                        <p className="font-semibold">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                         <p className="text-sm font-medium text-muted-foreground mt-2">Due Date</p>
                        <p className="font-semibold">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                     </div>
                </div>
                
                {/* Desktop Table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Discount</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoiceItems?.map((item, index) => (
                            <TableRow key={index}>
                                    <TableCell>{item.productName}</TableCell>
                                    <TableCell className="text-right">{parseFloat(String(item.quantity))}</TableCell>
                                    <TableCell className="text-right font-mono">{currencySymbol}{parseFloat(String(item.item_price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-right font-mono text-destructive">-{currencySymbol}{parseFloat(String(item.item_discount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-right font-mono">{currencySymbol}{item.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                
                {/* Mobile Card List */}
                <div className="md:hidden space-y-4">
                    {invoiceItems?.map((item, index) => (
                        <Card key={index} className="p-4">
                            <div className="flex justify-between items-start">
                                <span className="font-semibold pr-4">{item.productName}</span>
                                <span className="font-mono font-semibold">{currencySymbol}{item.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                <span>{parseFloat(String(item.quantity))} x {currencySymbol}{parseFloat(String(item.item_price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                {parseFloat(String(item.item_discount)) > 0 && (
                                    <span className="text-destructive text-xs"> (-{currencySymbol}{parseFloat(String(item.item_discount)).toFixed(2)})</span>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
             </CardContent>
             <CardFooter>
                <div className="w-full md:ml-auto md:max-w-sm space-y-2">
                    <Separator className="md:hidden my-4" />
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-mono">{currencySymbol}{parseFloat(invoice.inv_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-destructive">
                        <span>Total Discount</span>
                        <span className="font-mono">-{currencySymbol}{parseFloat(invoice.discount_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Service Charge</span>
                        <span className="font-mono">{currencySymbol}{parseFloat(invoice.service_charge).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Grand Total</span>
                        <span className="font-mono">{currencySymbol}{parseFloat(invoice.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </CardFooter>
         </Card>
    </div>
    <Dialog open={isVehicleDialogVisible} onOpenChange={setVehicleDialogVisible}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Enter Vehicle Number</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
                 <Label htmlFor="vehicle-no">
                        Vehicle No.
                    </Label>
                <Input
                    id="vehicle-no"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g. ABC-1234"
                />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setVehicleDialogVisible(false)}>Cancel</Button>
                <Button type="submit" onClick={handlePrintWithVehicle}>Continue to Print</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  </>
  );
}

function InvoiceViewSkeleton() {
  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-24" />
             <Skeleton className="h-10 w-32" />
             <Skeleton className="h-10 w-32" />
             <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                 <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-6 w-24 mt-2 rounded-full" />
                 </div>
                 <div className="text-right">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-2" />
                 </div>
            </CardHeader>
             <CardContent>
                 <div className="grid grid-cols-2 gap-4 mb-8">
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-5 w-32" />
                         <Skeleton className="h-4 w-48" />
                     </div>
                     <div className="space-y-2 text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                        <Skeleton className="h-5 w-24 ml-auto" />
                        <Skeleton className="h-4 w-16 ml-auto mt-2" />
                        <Skeleton className="h-5 w-24 ml-auto" />
                     </div>
                 </div>

                <div className="space-y-2">
                    {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="flex justify-between items-center py-2">
                            <Skeleton className="h-4 flex-1 max-w-sm" />
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>
            </CardContent>
             <CardFooter className="flex justify-end">
                 <div className="w-full max-w-sm space-y-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-8 w-full mt-2" />
                 </div>
            </CardFooter>
         </Card>
    </div>
  );
}
