
"use client";

import { useState, useEffect, Suspense, useMemo } from 'react';
import { type User, type ChatThread, type DirectMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Search, ArrowRight, MessageSquare } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudents, useResults, useChatThreads } from '@/hooks/use-data';

const directMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
});
type DirectMessageForm = z.infer<typeof directMessageSchema>;

function DirectMessageDialog({ student, isOpen, onClose }: { student: User | null, isOpen: boolean, onClose: () => void }) {
    const { toast } = useToast();
    const { data: chatThreads, updateItem: updateChatThread } = useChatThreads();
    const form = useForm<DirectMessageForm>({
        resolver: zodResolver(directMessageSchema),
        defaultValues: { message: "" },
    });

    useEffect(() => {
        if (!isOpen) {
            form.reset();
        }
    }, [isOpen, form]);

    if (!student) return null;

    const handleSendMessage = async (data: DirectMessageForm) => {
        try {
            const currentThread = chatThreads?.find(t => t.studentId === student.id);

            const newMessage: DirectMessage = {
                sender: 'admin',
                text: data.message,
                timestamp: Date.now(),
            };

            let threadToUpdate: ChatThread;
            if (currentThread) {
                threadToUpdate = {
                    ...currentThread,
                    messages: [...currentThread.messages, newMessage],
                    lastMessageAt: newMessage.timestamp,
                }
            } else {
                 threadToUpdate = {
                    id: student.id,
                    studentId: student.id,
                    studentName: student.fullName,
                    messages: [newMessage],
                    lastMessageAt: newMessage.timestamp,
                    seenByAdmin: true,
                };
            }
            
            await updateChatThread(threadToUpdate);

            toast({ title: 'Message Sent!', description: `Your message has been sent to ${student.fullName}.` });
            onClose();
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send Message to {student.fullName}</DialogTitle>
                    <DialogDescription>
                        This will start or continue a conversation in the student's chat panel.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSendMessage)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea placeholder="Type your message here..." {...field} rows={5}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Send Message</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function StudentManager() {
    const { students, deleteStudent, isLoading: isLoadingStudents } = useStudents();
    const { data: results, isLoading: isLoadingResults } = useResults();
    
    const [studentToDelete, setStudentToDelete] = useState<User | null>(null);
    const [studentToMessage, setStudentToMessage] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const isLoading = isLoadingStudents || isLoadingResults;

    const testsTakenCounts = useMemo(() => {
        if (!results) return new Map<string, number>();
        return results.reduce((acc, r) => {
            acc.set(r.userId, (acc.get(r.userId) || 0) + 1);
            return acc;
        }, new Map<string, number>());
    }, [results]);

    const getTestsTakenCount = (studentId: string) => testsTakenCounts.get(studentId) || 0;
    
    const handleDeleteStudent = async (studentId: string) => {
        try {
            await deleteStudent(studentId);
            setStudentToDelete(null);
            toast({
                title: "Student Deleted",
                description: "The student account and all their data have been deleted.",
                variant: 'destructive'
            });

        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete student.', variant: 'destructive' });
        }
    };
    
    const filteredStudents = useMemo(() => (students || []).filter(student =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [students, searchTerm]);
    
    if (isLoading) {
        return <Card><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
    }

    if (!students || students.length === 0) {
        return <p className="text-muted-foreground text-center py-8">No students have registered yet.</p>
    }

    return (
       <>
        <Card>
            <CardHeader>
                <CardTitle>Registered Students</CardTitle>
                <CardDescription>View and manage all registered student accounts.</CardDescription>
                <div className="relative pt-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or email..." 
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Email (Login ID)</TableHead>
                                <TableHead>Joined On</TableHead>
                                <TableHead className="text-center">Tests Taken</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStudents.map(student => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={student.profilePictureUrl || `https://ui-avatars.com/api/?name=${student.fullName.charAt(0)}&background=random`} data-ai-hint="person" />
                                                <AvatarFallback>{student.fullName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>{student.fullName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{student.email}</TableCell>
                                    <TableCell>{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell className="text-center">{getTestsTakenCount(student.id)}</TableCell>
                                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                                         <Button variant="outline" size="sm" asChild>
                                            <Link href={`/admin/student/${student.id}`} className="flex items-center gap-1">View Progress <ArrowRight className="h-3 w-3"/></Link>
                                        </Button>
                                         <Button variant="outline" size="icon" onClick={() => setStudentToMessage(student)}><MessageSquare className="h-4 w-4" /></Button>
                                        <Button variant="destructive" size="icon" onClick={() => setStudentToDelete(student)}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
        <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the student account for "{studentToDelete?.fullName}" and all of their test results.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setStudentToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteStudent(studentToDelete!.id)} className="bg-destructive hover:bg-destructive/90">
                Delete
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <DirectMessageDialog 
            student={studentToMessage}
            isOpen={!!studentToMessage}
            onClose={() => setStudentToMessage(null)}
        />
       </>
    );
}

export default function ManageStudentsPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Manage Students</h1>
                <p className="text-muted-foreground">View, manage, and communicate with your students.</p>
            </div>
             <Suspense fallback={<Card><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>}>
                <StudentManager />
            </Suspense>
        </div>
    );
}
