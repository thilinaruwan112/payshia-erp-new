
import { DispatchNotePrintView } from '@/components/dispatch-note-print-view';

export default async function PrintDispatchNotePage({ params }: { params: { id: string } }) {
  return <DispatchNotePrintView id={params.id} />;
}
