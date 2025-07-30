
"use client";

import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import type { ChatThread, DirectMessage } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Send, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FullScreenImageViewer } from './full-screen-image-viewer';
import { useSiteSettings, useChatThreads, useAdminUser, useUser } from '@/hooks/use-data';
import { Skeleton } from './ui/skeleton';

const chatSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
});
type ChatForm = z.infer<typeof chatSchema>;

function StudentChatPanelComponent({ className, showHeader = true }: { className?: string; showHeader?: boolean }) {
    const user = useUser();
    const { settings } = useSiteSettings();
    const { toast } = useToast();
    const { data: chatThreads, updateItem: updateChatThread, deleteItem: deleteChatThread } = useChatThreads();
    const { adminUser } = useAdminUser();
    
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const thread = useMemo(() => {
        if (!user || !chatThreads) return null;
        return chatThreads.find(t => t.studentId === user.id);
    }, [user, chatThreads]);
    

    const form = useForm<ChatForm>({
        resolver: zodResolver(chatSchema),
        defaultValues: { message: "" },
    });

    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollableView = scrollAreaRef.current.querySelector('div');
            if (scrollableView) {
                 scrollableView.scrollTop = scrollableView.scrollHeight;
            }
        }
    }, [thread?.messages]);


    const handleSendMessage = async (data: ChatForm) => {
        if (!user || !settings) return;
        try {
            const newMessage: DirectMessage = {
                sender: 'student',
                text: data.message,
                timestamp: Date.now(),
            };

            const autoReply: DirectMessage = {
                sender: 'admin',
                text: settings.adminChatAutoReply,
                timestamp: Date.now() + 1000, // a bit later to feel more natural
            };

            let updatedThread;

            if (!thread) {
                // This is the first message from this user, create a new thread
                updatedThread = {
                    id: user.id,
                    studentId: user.id,
                    studentName: user.fullName,
                    messages: [newMessage, autoReply],
                    lastMessageAt: autoReply.timestamp, 
                    seenByAdmin: false,
                };
            } else {
                // Thread exists, add the new message and the auto-reply
                updatedThread = {
                    ...thread,
                    messages: [...thread.messages, newMessage, autoReply],
                    lastMessageAt: autoReply.timestamp,
                    seenByAdmin: false,
                };
            }

            await updateChatThread(updatedThread);
            form.reset();

        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
        }
    };
    
    const handleClearChat = async () => {
        if (!user) return;
        try {
            await deleteChatThread(user.id);
            toast({ title: "Chat Cleared", description: "Your chat history has been deleted."});
        } catch (e) {
             toast({ title: "Error", description: "Could not clear chat history.", variant: "destructive" });
        }
        setIsClearConfirmOpen(false);
    };


    return (
        <>
            <Card className={cn("flex flex-col", className)}>
                {showHeader && adminUser && (
                    <CardHeader className="flex flex-row items-center justify-between p-3 border-b bg-card/80">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={adminUser.profilePictureUrl} alt={adminUser.fullName}/>
                                <AvatarFallback>{adminUser.fullName?.charAt(0) || 'A'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-base">{adminUser.fullName}</CardTitle>
                                <CardDescription className="text-xs">Support</CardDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsClearConfirmOpen(true)} disabled={!thread || thread.messages.length === 0}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Clear Chat</span>
                        </Button>
                    </CardHeader>
                )}
                <CardContent className="flex-grow p-0 overflow-hidden">
                    <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                        {thread && thread.messages.length > 0 ? thread.messages.map((msg, index) => {
                             const isStudent = msg.sender === 'student';
                             const userToShow = isStudent ? user : adminUser;
                             return (
                                <div key={index} className={cn("flex items-end gap-2", isStudent ? "justify-end" : "justify-start")}>
                                    {!isStudent && userToShow && (
                                        <Avatar className="h-8 w-8 cursor-pointer" onClick={() => { if(userToShow.profilePictureUrl) setViewingImage(userToShow.profilePictureUrl); }}>
                                            <AvatarImage src={userToShow.profilePictureUrl} alt={userToShow.fullName} />
                                            <AvatarFallback>{userToShow.fullName?.charAt(0) || 'A'}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "max-w-xs md:max-w-md rounded-2xl px-3 py-2 whitespace-pre-wrap shadow-md",
                                        isStudent ? "bg-primary text-primary-foreground" : "bg-muted"
                                    )}>
                                        <p className="text-sm">{msg.text}</p>
                                        <p className="text-xs text-right opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                    {isStudent && userToShow && (
                                        <Avatar className="h-8 w-8 cursor-pointer" onClick={() => { if(userToShow.profilePictureUrl) setViewingImage(userToShow.profilePictureUrl); }}>
                                            <AvatarImage src={userToShow.profilePictureUrl} alt={userToShow.fullName} />
                                            <AvatarFallback>{userToShow.fullName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="text-center text-muted-foreground h-full flex flex-col justify-center items-center">
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="pt-4 border-t bg-card/80">
                        <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSendMessage)} className="flex w-full items-center gap-2">
                                <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem className="flex-grow">
                                    <FormControl>
                                        <Input placeholder="Type your message..." {...field} autoComplete="off" className="rounded-full shadow-inner bg-muted/50" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <Button type="submit" className="rounded-full h-10 w-10 p-0"><Send /></Button>
                        </form>
                    </Form>
                </CardFooter>
            </Card>
            <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete your chat history with the admin. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearChat} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <FullScreenImageViewer
                isOpen={!!viewingImage}
                onClose={() => setViewingImage(null)}
                imageUrl={viewingImage}
                alt="Profile Picture"
            />
        </>
    )
}


export function StudentChatPanel(props: { className?: string; showHeader?: boolean }) {
    return (
      <Suspense fallback={
        <Card className={cn("flex flex-col", props.className)}>
            {props.showHeader && (
                <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                </CardHeader>
            )}
            <CardContent className="flex-grow p-4">
                <div className="text-center text-muted-foreground h-full flex flex-col justify-center items-center">
                    <p>Loading Chat...</p>
                </div>
            </CardContent>
            <CardFooter className="pt-4 border-t">
                <div className="flex w-full items-center gap-2">
                    <Skeleton className="h-10 flex-grow rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </CardFooter>
        </Card>
      }>
        <StudentChatPanelComponent {...props} />
      </Suspense>
    );
}
