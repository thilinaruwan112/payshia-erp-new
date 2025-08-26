
import { GatePassPrintView } from '@/components/gate-pass-print-view';

export default async function PrintGatePassPage({ params }: { params: { id: string } }) {
  return <GatePassPrintView id={params.id} />;
}
