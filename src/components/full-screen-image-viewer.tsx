"use client";

import { Dialog, DialogContent } from '@/components/ui/dialog';
import Image from 'next/image';

interface FullScreenImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  alt: string;
}

export function FullScreenImageViewer({ isOpen, onClose, imageUrl, alt }: FullScreenImageViewerProps) {
  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 bg-transparent border-none w-auto max-w-4xl h-auto flex items-center justify-center shadow-none">
        <Image
          src={imageUrl}
          alt={alt}
          width={1024}
          height={1024}
          className="object-contain rounded-lg max-h-[90vh] w-auto"
        />
      </DialogContent>
    </Dialog>
  );
}
