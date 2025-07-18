import { AppShell } from '@/components/app-shell';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppShell>{children}</AppShell>
    </SidebarProvider>
  );
}
