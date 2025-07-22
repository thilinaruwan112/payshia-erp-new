
import { CustomerForm } from '@/components/customer-form';
import { users } from '@/lib/data';
import { notFound } from 'next/navigation';

export default function EditCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = users.find(
    (u) => u.id === params.id && u.role === 'Customer'
  );

  if (!customer) {
    notFound();
  }

  return <CustomerForm customer={customer} />;
}
