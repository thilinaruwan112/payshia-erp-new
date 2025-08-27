

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
    description: `
      The Dashboard is your command center. 
      <br/><br/>
      <strong>How to use it:</strong>
      <ul class="list-disc pl-6 mt-2 space-y-1">
        <li>Select your current business location from the dropdown at the top to see location-specific data.</li>
        <li>Review key metrics like Total Stock, SKUs, and Low Stock Alerts in the cards at the top.</li>
        <li>Use the AI Inventory Forecasting and POS links for quick access to powerful tools.</li>
        <li>Analyze the Sales Overview and Top Products charts to understand business performance.</li>
      </ul>
    `,
  },
  {
    icon: <Package className="h-6 w-6 text-primary" />,
    title: 'How to Handle Products with Inventory',
    description: `
      This guide provides a step-by-step process for managing your products and their stock levels effectively.
      <br/><br/>
      <strong>Step 1: Set Up Product Attributes (One-time Setup)</strong>
      <p class='mt-1 mb-2'>Before adding products, it's best to define your product attributes. This makes product creation faster and more organized.</p>
      <ul class="list-decimal pl-6 mt-2 space-y-2">
        <li>Go to <strong>Inventory & Products > Categories</strong> to define product categories (e.g., "Apparel", "Electronics").</li>
        <li>Go to <strong>Inventory & Products > Brands</strong> to add brands you carry (e.g., "Nike", "Sony").</li>
        <li>Go to <strong>Inventory & Products > Colors / Sizes</strong> to pre-define common variants.</li>
        <li>Go to <strong>Inventory & Products > Custom Fields</strong> to create extra data fields if needed (e.g., "Material", "Warranty").</li>
      </ul>
      <br/>
      <strong>Step 2: Add a New Product</strong>
      <ul class="list-decimal pl-6 mt-2 space-y-2">
        <li>Navigate to <strong>Inventory & Products > All Products</strong> and click the "New Product" button.</li>
        <li>Fill in the basic product details like Name, Description, Category, and Brand.</li>
        <li>In the <strong>Pricing</strong> section, set the selling price and optionally the cost price for margin tracking.</li>
        <li>In the <strong>Variants</strong> section, add at least one variant. Each variant must have a unique <strong>SKU</strong> (Stock Keeping Unit). You can assign the colors and sizes you created earlier. Add as many variants as you need (e.g., Small-Red, Medium-Red, Small-Blue).</li>
        <li>Click <strong>"Save Product"</strong>. You will then be prompted to upload images.</li>
      </ul>
      <br/>
       <strong>Step 3: Set Initial Stock Levels</strong>
       <p class='mt-1 mb-2'>After creating a product, you need to tell the system how many you have in stock.</p>
      <ul class="list-decimal pl-6 mt-2 space-y-2">
        <li>Go to <strong>Inventory & Products > Opening Stock</strong>.</li>
        <li>Select the product you just created from the dropdown. This will show all its variants.</li>
        <li>For each variant, enter the <strong>Quantity</strong> you currently have in stock at your selected location.</li>
        <li>Enter a <strong>Batch Number</strong> (e.g., OPEN-STOCK-001) and an optional <strong>Expiry Date</strong> if applicable.</li>
        <li>Click <strong>"Save Opening Stock"</strong>. Your inventory levels are now set.</li>
      </ul>
      <br/>
       <strong>Step 4: Manage Stock (Ongoing)</strong>
      <ul class="list-decimal pl-6 mt-2 space-y-2">
        <li><strong>Purchasing:</strong> When you buy more stock, use the <strong>Purchasing > Goods Received Notes (GRN)</strong> module to add new inventory. This will automatically update your stock levels.</li>
        <li><strong>Sales:</strong> When you sell items through the <strong>POS System</strong> or create an <strong>Invoice</strong>, stock levels will be automatically deducted.</li>
        <li><strong>Transfers:</strong> To move stock between your locations, use the <strong>Inventory & Products > Stock Transfers</strong> feature.</li>
        <li><strong>Dashboard:</strong> Monitor overall stock levels, view top products, and see low stock alerts on the <strong>Inventory Dashboard</strong>.</li>
      </ul>
    `,
  },
  {
    icon: <ShoppingCart className="h-6 w-6 text-primary" />,
    title: 'Order Processing',
    description: `
      View and manage all incoming orders from different sales channels. 
      <br/><br/>
      <strong>How it works:</strong>
      <ul class="list-disc pl-6 mt-2 space-y-1">
        <li>The orders page shows a table view on desktop and a mobile-friendly card view on smaller devices.</li>
        <li>Use the actions dropdown on each order to view details or process shipments.</li>
        <li>Status badges (e.g., Pending, Shipped) give you a quick look at the order's current state.</li>
      </ul>
    `,
  },
  {
    icon: <Contact className="h-6 w-6 text-primary" />,
    title: 'Customer Relationship Management (CRM)',
    description: `
      Build and maintain relationships with your customers.
      <br/><br/>
      <strong>What you can do:</strong>
      <ul class="list-disc pl-6 mt-2 space-y-1">
        <li><strong>Manage Customers:</strong> Go to CRM > Customers to view, add, or edit customer profiles, including their address and loyalty points.</li>
        <li><strong>Set Loyalty Tiers:</strong> Go to CRM > Loyalty Schema to define the point thresholds for Bronze, Silver, Gold, and Platinum tiers.</li>
        <li><strong>Run Campaigns:</strong> Use the SMS and Email Campaign builders to send targeted marketing messages to specific customer segments.</li>
      </ul>
    `,
  },
  {
    icon: <Landmark className="h-6 w-6 text-primary" />,
    title: 'Accounting',
    description: `
      Keep your finances in check with a full suite of accounting tools.
      <br/><br/>
      <strong>Core features:</strong>
      <ul class="list-disc pl-6 mt-2 space-y-1">
        <li><strong>Chart of Accounts:</strong> The backbone of your accounting system.</li>
        <li><strong>Record Expenses/Payments:</strong> Log all money going out of the business.</li>
        <li><strong>Journal Entries:</strong> Make manual adjustments to your accounts.</li>
        <li><strong>Fixed Assets:</strong> Track long-term assets and run depreciation calculations.</li>
      </ul>
    `,
  },
  {
    icon: <BotMessageSquare className="h-6 w-6 text-primary" />,
    title: 'AI-Powered Features',
    description: `
      Leverage the power of AI to make smarter business decisions.
      <br/><br/>
      <strong>Available AI Tools:</strong>
      <ul class="list-disc pl-6 mt-2 space-y-1">
        <li><strong>Logistics Assistant:</strong> Input package details, destination, and urgency to get an AI-powered shipping vendor suggestion.</li>
        <li><strong>Inventory Forecasting:</strong> Provide product name, past sales data, and seasonal trends to receive an AI-generated forecast for reorder points and quantities.</li>
      </ul>
    `,
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
            <AccordionContent>
                <div className="text-base text-muted-foreground pl-14 prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: feature.description }}
                />
            </AccordionContent>
          </AccordionItem>
         ))}
      </Accordion>
    </div>
  );
}
