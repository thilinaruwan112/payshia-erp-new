
import { SupplierReturnPrintView } from '@/components/supplier-return-print-view';

export default function PrintSupplierReturnPage({ params }: { params: { id: string } }) {
    return <SupplierReturnPrintView id={params.id} />;
}
