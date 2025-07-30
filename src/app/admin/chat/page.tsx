
"use client";

import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import type { ChatThread, DirectMessage, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Send, Search, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatThreads, useAllUsers, useAdminUser } from '@/hooks/use-data';

const chatSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
});
type ChatForm = z.infer<typeof chatSchema>;

function ChatPanel() {
    const { toast } = useToast();
    const { data: chatThreads, updateItem: updateChatThread, isLoading: isLoadingThreads } = useChatThreads();
    const { allUsers, isLoading: isLoadingUsers } = useAllUsers();
    const { adminUser, isLoading: isLoadingAdmin } = useAdminUser();

    const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const isLoading = isLoadingThreads || isLoadingUsers || isLoadingAdmin;

    const form = useForm<ChatForm>({
        resolver: zodResolver(chatSchema),
        defaultValues: {
            message: "",
        },
    });

    const sortedThreads = useMemo(() => {
        if (!chatThreads) return [];
        return [...chatThreads].sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    }, [chatThreads]);

    useEffect(() => {
        if (selectedThread) {
             const updatedThread = sortedThreads.find(t => t.studentId === selectedThread.studentId);
             if (updatedThread) {
                 setSelectedThread(updatedThread);
             } else {
                 setSelectedThread(null); // Thread was deleted or changed
             }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatThreads]);


    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollableView = scrollAreaRef.current.querySelector('div');
            if (scrollableView) {
                 scrollableView.scrollTop = scrollableView.scrollHeight;
            }
        }
    }, [selectedThread?.messages]);

    const handleSelectThread = async (thread: ChatThread) => {
        setSelectedThread(thread);
        if (!thread.seenByAdmin) {
            await updateChatThread({ ...thread, seenByAdmin: true });
        }
    }

    const handleSendMessage = async (data: ChatForm) => {
        if (!selectedThread || !adminUser) return;
        try {
            const threadToUpdate = chatThreads?.find(t => t.studentId === selectedThread.studentId);
            if (!threadToUpdate) {
                toast({ title: "Error", description: "Could not find chat to reply to.", variant: "destructive" });
                return;
            }

            const newMessage: DirectMessage = {
                sender: 'admin',
                text: data.message,
                timestamp: Date.now(),
            };

            const updatedThread = {
                ...threadToUpdate,
                messages: [...threadToUpdate.messages, newMessage],
                lastMessageAt: newMessage.timestamp,
            };
            
            await updateChatThread(updatedThread);
            form.reset();

        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
        }
    }
    
    const filteredThreads = sortedThreads.filter(thread => 
        thread.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStudentData = (studentId: string) => allUsers?.find(u => u.id === studentId);

    return (
        <div className="space-y-6">
             <div className="space-y-2">
                <h1 className="text-3xl font-bold">Student Chat</h1>
                <p className="text-muted-foreground">Respond to messages from students.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[75vh]">
                <Card className="md:col-span-1 flex flex-col">
                    <CardHeader>
                        <CardTitle>Conversations</CardTitle>
                        <div className="relative mt-2">
                             <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                             <Input 
                                placeholder="Search by name..." 
                                className="pl-8" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                             />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="space-y-2">
                            {isLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-16 w-full" />
                                    <Skeleton className="h-16 w-full" />
                                    <Skeleton className="h-16 w-full" />
                                </div>
                            ) : filteredThreads.length > 0 ? filteredThreads.map(thread => {
                                const unread = !thread.seenByAdmin;
                                return (
                                <div 
                                    key={thread.studentId} 
                                    className={cn(
                                        "p-3 rounded-lg cursor-pointer border-l-4",
                                        selectedThread?.studentId === thread.studentId ? "border-primary bg-muted" : "border-transparent hover:bg-muted/50",
                                        unread && "font-bold"
                                    )}
                                    onClick={() => handleSelectThread(thread)}
                                >
                                    <div className="flex justify-between items-center">
                                      <p className="font-semibold">{thread.studentName}</p>
                                      {unread && <Badge className="bg-primary animate-pulse">New</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{thread.messages[thread.messages.length - 1]?.text}</p>
                                </div>
                            )}) : (
                                <p className="text-muted-foreground text-center py-8">No conversations found.</p>
                            )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2 flex flex-col">
                    {selectedThread ? (
                        <>
                         <CardHeader className="border-b">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>{selectedThread.studentName}</CardTitle>
                                    <CardDescription>ID: {selectedThread.studentId}</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/admin/student/${selectedThread.studentId}`} className="flex items-center gap-1">
                                        <UserIcon className="h-4 w-4" /> View Profile
                                    </Link>
                                </Button>
                            </div>
                         </CardHeader>
                         <CardContent className="flex-grow p-0 overflow-hidden">
                            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                                <div className="space-y-4">
                                {selectedThread.messages.map((msg, index) => {
                                    const student = getStudentData(selectedThread.studentId);
                                    return (
                                    <div key={index} className={cn("flex items-end gap-2", msg.sender === 'admin' ? "justify-end" : "justify-start")}>
                                        {msg.sender === 'student' ? (
                                            student && <Avatar className="h-8 w-8">
                                                <AvatarImage src={student?.profilePictureUrl} alt={student?.fullName} />
                                                <AvatarFallback>{selectedThread.studentName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            adminUser && <Avatar className="h-8 w-8">
                                                <AvatarImage src={adminUser?.profilePictureUrl} alt={adminUser?.fullName} />
                                                <AvatarFallback>{adminUser?.fullName?.charAt(0) || 'A'}</AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn(
                                            "max-w-xs md:max-w-md rounded-lg px-3 py-2",
                                            msg.sender === 'admin' ? "bg-primary text-primary-foreground" : "bg-muted"
                                        )}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                            <p className="text-xs text-right opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                )})}
                                </div>
                            </ScrollArea>
                         </CardContent>
                         <CardFooter className="pt-4 border-t">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSendMessage)} className="flex w-full items-start gap-2">
                                    <FormField
                                        control={form.control}
                                        name="message"
                                        render={({ field }) => (
                                            <FormItem className="flex-grow">
                                            <FormControl>
                                                <Input placeholder="Type your reply..." {...field} autoComplete="off"/>
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    <Button type="submit"><Send /></Button>
                                </form>
                            </Form>
                         </CardFooter>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <p>Select a conversation to start chatting.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}


export default function AdminChatPage() {
    return (
      <Suspense fallback={<p>Loading chats...</p>}>
        <ChatPanel />
      </Suspense>
    );
}
