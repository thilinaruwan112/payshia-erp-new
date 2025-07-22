
import type { FixedAsset } from '@/lib/types';

export const fixedAssets: FixedAsset[] = [
    {
        id: 'asset-001',
        name: 'Company Vehicle - Ford Transit',
        assetType: 'Vehicles',
        purchaseDate: '2022-01-15',
        purchaseCost: 35000.00,
        accumulatedDepreciation: 7000.00,
        status: 'In Use',
    },
    {
        id: 'asset-002',
        name: 'Office Building',
        assetType: 'Buildings',
        purchaseDate: '2020-06-01',
        purchaseCost: 250000.00,
        accumulatedDepreciation: 25000.00,
        status: 'In Use',
    },
    {
        id: 'asset-003',
        name: 'MacBook Pro 16"',
        assetType: 'IT Equipment',
        purchaseDate: '2023-05-20',
        purchaseCost: 2500.00,
        accumulatedDepreciation: 500.00,
        status: 'In Use',
    },
    {
        id: 'asset-004',
        name: 'Warehouse Forklift',
        assetType: 'Machinery',
        purchaseDate: '2021-09-10',
        purchaseCost: 18000.00,
        accumulatedDepreciation: 7200.00,
        status: 'Under Maintenance',
    },
    {
        id: 'asset-005',
        name: 'Old Office Printer',
        assetType: 'IT Equipment',
        purchaseDate: '2019-03-01',
        purchaseCost: 800.00,
        accumulatedDepreciation: 800.00,
        status: 'Disposed',
    },
];
