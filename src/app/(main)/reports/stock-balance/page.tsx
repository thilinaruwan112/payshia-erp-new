
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { StockBalanceReportView } from '@/components/reports/stock-balance-report-view';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, Printer, ArrowLeft } from 'lucide-react';
import { fetcher } from '@/lib/api';
import { useLocation } from '@/components/location-provider';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import type { Product, ProductVariant, Category, Brand } from '@/lib/types';


interface ProductWithApiResponse {
    product: Product;
    variants: { variant: ProductVariant }[];
}

export default function StockBalanceReportPage() {
    const [reportData, setReportData] = useState<any[]>([]);
    const { company_id, availableLocations } = useLocation();
    const { toast } = useToast();
    const [isFetching, setIsFetching] = useState(false);
    const router = useRouter();
    const [products, setProducts] = useState<ProductWithApiResponse[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});

    const handleFilterChange = (filterName: string, value: string) => {
        setFilterValues(prev => ({ ...prev, [filterName]: value }));
    };

    useEffect(() => {
        async function fetchDropdownData() {
            if (!company_id) return;
            const fetchData = async (url: string, setData: React.Dispatch<React.SetStateAction<any[]>>, type: string) => {
                 try {
                    const response = await fetcher(url);
                    if (!response.ok) throw new Error(`Failed to fetch ${type}`);
                    const data = await response.json();
                     if (type === 'products') {
                        setData(data.products || []);
                    } else {
                        setData(data || []);
                    }
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error', description: `Could not fetch ${type} list.`});
                }
            }
            fetchData(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/with-variants/by-company?company_id=${company_id}`, setProducts, 'products');
            fetchData(`${process.env.NEXT_PUBLIC_API_BASE_URL}/master-categories/company?company_id=${company_id}`, setCategories, 'categories');
            fetchData(`${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/company?company_id=${company_id}`, setBrands, 'brands');
        }
        fetchDropdownData();
    }, [company_id, toast]);

    const handleViewReport = useCallback(async () => {
        setIsFetching(true);
        setReportData([]);
        try {
            if (!company_id) throw new Error("Company ID is missing.");
            const params = new URLSearchParams({ company_id: String(company_id) });

            if (filterValues['location'] && filterValues['location'] !== 'all') {
                params.append('location_id', filterValues['location']);
            }
            if (filterValues['item'] && filterValues['item'] !== 'all') {
                const selectedProduct = products.find(p => p.variants.some(v => v.variant.id === filterValues['item']));
                const selectedVariant = selectedProduct?.variants.find(v => v.variant.id === filterValues['item'])?.variant;
                if (selectedProduct && selectedVariant) {
                   params.append('product_id', selectedProduct.product.id);
                   params.append('product_variant_id', selectedVariant.id);
                }
            }
            if (filterValues['category'] && filterValues['category'] !== 'all') {
                params.append('category_id', filterValues['category']);
            }
            if (filterValues['brand'] && filterValues['brand'] !== 'all') {
                params.append('brand_id', filterValues['brand']);
            }

            const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stock-balance?${params.toString()}`;
            const response = await fetcher(url);
            if (!response.ok) throw new Error('Failed to fetch report data');
            const data = await response.json();
            setReportData(data.data || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: `Could not fetch report data.` });
        } finally {
            setIsFetching(false);
        }
    }, [company_id, filterValues, products, toast]);

    const itemOptions = [{ value: 'all', label: 'All Items' }, ...products.flatMap(p => (p.variants || []).map(v => ({ value: v.variant.id, label: `${p.product.name} (${v.variant.sku})` })))];
    const locationOptions = [{ value: 'all', label: 'All Locations' }, ...availableLocations.map(l => ({ value: l.location_id, label: l.location_name }))];
    const categoryOptions = [{ value: 'all', label: 'All Categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))];
    const brandOptions = [{ value: 'all', label: 'All Brands' }, ...brands.map(b => ({ value: b.id, label: b.name }))];

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                 <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Balance Report</h1>
                    <p className="text-muted-foreground">View current stock levels across your locations.</p>
                 </div>
                 <Button variant="outline" onClick={() => router.push('/reports')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Reports
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                <div className="space-y-1.5"><Label>Location</Label><Combobox options={locationOptions} value={filterValues['location'] || ''} onChange={(v) => handleFilterChange('location', v)} placeholder="Select location" /></div>
                <div className="space-y-1.5"><Label>Category</Label><Combobox options={categoryOptions} value={filterValues['category'] || ''} onChange={(v) => handleFilterChange('category', v)} placeholder="Select category" /></div>
                <div className="space-y-1.5"><Label>Brand</Label><Combobox options={brandOptions} value={filterValues['brand'] || ''} onChange={(v) => handleFilterChange('brand', v)} placeholder="Select brand" /></div>
                <div className="space-y-1.5"><Label>Item</Label><Combobox options={itemOptions} value={filterValues['item'] || ''} onChange={(v) => handleFilterChange('item', v)} placeholder="Select item" /></div>
                <Button onClick={handleViewReport} disabled={isFetching} className="w-full">
                    {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                    View Report
                </Button>
            </div>

            {reportData && <StockBalanceReportView reportData={reportData} />}
        </div>
    );
}
