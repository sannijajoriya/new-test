
"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useSiteSettings, useAllUsers, useUser } from "@/hooks/use-data";
import Image from "next/image";
import { StudentChatPanel } from "./student-chat-panel";
import { useState, useEffect } from "react";
import { SarthiBotPanel } from './sarthi-bot-panel';
import { MessageSquare, BrainCircuit, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function FloatingChatButton() {
    const user = useUser();
    const { settings } = useSiteSettings();
    const { allUsers } = useAllUsers();
    const [isOpen, setIsOpen] = useState(false);
    const [activeView, setActiveView] = useState<'list' | 'bot' | 'admin'>('list');
    
    const adminUser = allUsers?.find(u => u.role === 'admin');

    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => setActiveView('list'), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);
    
    if (user?.role !== 'student' || !settings) {
        return null;
    }

    const chatContacts = [
        {
            id: 'bot' as const,
            name: settings?.botName || 'UdaanSarthi AI',
            avatar: settings?.botAvatarUrl,
            fallback: <BrainCircuit />,
            status: '🤖 AI Assistant'
        },
        {
            id: 'admin' as const,
            name: adminUser?.fullName || 'Admin',
            avatar: adminUser?.profilePictureUrl,
            fallback: adminUser?.fullName?.charAt(0) || 'A',
            status: 'Typically replies within a few hours'
        }
    ];

    const renderListView = () => (
        <>
            <SheetHeader className="p-4 border-b">
                <SheetTitle>Contact Support</SheetTitle>
                <SheetDescription>
                    Choose who you want to talk to.
                </SheetDescription>
            </SheetHeader>
            <div className="p-4 space-y-3">
                {chatContacts.map(contact => (
                    <div
                        key={contact.id}
                        onClick={() => setActiveView(contact.id)}
                        className="flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-muted"
                    >
                        <Avatar className="h-12 w-12 border-2 border-primary/30">
                            <AvatarImage src={contact.avatar} alt={contact.name} />
                            <AvatarFallback>{contact.fallback}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{contact.status}</p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );

    const renderChatView = () => (
        <>
            <div className="p-3 border-b flex flex-row items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveView('list')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                         <AvatarImage src={activeView === 'bot' ? settings.botAvatarUrl : adminUser?.profilePictureUrl} />
                         <AvatarFallback>
                            {activeView === 'bot' ? <BrainCircuit /> : (adminUser?.fullName?.charAt(0) || 'A')}
                         </AvatarFallback>
                    </Avatar>
                    <SheetTitle className="text-base">{activeView === 'bot' ? settings.botName : adminUser?.fullName}</SheetTitle>
                </div>
            </div>
            <div className="flex-grow overflow-hidden">
                {activeView === 'admin' && <StudentChatPanel className="h-full border-none shadow-none rounded-none" showHeader={false} />}
                {activeView === 'bot' && <SarthiBotPanel className="h-full border-none shadow-none rounded-none" showHeader={false} />}
            </div>
        </>
    );
    
    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                 <Button
                    variant="default"
                    className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full p-0 shadow-lg transition-transform duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-primary/50"
                >
                    {settings.logoUrl ? (
                        <Image
                            src={settings.logoUrl}
                            alt="Chat with UdaanSarthi"
                            width={60}
                            height={60}
                            className="rounded-full object-contain p-2"
                        />
                    ) : (
                        <MessageSquare />
                    )}
                     <span className="sr-only">Open Live Chat</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 border-0 flex flex-col h-full">
                <SheetHeader className="sr-only">
                    <SheetTitle>Live Chat Panel</SheetTitle>
                    <SheetDescription>
                        You can switch between chatting with an admin or our AI assistant, UdaanSarthi Bot.
                    </SheetDescription>
                </SheetHeader>
               {activeView === 'list' ? renderListView() : renderChatView()}
            </SheetContent>
        </Sheet>
    );
}
