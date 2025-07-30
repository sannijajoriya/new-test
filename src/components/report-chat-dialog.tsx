
"use client";

import { useState, useEffect, useRef } from 'react';
import { type Report, type ChatMessage } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const reportChatSchema = z.object({
    message: z.string().min(1, "Message cannot be empty."),
});
type ReportChatForm = z.infer<typeof reportChatSchema>;

export default function ReportChatDialog({ report, isOpen, onClose, onUpdate, role }: { report: Report | null, isOpen: boolean, onClose: () => void, onUpdate: (report: Report) => void, role: 'student' | 'admin' }) {
    const { toast } = useToast();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const form = useForm<ReportChatForm>({
        resolver: zodResolver(reportChatSchema),
        defaultValues: { message: "" },
    });
    
    useEffect(() => {
        if (chatContainerRef.current) {
            const scrollableView = chatContainerRef.current.querySelector('div');
            if(scrollableView) {
                scrollableView.scrollTop = scrollableView.scrollHeight;
            }
        }
    }, [report?.chat]);

    if (!report) return null;

    const handleSubmitReply = (data: ReportChatForm) => {
        try {
            const newMessage: ChatMessage = {
                sender: role,
                message: data.message,
                timestamp: Date.now(),
            };

            const updatedReport = { ...report };
            updatedReport.chat.push(newMessage);
            if (role === 'admin') {
                updatedReport.status = 'responded';
            }

            onUpdate(updatedReport);
            form.reset();
            toast({ title: "Reply Sent!", description: "Your message has been added to the report."});
        } catch (error) {
             toast({ title: "Error", description: "Failed to send reply.", variant: "destructive" });
        }
    };

    return (
         <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Report Details</DialogTitle>
                     <DialogDescription>{role === 'admin' ? `Student: ${report.studentName} |` : ''} Test: {report.testTitle}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                           <CardDescription>Question:</CardDescription>
                           <CardTitle className="text-base font-medium">{report.questionText}</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p><span className="font-semibold">Reason:</span> {report.reason}</p>
                             <p><span className="font-semibold">Initial Remarks:</span> {report.remarks || 'N/A'}</p>
                        </CardContent>
                    </Card>

                    <Separator />
                    
                    <h4 className="font-semibold text-center">Conversation</h4>
                    <ScrollArea className="h-64 w-full rounded-md border p-4">
                        <div ref={chatContainerRef} className="space-y-4">
                            {report.chat.map((chat, index) => (
                                <div key={index} className={cn("flex items-end gap-2", chat.sender === role ? "justify-end" : "justify-start")}>
                                     <div className={cn(
                                        "max-w-xs md:max-w-md rounded-lg px-3 py-2",
                                        chat.sender === role ? "bg-primary text-primary-foreground" : "bg-muted"
                                    )}>
                                        <p className="text-sm">{chat.message}</p>
                                        <p className="text-xs text-right opacity-70 mt-1">{new Date(chat.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            ))}
                       </div>
                    </ScrollArea>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmitReply)} className="flex items-start gap-2">
                             <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem className="flex-grow">
                                    <FormControl>
                                        <Input placeholder="Type your reply..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <Button type="submit"><Send /></Button>
                        </form>
                    </Form>
                </div>
                 <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Close</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
