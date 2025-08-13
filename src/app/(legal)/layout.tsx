
import { Truck } from "lucide-react";
import Link from "next/link";
import { Button } from '@/components/ui/button';

export default function LegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4 lg:px-6">
          <Link href="/" className="flex items-center justify-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Payshia ERP</span>
          </Link>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Button variant="ghost" asChild>
              <Link href="/login">
                Login
              </Link>
            </Button>
             <Button asChild>
              <Link href="/register">
                Sign Up
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
            {children}
        </div>
      </main>
      <footer className="w-full border-t bg-background">
        <div className="container mx-auto flex flex-col gap-2 sm:flex-row py-6 shrink-0 items-center px-4 md:px-6">
          <p className="text-xs text-muted-foreground">&copy; 2024 Payshia Software Solutions. All rights reserved.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link href="/terms" className="text-xs hover:underline underline-offset-4">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-xs hover:underline underline-offset-4">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
