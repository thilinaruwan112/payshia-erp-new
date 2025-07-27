

export type GrnBatch = {
    batchNumber: string;
    mfgDate?: Date;
    expDate?: Date;
    receivedQty: number;
}

export type GrnItem = {
    sku: string;
    productId: string;
    productName: string;
    orderQty: number;
    alreadyReceived: number;
    receivable: number; // This is the balance qty
    unitRate: number;
    productVariantId: string;
    batches: GrnBatch[];
}

export type ProductVariant = {
  id: string;
  sku: string;
  color?: string;
  size?: string;
  color_id?: string | null;
  size_id?: string | null;
  product_id?: string;
  barcode?: string | null;
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
  price2?: number;
  foreignPrice?: number;
  product_image_url?: string;
  print_name?: string;
  sinhala_name?: string;
  tamil_name?: string | null;
  display_name?: string | null;
  collectionProductId?: string; // Used for collection product association
  supplier?: string;
};

export type Location = {
  location_id: string;
  location_code: string;
  location_name: string;
  is_active: string;
  created_at: string;
  created_by: string;
  logo_path: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  phone_1: string;
  phone_2: string | null;
  pos_status: string;
  pos_token: string;
  location_type: 'Retail' | 'Warehouse' | string;
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
  created_at: string;
  updated_at: string;
  products?: Product[];
};

export type Supplier = {
  supplier_id: string;
  supplier_name: string;
  contact_person: string;
  email: string;
  telephone: string;
  street_name: string;
  city: string;
  zip_code: string;
  fax: string;
  opening_balance: string;
};

export type PurchaseOrder = {
    id: string;
    po_number: string;
    location_id: string;
    supplier_id: string;
    currency: string;
    tax_type: string;
    sub_total: string;
    created_by: string;
    created_at: string;
    is_active: string;
    po_status: string;
    remarks: string;
    company_id: string;
    items?: PurchaseOrderItem[];
}

export type PurchaseOrderItem = {
    purchase_order_id?: string;
    product_id: string;
    quantity: number;
    order_rate: number;
    order_unit?: string;
    product_variant_id: string;
    is_active?: number;
    // Fields for display purposes
    product_name?: string;
    variant_sku?: string;
    total_cost?: number;
};

export type GoodsReceivedNote = {
    id: string;
    poId: string;
    supplierName: string;
    receivedDate: string;
    locationId: string;
    locationName: string;
    itemCount: number;
    items: GrnItem[];
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
