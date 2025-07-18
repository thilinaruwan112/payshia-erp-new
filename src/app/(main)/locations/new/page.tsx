
import { LocationForm } from '@/components/location-form';
import { salesChannels } from '@/lib/data';

export default function NewLocationPage() {
  return <LocationForm salesChannels={salesChannels} />;
}
