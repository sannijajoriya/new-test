
"use client";

import { useState, useMemo } from 'react';
import type { Feedback } from '@/lib/types';
import { useFeedbacks } from '@/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function FeedbackManager() {
    const { data: feedbacks, updateFeedbacks, isLoading } = useFeedbacks();
    const { toast } = useToast();

    const sortedFeedbacks = useMemo(() => {
        if (!feedbacks) return [];
        return [...feedbacks].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    }, [feedbacks]);

    const handleUpdate = async (updatedFeedbacks: Feedback[]) => {
        try {
            await updateFeedbacks(updatedFeedbacks);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update feedback status.', variant: 'destructive' });
        }
    };

    const handleStatusChange = (id: string, status: 'approved' | 'rejected' | 'pending') => {
        const updated = (feedbacks || []).map(f => f.id === id ? { ...f, status } : f);
        handleUpdate(updated);
        toast({ title: "Status Updated!", description: `Feedback has been marked as ${status}.`});
    };
    
    const handleMove = (index: number, direction: 'up' | 'down') => {
        if (!feedbacks) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= feedbacks.length) return;
        
        const reordered = [...sortedFeedbacks];
        const [movedItem] = reordered.splice(index, 1);
        reordered.splice(newIndex, 0, movedItem);

        const updatedWithOrder = reordered.map((f, i) => ({ ...f, order: i }));

        handleUpdate(updatedWithOrder);
        toast({ title: 'Order Updated!', description: 'Feedback display order has been changed.' });
    };

    if (isLoading) {
        return <Card><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Student Feedback</CardTitle>
                <CardDescription>Approve, reject, and reorder student testimonials for the homepage carousel.</CardDescription>
            </CardHeader>
            <CardContent>
                {sortedFeedbacks.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedFeedbacks.map((feedback, index) => (
                                    <TableRow key={feedback.id}>
                                        <TableCell className="space-x-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleMove(index, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleMove(index, 'down')} disabled={index === sortedFeedbacks.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar>
                                                    <AvatarImage src={feedback.photoUrl} alt={feedback.fullName} />
                                                    <AvatarFallback>{feedback.fullName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{feedback.fullName}</p>
                                                    <p className="text-xs text-muted-foreground">{feedback.city}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-sm truncate">{feedback.message}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                feedback.status === 'approved' ? 'default' :
                                                feedback.status === 'rejected' ? 'destructive' : 'secondary'
                                            } className={feedback.status === 'approved' ? 'bg-green-600' : ''}>
                                                {feedback.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline">Actions</Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(feedback.id, 'approved')}><Check className="mr-2 h-4 w-4" />Approve</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(feedback.id, 'rejected')}><X className="mr-2 h-4 w-4" />Reject</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No feedback has been submitted yet.</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function ManageFeedbackPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Feedback & Testimonials</h1>
                <p className="text-muted-foreground">Manage student feedback for the homepage.</p>
            </div>
            <FeedbackManager />
        </div>
    );
}
