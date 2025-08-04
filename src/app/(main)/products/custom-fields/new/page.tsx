
import { CustomFieldForm } from '@/components/custom-field-form';
import { products } from '@/lib/data';
import React from 'react';

export default function NewCustomFieldPage() {
    return <CustomFieldForm products={products} />;
}
