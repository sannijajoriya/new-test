
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { type Report, type ChatMessage } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ReportChatDialog from '@/components/report-chat-dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useReports } from '@/hooks/use-data';
import { Skeleton } from '@/components/ui/skeleton';

function ReportsPanel() {
    const { data: reports, isLoading, updateItem: updateReport } = useReports();
    const [viewingReport, setViewingReport] = useState<Report | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleUpdate = useCallback((updatedReport: Report) => {
        updateReport(updatedReport);
        setViewingReport(updatedReport); // Keep dialog open with updated data
    }, [updateReport]);
    
    const sortedReports = useMemo(() => {
        return [...(reports || [])].sort((a, b) => b.createdAt - a.createdAt)
    }, [reports]);

    const filteredReports = sortedReports.filter(report =>
        report.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.studentId && report.studentId.includes(searchTerm)) ||
        report.testTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Reported Issues</h1>
                <p className="text-muted-foreground">Review and respond to issues reported by students.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Reports</CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by student or test..." 
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-48 w-full" />
                    ) : filteredReports.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Test</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReports.map(report => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/admin/student/${report.studentId}`} className="hover:underline text-primary">
                                                {report.studentName}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{report.testTitle}</TableCell>
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
                        <p className="text-muted-foreground text-center py-8">No issues found.</p>
                    )}
                </CardContent>
            </Card>
            
            <ReportChatDialog
                isOpen={!!viewingReport}
                onClose={() => setViewingReport(null)}
                report={viewingReport}
                onUpdate={handleUpdate}
                role="admin"
            />
        </div>
    );
}

export default function ReportsPage() {
    return <ReportsPanel />;
}
