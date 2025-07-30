
'use client';

import { useLoading } from '@/hooks/use-loading';
import { useSiteSettings } from '@/hooks/use-data';
import Image from 'next/image';

export function Loader() {
  const { isLoading } = useLoading();
  const { settings } = useSiteSettings();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/90 backdrop-blur-md animate-fade-in">
      <div className="relative flex flex-col items-center justify-center space-y-8 text-center">
        {/* Logo at the top */}
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
           {(settings && settings.logoUrl) && (
            <Image
                src={settings.logoUrl}
                alt="UdaanSarthi Logo"
                width={200}
                height={50}
                className="object-contain"
                priority
              />
           )}
        </div>

        {/* Bouncing dots loader */}
        <div className="flex space-x-2" aria-label="Loading">
          <div className="h-3 w-3 rounded-full bg-primary bounce-dot-1"></div>
          <div className="h-3 w-3 rounded-full bg-primary bounce-dot-2"></div>
          <div className="h-3 w-3 rounded-full bg-primary bounce-dot-3"></div>
        </div>
        
        <p className="text-muted-foreground animate-pulse">Initializing Interface...</p>
      </div>
    </div>
  );
}
