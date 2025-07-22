
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BotMessageSquare, Contact, Landmark, LayoutDashboard, Package, ShoppingCart } from 'lucide-react';

const features = [
  {
    icon: <LayoutDashboard className="h-8 w-8 text-primary" />,
    title: 'Dashboard',
    description: 'Get a real-time overview of your business. Monitor key metrics like total stock, SKUs, and low stock alerts for your selected location.',
  },
  {
    icon: <Package className="h-8 w-8 text-primary" />,
    title: 'Inventory Management',
    description: 'Manage your products, collections, and track stock levels across all locations. Use the AI Forecasting tool to predict future demand and optimize inventory.',
  },
  {
    icon: <ShoppingCart className="h-8 w-8 text-primary" />,
    title: 'Order Processing',
    description: 'View and manage all incoming orders from different sales channels. The orders page is mobile-responsive, showing a card view on smaller devices.',
  },
  {
    icon: <Contact className="h-8 w-8 text-primary" />,
    title: 'Customer Relationship Management (CRM)',
    description: 'Manage your customer database, define loyalty tier schemas, and run targeted SMS and Email campaigns to engage your customers effectively.',
  },
  {
    icon: <Landmark className="h-8 w-8 text-primary" />,
    title: 'Accounting',
    description: 'Keep your finances in check with a full suite of accounting tools, including payments, expenses, chart of accounts, journal entries, and fixed asset management.',
  },
  {
    icon: <BotMessageSquare className="h-8 w-8 text-primary" />,
    title: 'AI-Powered Features',
    description: 'Leverage the power of AI with the Logistics Assistant to get shipping vendor suggestions and the Inventory Forecasting tool to prevent stockouts.',
  },
];

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">How to Use Payshia ERP</h1>
        <p className="text-muted-foreground">
          A guide to the key features and functionalities of the system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                {feature.icon}
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
