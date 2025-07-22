
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BotMessageSquare, Contact, Landmark, LayoutDashboard, Package, ShoppingCart } from 'lucide-react';

const features = [
  {
    icon: <LayoutDashboard className="h-6 w-6 text-primary" />,
    title: 'Dashboard',
    description: 'Get a real-time overview of your business. Monitor key metrics like total stock, SKUs, and low stock alerts for your selected location.',
  },
  {
    icon: <Package className="h-6 w-6 text-primary" />,
    title: 'Inventory Management',
    description: 'Manage your products, collections, and track stock levels across all locations. Use the AI Forecasting tool to predict future demand and optimize inventory.',
  },
  {
    icon: <ShoppingCart className="h-6 w-6 text-primary" />,
    title: 'Order Processing',
    description: 'View and manage all incoming orders from different sales channels. The orders page is mobile-responsive, showing a card view on smaller devices.',
  },
  {
    icon: <Contact className="h-6 w-6 text-primary" />,
    title: 'Customer Relationship Management (CRM)',
    description: 'Manage your customer database, define loyalty tier schemas, and run targeted SMS and Email campaigns to engage your customers effectively.',
  },
  {
    icon: <Landmark className="h-6 w-6 text-primary" />,
    title: 'Accounting',
    description: 'Keep your finances in check with a full suite of accounting tools, including payments, expenses, chart of accounts, journal entries, and fixed asset management.',
  },
  {
    icon: <BotMessageSquare className="h-6 w-6 text-primary" />,
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

       <Accordion type="single" collapsible className="w-full">
         {features.map((feature, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-lg hover:no-underline">
                <div className="flex items-center gap-4">
                    {feature.icon}
                    <span>{feature.title}</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground pl-14">
              {feature.description}
            </AccordionContent>
          </AccordionItem>
         ))}
      </Accordion>
    </div>
  );
}
