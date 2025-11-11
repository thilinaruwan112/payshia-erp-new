
'use client';

import { Suspense } from 'react';
import { useSearchParams, notFound } from 'next/navigation';
import Image from 'next/image';
import React from 'react';

interface BarcodeItem {
    id: string;
    name: string;
    sku: string;
    price: number;
    barcode: string;
}

function BarcodePrintContent() {
  const searchParams = useSearchParams();
  const data = searchParams.get('data');
  const bypass = searchParams.get('bypass') === 'true';
  
  if (!data) {
    notFound();
  }

  const itemsToPrint: BarcodeItem[] = JSON.parse(decodeURIComponent(data));

  React.useEffect(() => {
    // Trigger print dialog after a short delay
    setTimeout(() => {
        window.print();
    }, 500);
  }, []);

  return (
    <div className="bg-white text-black p-0 m-0 font-sans">
      <div className="grid grid-cols-2 gap-x-[1mm] gap-y-0">
        {bypass && (
            <div className="w-[38mm] h-[25mm] p-[2mm] border-none"></div>
        )}
        {itemsToPrint.map(item => (
            <div key={item.id} className="w-[38mm] h-[25mm] p-[2mm] border border-dashed border-gray-300 flex flex-col justify-center items-center text-[8pt] leading-tight">
                <p className="font-bold text-center truncate w-full">{item.name}</p>
                <p className="text-center w-full">{item.sku}</p>
                {/* Barcode representation */}
                <Image 
                    src={`https://barcode.tec-it.com/barcode.ashx?data=${item.barcode}&code=Code128&dpi=96`} 
                    alt={`Barcode for ${item.sku}`}
                    width={120}
                    height={20}
                    style={{ height: '15mm', width: 'auto', maxHeight: '15mm' }}
                />
                <p className="font-bold text-center text-[10pt] w-full">Rs. {item.price.toFixed(2)}</p>
            </div>
        ))}
      </div>
    </div>
  );
}


export default function BarcodePrintPage() {
    return (
        <Suspense fallback={<div>Loading barcodes...</div>}>
            <BarcodePrintContent />
        </Suspense>
    )
}
