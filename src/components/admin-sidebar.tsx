
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FilePenLine, 
  Users, 
  MessageSquare, 
  Flag, 
  Settings, 
  Menu, 
  LogOut, 
  User as UserIcon,
  Home,
  Star,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from 'next/image';
import { Badge } from './ui/badge';
import { useChatThreads, useSiteSettings } from '@/hooks/use-data';
import type { User } from '@/lib/types';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, notification: null },
  { href: '/admin/tests', label: 'Manage Tests', icon: FilePenLine, notification: null },
  { href: '/admin/students', label: 'Manage Students', icon: Users, notification: null },
  { href: '/admin/chat', label: 'Student Chat', icon: MessageSquare, notification: 'chat' },
  { href: '/admin/reports', label: 'Reports', icon: Flag, notification: null },
  { href: '/admin/feedback', label: 'Feedback', icon: Star, notification: null },
  { href: '/admin/settings', label: 'Settings', icon: Settings, notification: null },
];

const NavLink = ({ item, isCollapsed, notificationCount }: { item: typeof navItems[0], isCollapsed: boolean, notificationCount: number }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Button
      asChild
      variant={isActive ? 'secondary' : 'ghost'}
      className={cn("w-full justify-start gap-3", isCollapsed && "justify-center")}
    >
      <Link href={item.href}>
        <item.icon className="h-5 w-5 shrink-0" />
        {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
        {item.notification && notificationCount > 0 && <Badge>{notificationCount}</Badge>}
      </Link>
    </Button>
  );
};

const MobileNavLink = ({ item, notificationCount }: { item: typeof navItems[0], notificationCount: number }) => {
   const pathname = usePathname();
   const isActive = pathname === item.href;

  return (
    <SheetClose asChild>
      <Button
        asChild
        variant={isActive ? 'secondary' : 'ghost'}
        className="w-full justify-start gap-4 text-base p-4 h-auto"
      >
        <Link href={item.href}>
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {item.notification && notificationCount > 0 && <Badge>{notificationCount}</Badge>}
        </Link>
      </Button>
    </SheetClose>
  );
};

function AdminProfileDropdown({ user, logout }: { user: User, logout: () => void }) {
    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/50">
                        {user.profilePictureUrl ? (
                            <AvatarImage src={user.profilePictureUrl} alt={user.fullName} />
                        ): null}
                        <AvatarFallback>{user.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.fullName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/admin/settings"><UserIcon className="mr-2 h-4 w-4" />Edit Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/"><Home className="mr-2 h-4 w-4" />View Site</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function AdminSidebar({ user }: { user: User | null }) {
  const [isCollapsed] = React.useState(false);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { logout } = useAuth();
  const { settings } = useSiteSettings();
  const { data: chatThreads } = useChatThreads();

  const unreadChatCount = useMemo(() => {
    if (!chatThreads) return 0;
    return chatThreads.filter(t => !t.seenByAdmin).length;
  }, [chatThreads]);

  return (
    <>
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-lg md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0">
                    <div className="flex h-16 items-center border-b px-4">
                        <Link href="/admin" onClick={() => setIsSheetOpen(false)}>
                            {(settings && settings.logoUrl) ? (
                                <Image src={settings.logoUrl} alt="UdaanSarthi Logo" width={140} height={35} />
                            ) : (
                                <h1 className="text-xl font-bold">UdaanSarthi</h1>
                            )}
                        </Link>
                    </div>
                    <nav className="grid gap-1 p-2 text-lg font-medium mt-4">
                        {navItems.map(item => <MobileNavLink key={item.href} item={item} notificationCount={item.notification === 'chat' ? unreadChatCount : 0} />)}
                    </nav>
                </SheetContent>
            </Sheet>
             <h1 className="text-lg font-semibold">Admin</h1>
            {user && <AdminProfileDropdown user={user} logout={logout} />}
        </header>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-col fixed inset-y-0 z-50 w-64 border-r bg-card/60 p-4 backdrop-blur-lg">
             <div className="flex h-16 items-center mb-4 px-2">
                <Link href="/admin">
                     {(settings && settings.logoUrl) ? (
                        <Image src={settings.logoUrl} alt="UdaanSarthi Logo" width={160} height={40} />
                    ) : (
                        <h1 className="text-2xl font-bold">UdaanSarthi</h1>
                    )}
                </Link>
            </div>
            <nav className="flex flex-col gap-1">
                 {navItems.map(item => <NavLink key={item.href} item={item} isCollapsed={isCollapsed} notificationCount={item.notification === 'chat' ? unreadChatCount : 0} />)}
            </nav>
             <div className="mt-auto flex items-center gap-2 p-2 rounded-lg">
                {user && <>
                    <Avatar className="h-10 w-10">
                        {user?.profilePictureUrl ? <AvatarImage src={user.profilePictureUrl} alt={user?.fullName} />: null }
                        <AvatarFallback>{user?.fullName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                        <p className="font-semibold text-sm">{user?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user?.role}</p>
                    </div>
                </>}
                <Button variant="ghost" size="icon" onClick={logout}><LogOut className="h-4 w-4"/></Button>
            </div>
        </div>
    </>
  );
}
