
import { GrnForm } from '@/components/grn-form';
import { purchaseOrders, suppliers } from '@/lib/data';

export default function NewGrnPage() {
  // In a real app, you'd likely fetch only open POs
  return <GrnForm suppliers={suppliers} purchaseOrders={purchaseOrders} />;
}
