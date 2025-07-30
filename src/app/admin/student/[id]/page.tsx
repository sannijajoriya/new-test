
"use client";

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { type Test, type Result, type User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User as UserIcon, Calendar, ClipboardList, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudents, useResults, useTests } from '@/hooks/use-data';

function StudentProgressReport() {
    const params = useParams();
    const studentId = params.id as string;
    const router = useRouter();

    const { students, isLoading: isLoadingStudents } = useStudents();
    const { data: results, isLoading: isLoadingResults } = useResults();
    const { data: tests, isLoading: isLoadingTests } = useTests();

    const isLoading = isLoadingStudents || isLoadingResults || isLoadingTests;

    const student = useMemo(() => {
        if (!students || !studentId) return null;
        return students.find(u => u.id === studentId);
    }, [students, studentId]);

    const studentResults = useMemo(() => {
        if (!results || !studentId) return [];
        return results.filter(r => r.userId === studentId).sort((a,b) => b.submittedAt - a.submittedAt);
    }, [results, studentId]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-32" />
                <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
            </div>
        );
    }
    
    if (!student) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Student Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The student with the specified ID could not be found.</p>
                    <Button onClick={() => router.push('/admin/students')} variant="link" className="mt-4">
                        Back to Student List
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const averageScore = studentResults.length > 0
        ? (studentResults.reduce((acc, r) => acc + r.score, 0) / studentResults.length).toFixed(2)
        : 'N/A';
    
    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>

             <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Student Profile & Progress</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <UserIcon className="h-6 w-6 text-primary" />
                        <div>
                            <p className="text-muted-foreground">Name</p>
                            <p className="font-semibold">{student.fullName}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Calendar className="h-6 w-6 text-primary" />
                        <div>
                            <p className="text-muted-foreground">Joined On</p>
                            <p className="font-semibold">{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <ClipboardList className="h-6 w-6 text-primary" />
                        <div>
                            <p className="text-muted-foreground">Tests Attempted</p>
                            <p className="font-semibold">{studentResults.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        <div>
                            <p className="text-muted-foreground">Average Score</p>
                            <p className="font-semibold">{averageScore}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Test History</CardTitle>
                    <CardDescription>
                        A log of all tests attempted by {student.fullName}.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {studentResults.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Test Title</TableHead>
                                    <TableHead className="text-center">Score</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentResults.map(result => {
                                    const test = tests?.find(t => t.id === result.testId);
                                    if (!test) return null;
                                    const maxScore = test.questions.length * (test.marksPerCorrect || 1);
                                    const submissionDate = new Date(result.submittedAt).toLocaleDateString();
                                    return (
                                        <TableRow key={`${result.testId}-${result.userId}`}>
                                            <TableCell className="font-medium">{test.title}</TableCell>
                                            <TableCell className="text-center">{result.score} / {maxScore}</TableCell>
                                            <TableCell>{submissionDate}</TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="link">
                                                    <Link href={`/results/${result.testId}?userId=${student.id}`}>View Full Report</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">This student has not attempted any tests yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


export default function StudentProgressPage() {
    return (
        <Suspense fallback={<p>Loading student report...</p>}>
          <StudentProgressReport />
        </Suspense>
    );
}
