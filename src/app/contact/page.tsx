
"use client";

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { SarthiBotPanel } from '@/components/sarthi-bot-panel';
import { StudentChatPanel } from '@/components/student-chat-panel';
import { useSiteSettings } from '@/hooks/use-data';
import { useAdminUser } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BrainCircuit, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FullScreenImageViewer } from '@/components/full-screen-image-viewer';

function ContactPageContent() {
    const { settings } = useSiteSettings();
    const { adminUser } = useAdminUser();
    const [activeView, setActiveView] = useState<'list' | 'bot' | 'admin'>('list');
    const [viewingImage, setViewingImage] = useState<string | null>(null);

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

    if (!settings) return null;
    
    const renderListView = () => (
         <Card className="w-full max-w-md mx-auto rounded-2xl shadow-lg">
            <CardContent className="p-4 space-y-3">
                {chatContacts.map(contact => (
                    <div
                        key={contact.id}
                        onClick={() => setActiveView(contact.id)}
                        className={cn(
                            "flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300",
                           "hover:bg-muted/50 hover:shadow-md"
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
    );

    const renderChatView = () => (
        <div className="h-full w-full max-w-4xl mx-auto flex flex-col">
             <div className="mb-4">
                 <Button variant="ghost" onClick={() => setActiveView('list')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Selection
                </Button>
            </div>
            <div className="h-full min-h-[70vh] rounded-2xl shadow-lg overflow-hidden bg-background flex-grow">
                {activeView === 'admin' && <StudentChatPanel className="h-full border-none shadow-none rounded-none bg-transparent" />}
                {activeView === 'bot' && <SarthiBotPanel className="h-full border-none shadow-none rounded-none bg-transparent" />}
            </div>
        </div>
    );


    return (
        <>
            <div className="h-full flex-grow flex flex-col">
                {activeView === 'list' ? renderListView() : renderChatView()}
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
