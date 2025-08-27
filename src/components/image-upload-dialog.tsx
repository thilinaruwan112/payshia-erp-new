
"use client";

import React, { useState, useCallback } from 'react';
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

interface ImageUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
  companyId: number | null;
  onUploadComplete: () => void;
}

export function ImageUploadDialog({ isOpen, onOpenChange, productId, companyId, onUploadComplete }: ImageUploadDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.gif', '.webp'] },
  });
  
  const removeFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  const handleUpload = async () => {
    if (!productId || !companyId || files.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Upload Error',
        description: 'Missing product ID, company ID, or files.',
      });
      return;
    }
    setIsUploading(true);

    const formData = new FormData();
    formData.append('product_id', productId);
    formData.append('company_id', String(companyId));
    formData.append('created_by', 'admin'); // Replace with actual user later

    files.forEach(file => {
      formData.append('images[]', file);
    });

    try {
      const response = await fetch('https://server-erp.payshia.com/product-images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Image upload failed');
      }

      toast({
        title: 'Upload Successful',
        description: `${files.length} image(s) have been uploaded for product ID ${productId}.`,
      });
      onUploadComplete();
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Product Images</DialogTitle>
          <DialogDescription>
            Add one or more images for the product. Drag and drop or click to browse.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div
            {...getRootProps()}
            className={`p-12 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              {isDragActive ? 'Drop the files here...' : "Drag 'n' drop some files here, or click to select files"}
            </p>
          </div>

          {files.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Image Previews</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {files.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square w-full rounded-md overflow-hidden border">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${file.name}`}
                        className="w-full h-full object-cover"
                        onLoad={() => URL.revokeObjectURL(file.name)}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(file)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="text-xs text-muted-foreground truncate mt-1">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isUploading}>
              Skip
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || files.length === 0}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload {files.length > 0 ? `(${files.length})` : ''}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
