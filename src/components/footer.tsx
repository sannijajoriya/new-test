
"use client";

import Link from 'next/link';
import { Twitter, Instagram, Mail } from 'lucide-react';
import Image from 'next/image';
import { useSiteSettings } from '@/hooks/use-data';
import { Skeleton } from './ui/skeleton';

export function Footer() {
  const { settings } = useSiteSettings();
  
  return (
    <footer className="bg-card/30 border-t backdrop-blur-lg mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold mb-2">
              {(settings && settings.logoUrl) ? (
                <Image src={settings.logoUrl} alt="UdaanSarthi Logo" width={160} height={40} className="object-contain" />
              ) : (
                <Skeleton className="h-10 w-40" />
              )}
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm font-semibold">
              उड़ान आपकी, साथ हमारा
            </p>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-semibold mb-2">Quick Links</h4>
            <nav className="flex flex-col gap-1 text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <Link href="/dashboard" className="hover:text-primary transition-colors">Test Series</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
              <Link href="/feedback" className="hover:text-primary transition-colors">Give Feedback</Link>
              <Link href="/admin" className="hover:text-primary transition-colors">Admin Login</Link>
            </nav>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-semibold mb-2">Connect With Us</h4>
            <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram /></Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter /></Link>
            </div>
            <div className="mt-4 flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href="mailto:udaansarthi@gmail.com" className="hover:text-primary transition-colors">udaansarthi@gmail.com</a>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} UdaanSarthi. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
