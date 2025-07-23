
import { LocationForm } from '@/components/location-form';
import { locations } from '@/lib/data';
import { notFound } from 'next/navigation';

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const location = locations.find((l) => l.id === params.id);

  if (!location) {
    notFound();
  }

  return <LocationForm location={location} />;
}
