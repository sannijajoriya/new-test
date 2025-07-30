
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SarthiBotMessage, SarthiBotTrainingData, SarthiBotConversation, ChatHistory } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Send, BrainCircuit, Paperclip, X, CornerDownLeft, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { askSarthiBot } from '@/ai/flows/sarthi-bot-flow';
import Image from 'next/image';
import { useSiteSettings, useSarthiBotTrainingData, useSarthiBotConversations, useUser } from '@/hooks/use-data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FullScreenImageViewer } from './full-screen-image-viewer';

const chatSchema = z.object({
  message: z.string(),
});
type ChatForm = z.infer<typeof chatSchema>;

function TypingIndicator({ avatarUrl }: { avatarUrl?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <Avatar className="h-8 w-8">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="Bot Avatar" /> : <AvatarFallback><BrainCircuit /></AvatarFallback>}
      </Avatar>
      <div className="bg-muted p-3 rounded-2xl flex items-center space-x-1 shadow-md">
        <span className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></span>
        <span className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></span>
        <span className="h-2 w-2 bg-primary rounded-full animate-pulse"></span>
      </div>
    </div>
  );
}

export function SarthiBotPanel({ className, showHeader = true }: { className?: string; showHeader?: boolean; }) {
    const user = useUser();
    const { settings } = useSiteSettings();
    const { trainingData } = useSarthiBotTrainingData();
    const { conversations, updateSarthiBotConversation, deleteSarthiBotConversation } = useSarthiBotConversations();

    const { toast } = useToast();
    const [messages, setMessages] = useState<SarthiBotMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageData, setImageData] = useState<string | null>(null);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const userConversation = conversations?.find(c => c.studentId === user?.id);

    useEffect(() => {
        if (userConversation && userConversation.messages.length > 0) {
            setMessages(userConversation.messages);
        } else if (settings?.botIntroMessage) {
            setMessages([{ role: 'bot', text: settings.botIntroMessage }]);
        }
    }, [userConversation, settings]);

    const saveConversation = useCallback((updatedMessages: SarthiBotMessage[]) => {
        if (!user || !updateSarthiBotConversation) return;
        const newConversation = {
            id: user.id,
            studentId: user.id,
            studentName: user.fullName,
            messages: updatedMessages,
            lastMessageAt: Date.now(),
        };
        updateSarthiBotConversation(newConversation);
    }, [user, updateSarthiBotConversation]);

    useEffect(() => {
        if (messages.length > (settings?.botIntroMessage ? 1 : 0)) {
            saveConversation(messages);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, settings]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollableView = scrollAreaRef.current.querySelector('div');
            if (scrollableView) {
                 scrollableView.scrollTop = scrollableView.scrollHeight;
            }
        }
    }, [messages, isLoading]);

    const form = useForm<ChatForm>({
        resolver: zodResolver(chatSchema),
        defaultValues: { message: "" },
    });
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                toast({
                    title: 'Image too large',
                    description: 'Please upload an image smaller than 4MB.',
                    variant: 'destructive',
                });
                return;
            }
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            setImageData(dataUrl);
            setImagePreview(dataUrl);
          };
          reader.readAsDataURL(file);
        }
    };
    
    const clearImage = () => {
        setImageData(null);
        setImagePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }

    const handleSend = async (data: ChatForm) => {
        if (!user || !settings) return;
        if (!data.message && !imageData) {
            toast({ title: "Please type a message or upload an image.", variant: "destructive"});
            return;
        }
        if (!settings.isBotEnabled) {
            toast({ title: "Bot is disabled", description: "The AI bot is currently unavailable. Please contact an admin.", variant: "destructive"});
            return;
        }

        setIsLoading(true);
        const userMessage: SarthiBotMessage = {
          role: 'user',
          text: data.message,
          ...(imagePreview && { image: imagePreview }),
        };
        const currentImageData = imageData;
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);

        form.reset();
        clearImage();
        
        try {
            const historyForAI: ChatHistory[] = updatedMessages
                .filter(msg => !(msg.role === 'bot' && msg.text === settings.botIntroMessage)) // Exclude intro message
                .map(msg => {
                    const content: any[] = [];
                    if (msg.text) {
                        content.push({ text: msg.text });
                    }
                    if (msg.image) {
                        content.push({ media: { url: msg.image } });
                    }
                    return {
                        role: msg.role === 'bot' ? 'model' : 'user',
                        content,
                    };
                }).slice(0, -1); // Exclude the last user message which is sent as the main prompt

            const result = await askSarthiBot({ 
                text: data.message,
                photoDataUri: currentImageData || undefined,
                history: historyForAI,
                trainingData: trainingData || [],
                botName: settings.botName,
            });
            
            const botMessage: SarthiBotMessage = {
                role: 'bot',
                text: result.response,
            };
            setMessages(prev => [...prev, botMessage]);

        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "The AI bot is having trouble. Please try again later.", variant: "destructive" });
             const botMessage: SarthiBotMessage = {
                role: 'bot',
                text: "माफ़ कीजिए, मुझे एक त्रुटि का सामना करना पड़ा। कृपया थोड़ी देर बाद पुनः प्रयास करें।",
            };
            setMessages(prev => [...prev, botMessage]);
        } finally {
             setIsLoading(false);
        }
    };
    
    const handleClearChat = () => {
        if (!user || !deleteSarthiBotConversation) return;
        deleteSarthiBotConversation(user.id);
        const newMessages = settings?.botIntroMessage ? [{ role: 'bot' as const, text: settings.botIntroMessage }] : [];
        setMessages(newMessages);
        toast({ title: "Chat Cleared", description: "Your conversation history with the bot has been cleared." });
        setIsClearConfirmOpen(false);
    };

    return (
        <>
            <Card className={cn("flex flex-col", className)}>
                {showHeader && (
                    <CardHeader className="flex flex-row items-center justify-between p-3 border-b bg-card/80">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                {settings?.botAvatarUrl ? <AvatarImage src={settings.botAvatarUrl} alt="Bot Avatar" /> : <AvatarFallback><BrainCircuit /></AvatarFallback>}
                            </Avatar>
                            <div>
                                <CardTitle className="text-base">{settings?.botName || "Sarthi Bot"}</CardTitle>
                                <CardDescription className="text-xs flex items-center gap-1.5"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span> Online</CardDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsClearConfirmOpen(true)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Clear Chat</span>
                        </Button>
                    </CardHeader>
                )}
                <CardContent className="flex-grow p-0 overflow-hidden">
                    <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                        {messages.length === 0 && !settings?.botIntroMessage && (
                            <div className="text-center text-muted-foreground py-8">
                                <BrainCircuit className="h-10 w-10 mx-auto mb-2" />
                                <p>नमस्ते! मैं {settings?.botName || 'उड़ान सारथी बॉट'} हूँ।</p>
                                <p className="text-sm">आप मुझसे कोई भी सवाल पूछ सकते हैं।</p>
                            </div>
                        )}

                        {messages.map((msg, index) => {
                            const isUser = msg.role === 'user';
                            return (
                                <div key={index} className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}>
                                    {!isUser && (
                                         <Avatar className="h-8 w-8 self-start cursor-pointer" onClick={() => { if(settings?.botAvatarUrl) setViewingImage(settings.botAvatarUrl); }}>
                                            {settings?.botAvatarUrl ? <AvatarImage src={settings.botAvatarUrl} alt="Bot Avatar" /> : <AvatarFallback><BrainCircuit /></AvatarFallback>}
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "max-w-sm rounded-2xl px-3 py-2 whitespace-pre-wrap shadow-md",
                                        isUser ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                                    )}>
                                        {msg.image && (
                                             <Image src={msg.image} width={200} height={200} alt="User upload" className="rounded-md mb-2" />
                                        )}
                                        <p className="text-sm">{msg.text}</p>
                                    </div>
                                    {isUser && user && (
                                        <Avatar className="h-8 w-8 self-end cursor-pointer" onClick={() => { if(user.profilePictureUrl) setViewingImage(user.profilePictureUrl); }}>
                                            <AvatarImage src={user.profilePictureUrl} alt={user.fullName} />
                                            <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            );
                        })}
                        {isLoading && <TypingIndicator avatarUrl={settings?.botAvatarUrl} />}
                        {!settings?.isBotEnabled && (
                            <div className="text-center text-destructive-foreground bg-destructive/80 p-4 rounded-md">
                            The AI bot is currently disabled by the admin.
                            </div>
                        )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="pt-4 border-t flex flex-col items-stretch gap-2 bg-card/80">
                    {imagePreview && (
                        <div className="relative w-24 h-24 p-2 border rounded-md self-start bg-muted/50">
                            <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="cover" className="rounded"/>
                            <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={clearImage}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSend)} className="flex w-full items-center gap-2">
                            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                                <Paperclip />
                            </Button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem className="flex-grow">
                                    <FormControl>
                                        <div className="relative">
                                            <Input placeholder="Ask the bot anything..." {...field} autoComplete="off" className="pr-10 rounded-full shadow-inner bg-muted/50" disabled={isLoading || !settings?.isBotEnabled} />
                                            <CornerDownLeft className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading || !settings?.isBotEnabled} className="rounded-full h-10 w-10 p-0"><Send /></Button>
                        </form>
                    </Form>
                </CardFooter>
            </Card>
            <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete your chat history with the bot.</AlertDialogDescription>
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
    );
}
