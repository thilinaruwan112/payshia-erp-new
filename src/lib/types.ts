

export type GrnBatch = {
    batchNumber: string;
    mfgDate?: Date;
    expDate?: Date;
    receivedQty: number;
}

export type GrnItem = {
    id?: string;
    grn_id?: string;
    product_id: number;
    product_variant_id: number;
    order_unit: string;
    order_rate: number | string;
    received_qty: string;
    patch_code: string;
    expire_date: string;
    manufacture_date: string;
    created_by: string;
    is_active: number;
    po_number: string;
    // For view
    product_name?: string;
    variant_sku?: string;
    total_cost?: number;
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
  costPrice?: number | string;
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
  customer_id: string;
  name: string;
  customer_first_name?: string;
  customer_last_name?: string;
  email_address?: string;
  role: 'Admin' | 'Manager' | 'Sales Agent' | 'Customer';
  avatar?: string;
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
  productCount?: number;
};

export type Supplier = {
  id: string; // Keep this for client-side consistency if needed
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
    // For client-side join
    supplierName?: string;
    total?: number;
    itemCount?: number;
    expectedDelivery?: string;
    status: 'Received' | 'Sent' | 'Draft';
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
    grn_number: string;
    location_id: string;
    company_id: string;
    supplier_id: string;
    currency: string;
    tax_type: string;
    sub_total: string;
    tax_value: string;
    grand_total: string;
    created_by: string;
    created_at: string;
    is_active: string;
    grn_status: string;
    remarks: string;
    payment_status: string;
    po_number: string;
    items?: GrnItem[];
}

export type StockTransferItem = {
    id: string;
    stock_transfer_id: string;
    product_id: string;
    product_variant_id: string;
    quantity: string;
    patch_code: string | null;
    expire_date: string;
    company_id: string;
}

export type StockEntry = {
    id: string;
    type: 'IN' | 'OUT';
    quantity: string;
    patch_code: string;
    manufacture_date: string;
    expire_date: string;
    product_id: string;
    reference: string;
    location_id: string;
    created_by: string;
    created_at: string;
    is_active: string;
    ref_id: string;
    company_id: string;
    transaction_type: string;
    product_variant_id: string;
}

export type StockTransfer = {
    id: string;
    from_location: string;
    to_location: string;
    transfer_date: string;
    status: 'pending' | 'in-transit' | 'completed';
    stock_transfer_number: string;
    company_id: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    items: StockTransferItem[];
    stock_entries: StockEntry[];
};


export type SupplierReturn = {
    id: string;
    grnId: string;
    supplierId: string;
    supplierName: string;
    date: string;
    totalValue: number;
    items: {
        sku: string;
        returnedQty: number;
        unitPrice: number;
        reason: string;
    }[];
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
    id?: string;
    user_id?: number;
    product_id: number;
    item_price: number | string;
    item_discount: number | string;
    quantity: number | string;
    customer_id?: number;
    table_id?: number;
    cost_price: number | string;
    is_active?: number;
    hold_status?: number;
    printed_status?: number;
    company_id?: string;
    added_date?: string;
    invoice_number?: string;
    // Client-side only
    productName?: string;
};

export type Invoice = {
    id: string;
    invoice_number: string;
    invoice_date: string;
    inv_amount: string;
    grand_total: string;
    discount_amount: string;
    discount_percentage: string;
    customer_code: string;
    service_charge: string;
    tendered_amount: string;
    close_type: string;
    invoice_status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
    payment_status: string;
    chanel: string;
    current_time: string;
    location_id: string;
    table_id: string;
    order_ready_status: string;
    created_by: string;
    is_active: string;
    steward_id: string;
    cost_value: string;
    remark: string | null;
    ref_hold: string | null;
    company_id: string;
    items?: InvoiceItem[];
    customer?: User; // Can be added if the new endpoint returns it
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
