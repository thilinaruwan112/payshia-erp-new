
import { PurchaseOrderForm } from '@/components/purchase-order-form';
import { suppliers, products } from '@/lib/data';

export default function NewPurchaseOrderPage() {
  return <PurchaseOrderForm suppliers={suppliers} products={products} />;
}
