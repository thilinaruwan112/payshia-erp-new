
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, DollarSign, LayoutDashboard, Package, Truck, Users } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: <LayoutDashboard className="h-8 w-8 text-primary" />,
    name: 'Unified Dashboard',
    description: 'Get a 360-degree view of your business with our comprehensive dashboards.',
  },
  {
    icon: <Package className="h-8 w-8 text-primary" />,
    name: 'Inventory Management',
    description: 'Track stock levels, manage variants, and streamline inventory control.',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    name: 'CRM',
    description: 'Manage customer relationships, track interactions, and run marketing campaigns.',
  },
  {
    icon: <DollarSign className="h-8 w-8 text-primary" />,
    name: 'Accounting',
    description: 'Handle expenses, manage chart of accounts, and keep your finances in order.',
  },
   {
    icon: <Briefcase className="h-8 w-8 text-primary" />,
    name: 'HRM',
    description: 'Manage your employees, payroll, and attendance all in one place.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background border-b">
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
              Get Started
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    The All-In-One Platform to Run Your Business
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Payshia ERP gives you the tools to manage everything from sales and inventory to accounting and human resources, all in one place.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                   <Button size="lg" asChild>
                     <Link href="/register">
                      Get Started for Free
                    </Link>
                   </Button>
                </div>
              </div>
               <img
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                data-ai-hint="erp system dashboard"
              />
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need. Nothing You Don’t.</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our comprehensive suite of tools is designed to streamline your operations and help you make smarter decisions.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              {features.map((feature) => (
                <Card key={feature.name} className="p-6">
                  <CardContent className="grid gap-4 p-0">
                    <div className="flex items-center justify-center h-16 w-16 bg-primary/10 rounded-full">
                       {feature.icon}
                    </div>
                    <div className="grid gap-1">
                      <h3 className="text-lg font-bold">{feature.name}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Payshia Software Solutions. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
