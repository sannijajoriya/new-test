
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageCropperDialog } from '@/components/image-cropper-dialog';
import { cn } from '@/lib/utils';
import { Scissors, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  value: string; // data URL or existing URL
  onChange: (value: string) => void;
  onCrop?: (value: string) => void;
  label: string;
  description?: string;
  aspect?: number;
  cropShape?: 'rect' | 'round';
  className?: string;
}

export function ImageUploader({ value, onChange, onCrop, label, description, aspect, cropShape = 'rect', className }: ImageUploaderProps) {
  const { toast } = useToast();
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          title: 'Image too large',
          description: 'Please upload an image smaller than 4MB.',
          variant: 'destructive',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // If onCrop is provided, it means we should open the cropper immediately
        if (onCrop) {
          setImageToCrop(result);
          setIsCropperOpen(true);
        } else {
          // Otherwise, just update the value (e.g. for full-size uploads)
          onChange(result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset file input to allow re-selection
  };

  const handleCropComplete = (croppedImage: string) => {
    if (onCrop) {
      onCrop(croppedImage);
    } else {
      onChange(croppedImage);
    }
    setIsCropperOpen(false);
  };

  const handleManualCropClick = () => {
    if (value) {
      setImageToCrop(value);
      setIsCropperOpen(true);
    }
  };

  return (
    <>
      <div className={cn('space-y-4', className)}>
        <Label>{label}</Label>
        {value ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Image
              src={value}
              alt="Image preview"
              width={120}
              height={120}
              className={cn(
                'object-contain border bg-muted',
                cropShape === 'round' ? 'rounded-full w-24 h-24' : 'rounded-md w-40 h-auto'
              )}
            />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleManualCropClick}>
                <Scissors /> Crop
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => onChange('')}>
                <Trash2 /> Remove
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Input id={`file-upload-${label}`} type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleFileChange} />
          </div>
        )}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <ImageCropperDialog
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageSrc={imageToCrop}
        aspect={aspect}
        cropShape={cropShape}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}

    