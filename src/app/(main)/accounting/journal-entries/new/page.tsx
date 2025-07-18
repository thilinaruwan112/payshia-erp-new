
import { JournalEntryForm } from '@/components/journal-entry-form';
import { chartOfAccounts } from '@/lib/data';

export default function NewJournalEntryPage() {
  return <JournalEntryForm accounts={chartOfAccounts} />;
}
