
export const reportCategories = [
    { 
        name: 'Master', 
        reports: [
            { name: 'Customer Master Report', href: '/reports/customer-report', filters: ['customer'] },
            { name: 'Supplier Master Report', href: '/reports/supplier-report', filters: ['supplier'] },
            { name: 'Item Master Report', href: '/reports/stock-balance', filters: ['item', 'category', 'brand', 'collection', 'color', 'size', 'customField'] },
        ]
    },
    {
        name: 'Purchasing',
        reports: [
            { name: 'Purchase Order Report', href: '/purchasing/purchase-orders', filters: ['dateRange', 'supplier', 'status'] },
            { name: 'GRN Report', href: '/purchasing/grn', filters: ['dateRange', 'supplier'] },
        ]
    },
    { 
        name: 'Stock', 
        reports: [
            { name: 'Stock Balance Report', href: '/reports/stock-balance', filters: ['date', 'location', 'category', 'brand', 'item'] },
            { name: 'Stock Transfer Report', href: '/transfers', filters: ['dateRange', 'fromLocation', 'toLocation'] },
            { name: 'Bin Card Report', href: '/reports/bin-card', filters: ['dateRange', 'location', 'item'] },
            { name: 'Stock Movement Report', href: '/reports/bin-card', filters: ['dateRange', 'location', 'item'] },
        ]
    },
    { 
        name: 'Sale', 
        reports: [
            { name: 'Credit Sales Summary Report', href: '/reports/credit-sales-summary', filters: ['dateRange', 'customer', 'location'] },
            { name: 'Customer Order Report', href: '/reports/customer-report', filters: ['dateRange', 'customer'] },
            { name: 'Day End Sale Report', href: '/reports/sales-summary', filters: ['dateRange', 'location'] },
            { name: 'Hourly Sales Report', href: '/reports/sales-summary', filters: ['dateRange', 'location'] },
            { name: 'Invoice Report', href: '/reports/invoice-report', filters: ['dateRange', 'customer', 'status'] },
            { name: 'Invoice Wise Sales Report', href: '#', filters: ['dateRange', 'location', 'user'] },
            { name: 'Item Wise Sales', href: '#', filters: ['dateRange', 'item', 'category', 'brand', 'location'] },
            { name: 'Receipt Report', href: '/sales/receipts', filters: ['dateRange', 'customer'] },
            { name: 'Sales Summary Report', href: '/reports/sales-summary', filters: ['dateRange', 'location', 'user'] },
        ]
    },
    { 
        name: 'Management',
        reports: [
            { name: 'Profit & Loss Statement', href: '#', filters: ['dateRange'] },
            { name: 'Balance Sheet', href: '#', filters: ['date'] },
            { name: 'Trial Balance', href: '#', filters: ['date'] },
        ]
    },
];

export const allReports = reportCategories.flatMap(cat => cat.reports);
