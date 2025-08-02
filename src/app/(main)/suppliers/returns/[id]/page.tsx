
import { SupplierReturnView } from '@/components/supplier-return-view';

export default function ViewSupplierReturnPage({ params }: { params: { id: string } }) {
  return <SupplierReturnView id={params.id} />;
}
