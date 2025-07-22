import { AppShell } from '@/components/app-shell';
import { LocationProvider } from '@/components/location-provider';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <LocationProvider>
        <AppShell>{children}</AppShell>
      </LocationProvider>
    </SidebarProvider>
  );
}
