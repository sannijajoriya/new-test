
"use client";

import { useState, useMemo } from 'react';
import { type Report } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ReportChatDialog from '@/components/report-chat-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useReports, useUser } from '@/hooks/use-data';
import { AuthGuard } from '@/components/auth-guard';

function MyObjectionsPanel() {
    const { data: user } = useUser();
    const { data: reports, isLoading, updateItem: updateReport } = useReports();
    const [viewingReport, setViewingReport] = useState<Report | null>(null);

    const userReports = useMemo(() => {
        if (!user || !Array.isArray(reports)) return [];
        return reports
            .filter(r => r.studentId === user.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [user, reports]);

    if (isLoading) {
        return <Skeleton className="h-64 w-full" />;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>My Objections</CardTitle>
                    <CardDescription>A list of all objections you have raised for test questions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {userReports.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Test Title</TableHead>
                                    <TableHead>Question</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userReports.map(report => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium">{report.testTitle}</TableCell>
                                        <TableCell className="max-w-xs truncate">{report.questionText}</TableCell>
                                        <TableCell>{report.reason}</TableCell>
                                        <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={report.status === 'responded' ? 'default' : 'secondary'} className={report.status === 'responded' ? 'bg-green-600' : ''}>
                                                {report.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => setViewingReport(report)}>View/Reply</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">You have not raised any objections yet.</p>
                    )}
                </CardContent>
            </Card>

            <ReportChatDialog
                isOpen={!!viewingReport}
                onClose={() => setViewingReport(null)}
                report={viewingReport}
                onUpdate={updateReport}
                role="student"
            />
        </div>
    );
}

export default function MyObjectionsPage() {
    return (
        <AuthGuard role="student">
            <div className="space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">My Objections</h1>
                    <p className="text-muted-foreground">Review your submitted objections and admin responses.</p>
                </div>
                <MyObjectionsPanel />
            </div>
        </AuthGuard>
    );
}
