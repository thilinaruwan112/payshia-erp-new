
'use client';

import { Suspense } from 'react';
import { useSearchParams, notFound } from 'next/navigation';
import Image from 'next/image';
import React from 'react';
import { cn } from '@/lib/utils';

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
  const paperSize = searchParams.get('size') || '50x25';
  const columns = parseInt(searchParams.get('columns') || '1', 10);
  const locationName = searchParams.get('locationName');
  
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
  
  // 2in = 50.8mm, 1in = 25.4mm
  const itemWidth = '50.8mm';
  const itemHeight = '26mm';


  return (
    <div className="bg-white text-black p-0 m-0 font-sans">
      <div className={cn("grid gap-x-[1mm] gap-y-[2mm]", columns === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
        {bypass && (
            <div style={{ width: itemWidth, height: itemHeight }} className="p-[2mm] border-none"></div>
        )}
        {itemsToPrint.map((item, index) => (
            <div key={`${item.id}-${index}`} style={{ width: itemWidth, height: itemHeight }} className="p-[1.5mm] border border-dashed border-gray-300 flex flex-col justify-center items-center text-[8pt] leading-tight overflow-hidden">
                <p className="font-bold text-center truncate w-full">{item.name}</p>
                 <p className="font-semibold text-center truncate w-full">Rs. {item.price.toFixed(2)}</p>
                <div className="w-full text-center my-1">
                  <Image 
                      src={`https://barcode.tec-it.com/barcode.ashx?data=${item.barcode}&code=Code128&dpi=96&imagetype=Png`}
                      alt={`Barcode for ${item.sku}`}
                      width={180}
                      height={35}
                      className="w-full h-auto max-h-[12mm]"
                      style={{ objectFit: 'contain' }}
                      unoptimized // Prevents Next.js image optimization which can interfere with external barcode services
                  />
                </div>
                {locationName && <p className="font-semibold text-[7pt] text-center w-full truncate">{locationName}</p>}
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
