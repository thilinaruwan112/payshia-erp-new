

export type ProductVariant = {
  id?: string;
  sku: string;
  color?: string;
  size?: string;
  color_id?: string | null;
  size_id?: string | null;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  category: string;
  category_id?: string;
  brand_id?: string;
  variants: ProductVariant[];
  price: number | string;
  status: 'active' | 'draft';
  stock_unit?: string;
  cost_price?: number | string;
  min_price?: number | string;
  wholesale_price?: number | string;
  product_image_url?: string;
  print_name?: string;
  sinhala_name?: string;
  tamilName?: string;
  displayName?: string;
};

export type Location = {
  id: string;
  name: string;
  type: 'Warehouse' | 'Store';
  salesChannels: ('E-commerce' | 'Retail' | 'Wholesale' | 'POS')[];
};

export type InventoryItem = {
  productId: string;
  sku: string;
  locationId: string;
  stock: number;
  reorderLevel: number;
};

export type Order = {
  id: string;
  customerName: string;
  channel: 'E-commerce' | 'Retail' | 'Wholesale' | 'POS';
  date: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
  items: { sku: string; quantity: number }[];
};

export type User = {
  id: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Sales Agent' | 'Customer';
  avatar: string;
  loyaltyPoints?: number;
  email?: string;
  phone?: string;
  address?: string;
};

export type Collection = {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  status: 'active' | 'draft';
  productCount?: number;
  created_at: string;
  updated_at: string;
};

export type Supplier = {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
}

export type PurchaseOrder = {
    id: string;
    supplierId: string;
    supplierName: string;
    date: string;
    expectedDelivery: string;
    status: 'Draft' | 'Sent' | 'Partial' | 'Received' | 'Cancelled';
    total: number;
    itemCount: number;
}

export type GoodsReceivedNote = {
    id: string;
    poId: string;
    supplierName: string;
    receivedDate: string;
    locationId: string;
    locationName: string;
    itemCount: number;
}

export type StockTransfer = {
    id: string;
    fromLocationId: string;
    fromLocationName: string;
    toLocationId: string;
    toLocationName: string;
    date: string;
    status: 'Pending' | 'In Transit' | 'Completed';
    itemCount: number;
    items: { sku: string, quantity: number }[];
    totalValue: number;
}

export type Plan = {
    id: string;
    name: string;
    description: string;
    price: number;
    limits: {
        orders: number;
        products: number;
        locations: number;
    };
    features: string[]; // For additional, non-limit based features
    ctaLabel: string;
}

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export type Account = {
    code: number;
    name: string;
    type: AccountType;
    subType: string;
    balance: number;
};

export type JournalEntry = {
    id: string;
    date: string;
    narration: string;
    totalDebit: number;
    totalCredit: number;
    lines: {
        accountCode: number;
        accountName: string;
        debit: number;
        credit: number;
    }[];
};

export type Expense = {
    id: string;
    date: string;
    payee: string;
    amount: number;
    expenseAccountId: number;
    expenseAccountName: string;
    paymentAccountId: number;
    paymentAccountName: string;
};

export type Payment = {
    id: string;
    date: string;
    supplierId: string;
    supplierName: string;
    poId?: string;
    amount: number;
    paymentAccountId: number;
    paymentAccountName: string;
};

export type FixedAsset = {
    id: string;
    name: string;
    assetType: string;
    purchaseDate: string;
    purchaseCost: number;
    accumulatedDepreciation: number;
    status: 'In Use' | 'Under Maintenance' | 'Disposed';
    depreciationMethod: 'Straight-Line' | 'Double Declining Balance';
};

export type InvoiceItem = {
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
};

export type Invoice = {
  id: string;
  orderId?: string;
  customerName: string;
  date: string;
  dueDate: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  total: number;
  discount: number;
  items: InvoiceItem[];
};

export type PaymentReceipt = {
  id: string;
  invoiceId: string;
  customerName: string;
  date: string;
  amount: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer';
};

export type SmsCampaign = {
    id: string;
    name: string;
    targetAudience: 'All' | 'Silver' | 'Gold' | 'Platinum' | 'Custom';
    status: 'Draft' | 'Sent';
    sentDate?: string;
    recipientCount: number;
    content: string;
};

export type EmailCampaign = {
    id: string;
    name: string;
    subject: string;
    targetAudience: 'All' | 'Silver' | 'Gold' | 'Platinum' | 'Custom';
    status: 'Draft' | 'Sent';
    sentDate?: string;
    recipientCount: number;
    content: string; // HTML content
};

export type Brand = {
  id: string;
  name: string;
  description?: string;
};

export type Color = {
    id: string;
    name: string;
}

export type Size = {
    id: string;
    value: string;
}
