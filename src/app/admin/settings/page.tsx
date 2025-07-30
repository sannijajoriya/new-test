
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Edit, ImagePlus, Newspaper, Save, Settings, Trash2, LayoutTemplate, MessageSquare } from 'lucide-react';
import type { SarthiBotTrainingData, SarthiBotConversation } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useSiteSettings, useSarthiBotTrainingData, useSarthiBotConversations, useData, useUser } from '@/hooks/use-data';
import { ImageUploader } from '@/components/image-uploader';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';

const profileSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }).optional().or(z.literal('')),
  profilePictureUrl: z.string().optional(),
});
type ProfileFormData = z.infer<typeof profileSchema>;

function AdminProfileManager() {
    const user = useUser();
    const { updateUser } = useData();
    const { toast } = useToast();

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: "",
            email: "",
            profilePictureUrl: "",
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({
                fullName: user.fullName || "",
                email: user.email || "",
                profilePictureUrl: user.profilePictureUrl || "",
            });
        }
    }, [user, form]);


    const onSubmit = async (data: ProfileFormData) => {
        if (!user) {
            toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
            return;
        }

        try {
            await updateUser(user.id, data);
            toast({ title: "Success!", description: "Your profile has been updated." });
            form.reset(data); // update form with new saved values
        } catch(e) {
            toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Admin Profile</CardTitle>
                <CardDescription>Manage your public-facing admin details.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                         <FormField
                            control={form.control}
                            name="profilePictureUrl"
                            render={({ field }) => (
                                <ImageUploader
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    onCrop={field.onChange}
                                    label="Admin Display Picture"
                                    description="This DP will be shown to students in chats."
                                    aspect={1}
                                    cropShape="round"
                                />
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your Email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                            {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function SiteSettingsManager() {
    const { settings, updateSettings } = useSiteSettings();

    if (!settings) return <Skeleton className="h-64 w-full" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Website Logo Management</CardTitle>
                <CardDescription>Upload and manage the main logo for the website.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <ImageUploader
                    value={settings.logoUrl || ''}
                    onChange={(newLogoUrl) => updateSettings({ logoUrl: newLogoUrl })}
                    onCrop={(newLogoUrl) => updateSettings({ logoUrl: newLogoUrl })}
                    label="Website Logo"
                    description="This logo appears in the header, footer, and chat button. Recommended aspect ratio: 4:1."
                    aspect={160 / 40}
                    cropShape="rect"
                />
            </CardContent>
        </Card>
    );
}

const botSettingsSchema = z.object({
    isBotEnabled: z.boolean(),
    botName: z.string().min(1, "Bot name cannot be empty."),
    botIntroMessage: z.string().min(1, "Intro message cannot be empty."),
    botAvatarUrl: z.string().optional(),
});
type BotSettingsFormData = z.infer<typeof botSettingsSchema>;


function SarthiBotManager() {
    const { settings, updateSettings } = useSiteSettings();
    const { toast } = useToast();
    const { trainingData, updateSarthiBotTrainingData, isLoading: isLoadingTrainingData } = useSarthiBotTrainingData();
    const { conversations, isLoading: isLoadingConversations } = useSarthiBotConversations();

    const [viewingConversation, setViewingConversation] = useState<SarthiBotConversation | null>(null);

    const [newQuestion, setNewQuestion] = useState('');
    const [newAnswer, setNewAnswer] = useState('');
    const [editingItem, setEditingItem] = useState<SarthiBotTrainingData | null>(null);
    
    const form = useForm<BotSettingsFormData>();

    useEffect(() => {
        if (settings) {
            form.reset({
                isBotEnabled: settings.isBotEnabled,
                botName: settings.botName,
                botIntroMessage: settings.botIntroMessage,
                botAvatarUrl: settings.botAvatarUrl,
            });
        }
    }, [settings, form]);
    
    const handleAddOrUpdateTrainingItem = () => {
        if (!newQuestion.trim() || !newAnswer.trim() || !trainingData) {
            toast({ title: "Error", description: "Question and Answer cannot be empty.", variant: "destructive" });
            return;
        }

        let updatedData;
        if (editingItem) {
            updatedData = trainingData.map(item => item.id === editingItem.id ? { ...item, question: newQuestion, answer: newAnswer } : item);
        } else {
            const newItem = { id: `qa-${Date.now()}`, question: newQuestion, answer: newAnswer };
            updatedData = [...trainingData, newItem];
        }

        updateSarthiBotTrainingData(updatedData);
        setNewQuestion('');
        setNewAnswer('');
        setEditingItem(null);
        toast({ title: editingItem ? "Item Updated" : "Item Added" });
    };

    const handleEditItem = (item: SarthiBotTrainingData) => {
        setEditingItem(item);
        setNewQuestion(item.question);
        setNewAnswer(item.answer);
    };

    const handleDeleteItem = (id: string) => {
        if (!trainingData) return;
        const updatedData = trainingData.filter(item => item.id !== id);
        updateSarthiBotTrainingData(updatedData);
        toast({ title: "Item Deleted", variant: "destructive" });
    };
    
    const onBotSettingsSubmit = (data: BotSettingsFormData) => {
        updateSettings(data);
        toast({ title: "Bot Settings Saved!", description: "The bot customization has been updated." });
        form.reset(data);
    };


    if (!settings || isLoadingTrainingData || isLoadingConversations) return <Skeleton className="h-96 w-full" />;

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onBotSettingsSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bot Customization</CardTitle>
                            <CardDescription>Customize the appearance and behavior of the UdaanSarthi AI Bot.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="isBotEnabled"
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                    <FormLabel className="text-base">Bot Enabled</FormLabel>
                                    <FormDescription>
                                        Allow students to interact with the AI assistant.
                                    </FormDescription>
                                    </div>
                                    <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    </FormControl>
                                </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="botName" render={({ field }) => (
                                    <FormItem><FormLabel>Bot Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="botIntroMessage" render={({ field }) => (
                                    <FormItem><FormLabel>Bot Intro Message</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <FormField
                                control={form.control}
                                name="botAvatarUrl"
                                render={({ field }) => (
                                <ImageUploader
                                    value={field.value}
                                    onChange={field.onChange}
                                    onCrop={field.onChange}
                                    label="Bot Avatar"
                                    description="Upload a circular avatar for the bot."
                                    aspect={1}
                                    cropShape="round"
                                />
                                )}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !form.formState.isDirty}>Save Bot Settings</Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>

            <Card>
                <CardHeader>
                    <CardTitle>Bot Training Data</CardTitle>
                    <CardDescription>Provide fixed question-answer pairs. The bot will use these answers for matching questions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2 p-4 border rounded-lg">
                        <h4 className="font-semibold">{editingItem ? "Edit Item" : "Add New Item"}</h4>
                        <Label htmlFor="new-question">Question</Label>
                        <Textarea id="new-question" value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="When the user asks..." />
                        <Label htmlFor="new-answer">Answer</Label>
                        <Textarea id="new-answer" value={newAnswer} onChange={e => setNewAnswer(e.target.value)} placeholder="The bot should reply..."/>
                        <div className="flex gap-2 justify-end">
                            {editingItem && <Button variant="ghost" onClick={() => { setEditingItem(null); setNewQuestion(''); setNewAnswer(''); }}>Cancel Edit</Button>}
                            <Button onClick={handleAddOrUpdateTrainingItem}>{editingItem ? "Update Item" : "Add Item"}</Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold">Existing Data</h4>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader><TableRow><TableHead>Question</TableHead><TableHead>Answer</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {trainingData?.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="max-w-sm truncate">{item.question}</TableCell>
                                            <TableCell className="max-w-sm truncate">{item.answer}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="icon" onClick={() => handleEditItem(item)}><Edit className="h-4 w-4"/></Button>
                                                <Button variant="destructive" size="icon" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                             {(!trainingData || trainingData.length === 0) && <p className="text-center text-muted-foreground p-4">No training data added yet.</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Bot Conversations</CardTitle>
                    <CardDescription>Review conversations students have had with the AI bot.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Last Message</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {conversations?.sort((a,b) => b.lastMessageAt - a.lastMessageAt).map(convo => (
                                    <TableRow key={convo.studentId}>
                                        <TableCell>{convo.studentName}</TableCell>
                                        <TableCell>{new Date(convo.lastMessageAt).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" onClick={() => setViewingConversation(convo)}>View</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {(!conversations || conversations.length === 0) && <p className="text-center text-muted-foreground p-4">No bot conversations have been recorded yet.</p>}
                    </div>
                </CardContent>
            </Card>

             <Dialog open={!!viewingConversation} onOpenChange={(open) => !open && setViewingConversation(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Conversation with {viewingConversation?.studentName}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-96 border rounded-md p-4">
                         <div className="space-y-4">
                            {viewingConversation?.messages.map((msg, index) => (
                                <div key={index} className={cn("flex items-end gap-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                    {msg.role === 'bot' && (
                                         <Avatar className="h-8 w-8 self-start">
                                            {settings?.botAvatarUrl ? <AvatarImage src={settings.botAvatarUrl} alt="Bot Avatar" /> : <AvatarFallback><BrainCircuit /></AvatarFallback>}
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "max-w-sm rounded-2xl px-3 py-2 whitespace-pre-wrap shadow-md",
                                        msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                                    )}>
                                        {msg.image && (
                                             <Image src={msg.image} width={200} height={200} alt="User upload" className="rounded-md mb-2" />
                                        )}
                                        <p className="text-sm">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </ScrollArea>
                    <DialogFooter>
                        <DialogClose asChild><Button>Close</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function NewsBannerManager() {
    const { settings, updateSettings } = useSiteSettings();

    if (!settings) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Homepage News Banner</CardTitle>
                <CardDescription>Manage the popup banner that appears on the homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                    <Switch
                      id="banner-enabled"
                      checked={settings.isNewsBannerEnabled}
                      onCheckedChange={(checked) => updateSettings({ isNewsBannerEnabled: checked })}
                    />
                    <Label htmlFor="banner-enabled">Enable News Banner</Label>
                </div>

                <ImageUploader
                    value={settings.newsBannerImageUrl || ''}
                    onChange={(url) => updateSettings({ newsBannerImageUrl: url })}
                    onCrop={(url) => updateSettings({ newsBannerImageUrl: url })}
                    label="Banner Image"
                    description="Upload the image for the popup. Recommended aspect ratio: 2:1."
                    aspect={2}
                    cropShape="rect"
                />

                <div className="space-y-2">
                    <Label htmlFor="banner-title">Banner Title (Optional)</Label>
                    <Input 
                        id="banner-title" 
                        value={settings.newsBannerTitle || ''} 
                        onChange={(e) => updateSettings({ newsBannerTitle: e.target.value })}
                        placeholder="e.g., New Test Series Launched!"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="banner-link">"Learn More" Link (Optional)</Label>
                    <Input 
                        id="banner-link" 
                        value={settings.newsBannerLink || ''} 
                        onChange={(e) => updateSettings({ newsBannerLink: e.target.value })}
                        placeholder="e.g., /tests/new-series-id"
                    />
                     <p className="text-sm text-muted-foreground">If you provide a link, a "Learn More" button will appear.</p>
                </div>
                
                <div className="space-y-2">
                    <Label>Display Rule</Label>
                    <RadioGroup
                        value={settings.newsBannerDisplayRule}
                        onValueChange={(value: 'always' | 'session') => updateSettings({ newsBannerDisplayRule: value as 'always' | 'session' })}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="session" id="session" />
                            <Label htmlFor="session">Show once per session</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="always" id="always" />
                            <Label htmlFor="always">Show every time the page is loaded</Label>
                        </div>
                    </RadioGroup>
                </div>
            </CardContent>
        </Card>
    );
}

function HomepageBannerManager() {
    const { settings, updateSettings } = useSiteSettings();

    if (!settings) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Homepage Hero Banner</CardTitle>
                <CardDescription>Manage the main banner on the homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <ImageUploader
                    value={settings.heroBannerImageUrl || ''}
                    onChange={(url) => updateSettings({ heroBannerImageUrl: url })}
                    onCrop={(url) => updateSettings({ heroBannerImageUrl: url })}
                    label="Banner Background Image"
                    description="This is the main background image for the hero section. Recommended aspect ratio: 2.5:1."
                    aspect={1200 / 480}
                    cropShape="rect"
                />

                <Separator />
                
                 <div className="space-y-2">
                    <Label htmlFor="banner-opacity">Banner Overlay Opacity</Label>
                    <div className="flex items-center gap-4">
                        <Slider
                            id="banner-opacity"
                            min={0}
                            max={1}
                            step={0.1}
                            value={[settings.heroBannerOverlayOpacity ?? 0.5]}
                            onValueChange={(value) => updateSettings({ heroBannerOverlayOpacity: value[0] })}
                        />
                        <span className="text-sm font-medium text-muted-foreground w-12 text-center">
                            {Math.round((settings.heroBannerOverlayOpacity ?? 0.5) * 100)}%
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Controls the darkness of the overlay. Higher values make the text easier to read.</p>
                </div>

                <Separator />

                 <div className="flex items-center space-x-2">
                    <Switch
                      id="banner-text-enabled"
                      checked={settings.isHeroBannerTextEnabled}
                      onCheckedChange={(checked) => updateSettings({ isHeroBannerTextEnabled: checked })}
                    />
                    <Label htmlFor="banner-text-enabled">Show Banner Text</Label>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="banner-text">Banner Text</Label>
                    <Textarea 
                        id="banner-text" 
                        value={settings.heroBannerText || ''} 
                        onChange={(e) => updateSettings({ heroBannerText: e.target.value })}
                        placeholder="Enter banner text. The first line will be the title."
                        rows={4}
                        disabled={!settings.isHeroBannerTextEnabled}
                    />
                    <p className="text-sm text-muted-foreground">The first line will be the main heading, and subsequent lines will be the subtext.</p>
                </div>
            </CardContent>
        </Card>
    );
}

function ChatSettingsManager() {
    const { settings, updateSettings } = useSiteSettings();
    const { toast } = useToast();
    const [autoReply, setAutoReply] = useState('');

    useEffect(() => {
        if (settings) {
            setAutoReply(settings.adminChatAutoReply);
        }
    }, [settings]);

    const handleSave = () => {
        updateSettings({ adminChatAutoReply: autoReply });
        toast({ title: 'Settings Saved!', description: 'The admin chat auto-reply has been updated.' });
    };

    if (!settings) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Admin Chat Settings</CardTitle>
                <CardDescription>Customize the automated responses for the student-to-admin chat.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="auto-reply">Auto-Reply Message</Label>
                    <Textarea
                        id="auto-reply"
                        value={autoReply}
                        onChange={(e) => setAutoReply(e.target.value)}
                        placeholder="Enter the message to send when a student messages you."
                        rows={6}
                    />
                    <p className="text-sm text-muted-foreground">This message is sent automatically every time a student sends a new message in the admin chat.</p>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleSave} className="w-full">Save Auto-Reply</Button>
            </CardFooter>
        </Card>
    );
}


export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your site, bot, and profile settings.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-6">
            <TabsTrigger value="profile"><Settings /> Admin Profile</TabsTrigger>
            <TabsTrigger value="site"><ImagePlus /> Site Logo</TabsTrigger>
            <TabsTrigger value="sarthi-bot"><BrainCircuit /> Sarthi Bot</TabsTrigger>
            <TabsTrigger value="chat"><MessageSquare /> Chat Settings</TabsTrigger>
            <TabsTrigger value="news-banner"><Newspaper /> News Banner</TabsTrigger>
            <TabsTrigger value="homepage-banner"><LayoutTemplate /> Homepage Banner</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="pt-6">
             <AdminProfileManager />
        </TabsContent>
         <TabsContent value="site" className="pt-6">
            <SiteSettingsManager />
        </TabsContent>
        <TabsContent value="sarthi-bot" className="pt-6">
            <SarthiBotManager />
        </TabsContent>
         <TabsContent value="chat" className="pt-6">
            <ChatSettingsManager />
        </TabsContent>
         <TabsContent value="news-banner" className="pt-6">
            <NewsBannerManager />
        </TabsContent>
        <TabsContent value="homepage-banner" className="pt-6">
            <HomepageBannerManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
