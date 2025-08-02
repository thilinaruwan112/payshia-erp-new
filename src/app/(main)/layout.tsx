import { AppShell } from '@/components/app-shell';
import { CurrencyProvider } from '@/components/currency-provider';
import { LocationProvider } from '@/components/location-provider';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <CurrencyProvider>
        <LocationProvider>
          <AppShell>{children}</AppShell>
        </LocationProvider>
      </CurrencyProvider>
    </SidebarProvider>
  );
}
