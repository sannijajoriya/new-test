
"use client";

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { StudentChatPanel } from '@/components/student-chat-panel';
import { SarthiBotPanel } from '@/components/sarthi-bot-panel';
import { useSiteSettings, useAllUsers, useUser } from '@/hooks/use-data';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FullScreenImageViewer } from '@/components/full-screen-image-viewer';

function ContactPageContent() {
    const { settings } = useSiteSettings();
    const user = useUser();
    const { allUsers } = useAllUsers();
    const [selectedChat, setSelectedChat] = useState<'bot' | 'admin'>('bot');
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const adminUser = allUsers?.find(u => u.role === 'admin');

    const chatContacts = [
        {
            id: 'bot',
            name: settings?.botName || 'UdaanSarthi AI',
            avatar: settings?.botAvatarUrl,
            fallback: <BrainCircuit />,
            status: '🤖 AI Assistant'
        },
        {
            id: 'admin',
            name: adminUser?.fullName || 'Admin',
            avatar: adminUser?.profilePictureUrl,
            fallback: adminUser?.fullName?.charAt(0) || 'A',
            status: '🟢 Online'
        }
    ];

    if (!settings || !user) return null;

    return (
        <>
            <div className="h-full flex-grow md:grid md:grid-cols-12 gap-6 space-y-6 md:space-y-0">
                {/* Left Panel: Chat List */}
                <div className="md:col-span-4 lg:col-span-3">
                    <Card className="rounded-2xl shadow-lg h-full">
                        <CardContent className="p-4 space-y-3">
                            {chatContacts.map(contact => (
                                <div
                                    key={contact.id}
                                    onClick={() => setSelectedChat(contact.id as 'bot' | 'admin')}
                                    className={cn(
                                        "flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300",
                                        selectedChat === contact.id
                                            ? "bg-primary/20 shadow-inner"
                                            : "hover:bg-muted/50 hover:shadow-md"
                                    )}
                                >
                                    <Avatar className="h-12 w-12 border-2 border-primary/30" onClick={(e) => { e.stopPropagation(); if (contact.avatar) setViewingImage(contact.avatar); }}>
                                        <AvatarImage src={contact.avatar} alt={contact.name} />
                                        <AvatarFallback>{contact.fallback}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold">{contact.name}</p>
                                        <p className="text-xs text-muted-foreground">{contact.status}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel: Chat Window */}
                <div className="md:col-span-8 lg:col-span-9 h-full min-h-[70vh] md:min-h-0">
                    <div className="h-full rounded-2xl shadow-lg overflow-hidden bg-background">
                        {selectedChat === 'admin' && <StudentChatPanel className="h-full border-none shadow-none rounded-none bg-transparent" />}
                        {selectedChat === 'bot' && <SarthiBotPanel className="h-full border-none shadow-none rounded-none bg-transparent" />}
                    </div>
                </div>
            </div>

            <FullScreenImageViewer
                isOpen={!!viewingImage}
                onClose={() => setViewingImage(null)}
                imageUrl={viewingImage}
                alt="Profile Picture"
            />
        </>
    );
}

export default function ContactPage() {
    return (
        <AuthGuard role="student">
            <div className="h-full flex flex-col">
                <ContactPageContent />
            </div>
        </AuthGuard>
    );
}
