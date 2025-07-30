
"use client";

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Menu, LogOut, User as UserIcon, Shield, LayoutDashboard, KeyRound, MessageSquare, ListChecks } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { ThemeToggle } from './theme-toggle';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from 'next/image';
import { useSiteSettings, useChatThreads, useUser } from '@/hooks/use-data';
import { Badge } from './ui/badge';


function UserNav({ user, logout }: { user: User, logout: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.profilePictureUrl} alt={user.fullName} data-ai-hint="person" />
            <AvatarFallback>{user.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {user.role === 'student' && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/dashboard"><LayoutDashboard />Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile"><UserIcon />Update Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard?tab=reports"><ListChecks />My Reports</Link>
              </DropdownMenuItem>
            </>
          )}
          {user.role === 'admin' && (
            <>
            <DropdownMenuItem asChild>
              <Link href="/admin"><Shield />Admin Panel</Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
                <Link href="/admin/settings"><UserIcon />Update Profile</Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const GuestNavLinks = ({ isMobile = false }: { isMobile?: boolean }) => {
  const linkClass = isMobile ? "w-full justify-start text-lg py-4" : "";
  const Wrapper = isMobile ? SheetClose : React.Fragment;

  return (
     <nav className={isMobile ? "flex flex-col gap-4 mt-8" : "hidden md:flex items-center gap-1 md:gap-2"}>
        <Wrapper>
            <Button variant="ghost" asChild className={linkClass}>
              <Link href="/login">Login</Link>
            </Button>
        </Wrapper>
        <Wrapper>
            <Button asChild className={linkClass}>
              <Link href="/signup">Sign Up</Link>
            </Button>
        </Wrapper>
     </nav>
  )
}

const MobileNavLinks = ({ user, logout }: { user: User, logout: () => void }) => {
  const linkClass = "w-full justify-start text-lg py-4";
  
  return (
    <nav className="flex flex-col gap-4 mt-8">
        {user.role === 'student' ? (
        <>
            <SheetClose asChild>
                <div className="flex items-center gap-4 border-b pb-4">
                     <Avatar className="h-12 w-12">
                        <AvatarImage src={user.profilePictureUrl} alt={user.fullName} data-ai-hint="person" />
                        <AvatarFallback>{user.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{user.fullName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            </SheetClose>
            <SheetClose asChild>
                <Button variant="ghost" asChild className={linkClass}><Link href="/dashboard"><LayoutDashboard />Dashboard</Link></Button>
            </SheetClose>
             <SheetClose asChild>
                 <Button variant="ghost" asChild className={linkClass}><Link href="/contact"><MessageSquare />Live Chat</Link></Button>
             </SheetClose>
             <SheetClose asChild>
                 <Button variant="ghost" asChild className={linkClass}><Link href="/dashboard?tab=reports"><ListChecks />My Reports</Link></Button>
             </SheetClose>
        </>
        ) : (
        <>
            <SheetClose asChild>
                 <Button variant="ghost" asChild className={linkClass}><Link href="/admin"><Shield />Admin Panel</Link></Button>
            </SheetClose>
             <SheetClose asChild>
                <Button variant="ghost" asChild className={linkClass}><Link href="/admin/reports"><ListChecks />Reports</Link></Button>
             </SheetClose>
              <SheetClose asChild>
                <Button variant="ghost" asChild className={linkClass}><Link href="/admin/chat"><MessageSquare />Student Chat</Link></Button>
             </SheetClose>
        </>
        )}
        <SheetClose asChild>
            <Button onClick={logout} className={linkClass}><LogOut />Logout</Button>
        </SheetClose>
    </nav>
  )
}

export function Header() {
  const { loading } = useAuth();
  const user = useUser();
  const { logout } = useAuth();
  const { settings } = useSiteSettings();
  const { data: chatThreads } = useChatThreads();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const unreadChatCount = React.useMemo(() => {
    if (user?.role !== 'admin' || !chatThreads) return 0;
    return chatThreads.filter(t => !t.seenByAdmin).length;
  }, [user, chatThreads]);

  return (
    <header className="bg-card/50 backdrop-blur-lg border-b sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href={loading ? "/" : (user ? (user.role === 'admin' ? '/admin' : '/dashboard') : "/")} className="flex items-center gap-2 text-xl font-bold">
          {(settings && settings.logoUrl) ? (
            <Image src={settings.logoUrl} alt="UdaanSarthi Logo" width={160} height={40} className="object-contain" priority />
          ) : (
            <Skeleton className="h-10 w-40" />
          )}
        </Link>
        
        {loading ? (
          <Skeleton className="h-10 w-24" />
        ) : (
          <div className="flex items-center gap-2">
            {/* Desktop and Mobile Live Chat */}
            {user && user.role === 'student' && (
              <Button variant="ghost" asChild className="hidden sm:inline-flex"><Link href="/contact">Live Chat</Link></Button>
            )}
             {user && user.role === 'admin' && (
              <Button variant="ghost" asChild className="hidden md:inline-flex relative">
                <Link href="/admin/chat">
                    Student Chat
                    {unreadChatCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">{unreadChatCount}</Badge>
                    )}
                </Link>
              </Button>
            )}

            {/* Desktop Guest Links */}
            {!user && <div className="hidden md:flex"><GuestNavLinks /></div>}
            
            <ThemeToggle />

            {user ? (
                 <div className="flex items-center gap-2">
                   {user.role === 'student' && (
                     <div className="md:hidden">
                       <UserNav user={user} logout={logout} />
                     </div>
                   )}
                   <div className="hidden md:flex">
                     <UserNav user={user} logout={logout} />
                   </div>
                 </div>
             ) : null}


            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                      <Button variant="outline" size="icon">
                          <Menu />
                          <span className="sr-only">Open menu</span>
                      </Button>
                  </SheetTrigger>
                  <SheetContent>
                      <SheetHeader>
                          <SheetTitle>Menu</SheetTitle>
                      </SheetHeader>
                      {user ? <MobileNavLinks user={user} logout={() => {setIsSheetOpen(false); logout();}} /> : <GuestNavLinks isMobile />}
                  </SheetContent>
              </Sheet>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
