
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProductVariant, ProductImage } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

interface ImageUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
  productVariants: ProductVariant[];
  companyId: number | null;
  onUploadComplete: () => void;
}

export function ImageUploadDialog({ isOpen, onOpenChange, productId, productVariants, companyId, onUploadComplete }: ImageUploadDialogProps) {
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadedImages, setUploadedImages] = useState<ProductImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [imageType, setImageType] = useState<string>('other');
  const { toast } = useToast();

  const fetchExistingImages = useCallback(async () => {
    if (!productId || !companyId) return;

    let allImages: ProductImage[] = [];
    // If productVariants is empty, it means it's a simple product.
    // The variant ID might be the same as the product ID or based on a default variant.
    // Let's create a temporary variant object to fetch images for the base product.
    const variantsToFetch = productVariants?.length > 0 
      ? productVariants 
      : [{ id: productId, sku: 'default' }]; 

    try {
        for (const variant of variantsToFetch) {
            const response = await fetch(`https://server-erp.payshia.com/product-images/get/img?company_id=${companyId}&product_id=${productId}&product_variant_id=${variant.id}`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    allImages = [...allImages, ...data];
                }
            } else {
                 const errorData = await response.json();
                 if (errorData.error !== "No records found") {
                    console.error(`Failed to fetch images for variant ${variant.id}:`, errorData.message || response.statusText);
                 }
            }
        }
        // Deduplicate images in case the API returns the same image for different variant checks
        const uniqueImages = Array.from(new Map(allImages.map(img => [img.id, img])).values());
        setUploadedImages(uniqueImages);

    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not load existing product images." });
    }
}, [productId, companyId, productVariants, toast]);


  useEffect(() => {
    if (isOpen) {
      if (productVariants && productVariants.length > 0) {
        setSelectedVariantId(productVariants[0].id);
      } else if (productId) {
        // For products without variants, use the product ID as the variant ID
        setSelectedVariantId(productId);
      } else {
         setSelectedVariantId('');
      }
      setFileToUpload(null);
      fetchExistingImages();
    } else {
      setUploadedImages([]);
    }
  }, [productVariants, isOpen, fetchExistingImages, productId]);


  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
        setFileToUpload(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'image/*': ['.jpeg', '.png', '.gif', '.webp'] },
  });
  
  const removeFile = () => {
    setFileToUpload(null);
  };

  const handleUpload = async () => {
    if (!productId || !companyId || !fileToUpload || !selectedVariantId) {
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: 'Please select a variant (if applicable), an image type, and a file to upload.',
      });
      return;
    }
    setIsUploading(true);

    const formData = new FormData();
    formData.append('product_id', productId);
    formData.append('product_variant_id', selectedVariantId);
    formData.append('company_id', String(companyId));
    formData.append('image_type', imageType);
    formData.append('created_by', 'admin');
    formData.append('images[]', fileToUpload);

    try {
      const response = await fetch('https://server-erp.payshia.com/product-images/upload-multiple', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Image upload failed');
      }
      
      const newImageData: { images: ProductImage[] } = await response.json();

      toast({
        title: 'Upload Successful',
        description: `Image "${fileToUpload.name}" has been uploaded.`,
      });
      
      if (newImageData.images && newImageData.images.length > 0) {
        setUploadedImages(prev => [...prev, ...newImageData.images]);
      }
      
      setFileToUpload(null);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const hasVariants = productVariants && productVariants.length > 0;
  const isUploadDisabled = isUploading || !fileToUpload || (hasVariants && !selectedVariantId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Upload Product Images</DialogTitle>
          <DialogDescription>
            Add images for your product. Uploaded images will appear in the gallery below.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-lg">
                <div
                    {...getRootProps()}
                    className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors flex flex-col justify-center items-center h-48 ${
                    isDragActive ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'
                    }`}
                >
                    <input {...getInputProps()} />
                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                    {isDragActive ? 'Drop the file here...' : "Drag & drop or click to select a file"}
                    </p>
                </div>
                
                {fileToUpload && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <img src={URL.createObjectURL(fileToUpload)} alt="Preview" className="h-20 w-20 rounded-md object-cover border" />
                                <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeFile}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-sm font-medium truncate flex-1">{fileToUpload.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             {hasVariants && (
                                <div className="space-y-2">
                                    <Label htmlFor="variant-select">Variant</Label>
                                    <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                                        <SelectTrigger id="variant-select">
                                            <SelectValue placeholder="Choose a variant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {productVariants.map(variant => (
                                                <SelectItem key={variant.id} value={variant.id}>
                                                    {variant.sku} {variant.color && `- ${variant.color}`} {variant.size && `- ${variant.size}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="image-type-select">Image Type</Label>
                                <Select value={imageType} onValueChange={setImageType}>
                                    <SelectTrigger id="image-type-select">
                                        <SelectValue placeholder="Choose an image type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="front img">Front Image</SelectItem>
                                        <SelectItem value="2nd image">2nd Image</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <Button onClick={handleUpload} disabled={isUploadDisabled} className="w-full">
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upload Image
                        </Button>
                    </div>
                )}
           </div>

          {uploadedImages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Uploaded Images</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square w-full rounded-md overflow-hidden border">
                      <img
                        src={`${process.env.NEXT_PUBLIC_IMAGE_PROVIDER_URL}${image.img_url}`}
                        alt={`Uploaded image ${image.id}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center p-1 rounded-b-md">
                        {image.image_type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onUploadComplete()}>
              Done
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
