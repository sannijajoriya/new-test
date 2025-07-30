
"use client";

import { useState, useEffect } from 'react';
import { useSiteSettings } from '@/hooks/use-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';


const SESSION_STORAGE_KEY = 'udaanSarthiNewsBannerClosed';

export function NewsBannerPopup() {
    const { settings } = useSiteSettings();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (!settings || !settings.isNewsBannerEnabled || !settings.newsBannerImageUrl) {
            setIsOpen(false);
            return;
        }

        if (settings.newsBannerDisplayRule === 'session') {
            const hasBeenClosed = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (hasBeenClosed) {
                setIsOpen(false);
                return;
            }
        }
        
        const timer = setTimeout(() => setIsOpen(true), 500);
        return () => clearTimeout(timer);

    }, [settings]);

    const handleClose = () => {
        setIsOpen(false);
        if (settings?.newsBannerDisplayRule === 'session' && typeof window !== 'undefined') {
            sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
        }
    };

    if (!settings) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl p-0 border-primary/50 border-2 shadow-2xl shadow-primary/30 data-[state=open]:animate-in data-[state=open]:zoom-in-90 data-[state=open]:slide-in-from-bottom-1/2">
                 <DialogHeader className="sr-only">
                    <DialogTitle>News and Updates</DialogTitle>
                 </DialogHeader>
                 <DialogClose asChild>
                     <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white" onClick={handleClose}>
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                    </Button>
                 </DialogClose>
                
                <div className="relative aspect-[2/1] w-full">
                    {settings.newsBannerImageUrl && (
                        <Image 
                            src={settings.newsBannerImageUrl} 
                            alt={settings.newsBannerTitle || 'News Banner'} 
                            layout="fill" 
                            objectFit="cover"
                            className="rounded-t-lg"
                        />
                    )}
                </div>
                {(settings.newsBannerTitle || settings.newsBannerLink) && (
                    <div className="p-6 text-center space-y-4">
                        {settings.newsBannerTitle && (
                            <h2 className="text-2xl font-bold">{settings.newsBannerTitle}</h2>
                        )}
                        {settings.newsBannerLink && (
                             <Button asChild size="lg" onClick={handleClose}>
                                <Link href={settings.newsBannerLink}>Learn More</Link>
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
