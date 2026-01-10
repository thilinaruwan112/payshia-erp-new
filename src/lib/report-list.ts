
export const reportCategories = [
    { 
        name: 'Master', 
        reports: [
            { name: 'Customer Master Report', href: '/reports/customer-report', filters: [] },
            { name: 'Supplier Master Report', href: '/reports/supplier-report', filters: [] },
            { name: 'Item Master Report', href: '/reports/item-master-report', filters: [] },
        ]
    },
    {
        name: 'Purchasing',
        reports: [
            { name: 'Purchase Order Report', href: '/reports/purchase-order-report', filters: [] },
            { name: 'GRN Report', href: '/reports/grn-report', filters: [] },
        ]
    },
    { 
        name: 'Stock', 
        reports: [
            { name: 'Stock Balance Report', href: '/reports/stock-balance', filters: ['location', 'category', 'brand', 'item'] },
            { name: 'Stock Transfer Report', href: '/reports/stock-transfer-report', filters: ['dateRange', 'fromLocation', 'toLocation'] },
            { name: 'Bin Card Report', href: '/reports/bin-card', filters: ['dateRange', 'location', 'item'] },
        ]
    },
    { 
        name: 'Sale', 
        reports: [
            { name: 'Credit Sales Summary Report', href: '/reports/credit-sales-summary', filters: ['dateRange', 'customer'] },
            { name: 'Day End Sale Report', href: '/reports/day-end-sales-report', filters: ['date', 'location'] },
            { name: 'Invoice Wise Sales Report', href: '/reports/invoice-wise-sales-report', filters: ['dateRange', 'location'] },
            { name: 'Item Wise Sales', href: '/reports/item-wise-sales-report', filters: ['dateRange', 'location', 'category', 'brand'] },
            { name: 'Invoice Report', href: '/reports/invoice-report', filters: ['dateRange'] },
            { name: 'Hourly Invoice Report', href: '/reports/hourly-invoice-report', filters: ['dateRange', 'location', 'customer'] },
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
