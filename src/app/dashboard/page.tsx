
"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AuthGuard } from '@/components/auth-guard';
import { type Test, type Result, type Category, type Report } from '@/lib/types';
import { Library, FolderSymlink, Zap, Languages as LanguagesIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge';
import ReportChatDialog from '@/components/report-chat-dialog';
import { useRouter, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { FeedbackCarousel } from '@/components/feedback-carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { useTests, useCategories, useResults, useReports, useUser } from '@/hooks/use-data';

function formatUserCount(count?: number) {
    if (!count) return '0';
    if (count < 1000) return count.toString();
    return `${(count / 1000).toFixed(1)}k`;
}

function TestSeriesList() {
    const router = useRouter();
    const { data: tests, isLoading: isLoadingTests } = useTests();
    const { data: categories, isLoading: isLoadingCategories } = useCategories();

    const isLoading = isLoadingTests || isLoadingCategories;

    const uncategorizedCount = useMemo(() => {
        if (!tests || !categories) return 0;
        const categorizedIds = new Set(categories.map(c => c.id));
        return tests.filter(t => !t.categoryId || !categorizedIds.has(t.categoryId)).length;
    }, [tests, categories]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
            </div>
        )
    }

    if ((categories?.length || 0) === 0 && uncategorizedCount === 0) {
        return (
            <Card className="text-center py-12">
                <CardHeader>
                    <CardTitle>No Test Series Available</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The admin has not added any tests yet. Check back later!</p>
                </CardContent>
            </Card>
        )
    }

    const uncategorizedTests = uncategorizedCount > 0 ? (
        <Card 
            className="flex flex-col w-full overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-dashed"
            onClick={() => router.push('/tests/uncategorized')}
        >
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FolderSymlink/> Uncategorized</CardTitle>
                <CardDescription>{uncategorizedCount} test(s) available</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                 <p className="text-muted-foreground">Tests not assigned to a category.</p>
            </CardContent>
             <CardFooter>
                <Button variant="secondary" className="w-full">View Tests &rarr;</Button>
            </CardFooter>
        </Card>
    ) : null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories?.map(category => (
                 <Card 
                    key={category.id} 
                    className="flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-card/80 backdrop-blur-sm border-primary/10 shadow-lg hover:shadow-primary/20"
                    onClick={() => router.push(`/tests/${category.id}`)}
                >
                    {category.bannerImageUrl && (
                        <div className="relative w-full h-32">
                            <Image
                                src={category.bannerImageUrl}
                                alt={`${category.name} banner`}
                                layout="fill"
                                objectFit="cover"
                                data-ai-hint="banner abstract"
                                className="object-center"
                            />
                        </div>
                    )}
                    <div className="flex justify-between items-center p-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                            <AvatarImage src={category.logoImageUrl} alt={category.name} data-ai-hint="logo company" />
                            <AvatarFallback>{category.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {category.userCount && (
                             <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
                                <Zap className="h-4 w-4 mr-1" />
                                {formatUserCount(category.userCount)} Users
                            </Badge>
                        )}
                    </div>
                    <CardContent className="flex-grow space-y-3">
                        <h3 className="text-lg font-bold">{category.name}</h3>
                        {category.description && (
                            <p className="text-sm text-green-600 font-semibold">{category.description}</p>
                        )}
                        {category.languages && (
                             <div className="flex items-center text-xs text-muted-foreground gap-1">
                                <LanguagesIcon className="h-4 w-4" />
                                <span>{category.languages}</span>
                            </div>
                        )}
                        
                        <Separator />

                        <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                            {category.features?.slice(0, 3).map((feature, index) => (
                                <li key={index} className="truncate list-disc">{feature}</li>
                            ))}
                             {category.features && category.features.length > 3 && (
                                <li className="font-semibold text-primary/80 list-disc">&#43;{category.features.length - 3} more tests</li>
                            )}
                        </ul>
                    </CardContent>
                     <CardFooter>
                        <Button className="w-full bg-[#00BFFF] hover:bg-[#00a6d9] text-white font-bold">View Test Series</Button>
                    </CardFooter>
                </Card>
            ))}
            {uncategorizedTests}
        </div>
    );
}

function MyProgressTab() {
    const user = useUser();
    const { data: tests, isLoading: isLoadingTests } = useTests();
    const { data: results, isLoading: isLoadingResults } = useResults();

    const isLoading = isLoadingTests || isLoadingResults;

    const userResults = useMemo(() => {
        if (!user || !results) return [];
        return results.filter(r => r.userId === user.id);
    }, [user, results]);

    if (isLoading) {
        return <Card><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>;
    }

    if (userResults.length === 0) {
        return (
            <Card className="text-center py-12">
                 <CardHeader>
                    <CardTitle>No Tests Attempted Yet</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Your progress report will appear here once you complete a test.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Progress Report</CardTitle>
                <CardDescription>A summary of the tests you have completed.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
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
                            {userResults.map(result => {
                                const test = tests?.find(t => t.id === result.testId);
                                if (!test) return null;
                                const marksPerCorrect = test.marksPerCorrect || 1;
                                const maxScore = test.questions.length * marksPerCorrect;
                                const submissionDate = new Date(result.submittedAt).toLocaleDateString();
                                return (
                                    <TableRow key={`${result.testId}-${result.userId}`}>
                                        <TableCell className="font-medium">{test.title}</TableCell>
                                        <TableCell className="text-center">{result.score} / {maxScore}</TableCell>
                                        <TableCell>{submissionDate}</TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild variant="link">
                                                <Link href={`/results/${result.testId}`}>View Report</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

function MyReportsTab() {
    const user = useUser();
    const { data: reports, updateItem: updateReport, isLoading } = useReports();
    const [viewingReport, setViewingReport] = useState<Report | null>(null);

    const userReports = useMemo(() => {
        if (!user || !reports) return [];
        return reports.filter(r => r.studentId === user.id).sort((a,b) => b.createdAt - a.createdAt);
    }, [user, reports]);


    const handleUpdate = useCallback((updatedReport: Report) => {
        updateReport(updatedReport);
        setViewingReport(updatedReport);
    }, [updateReport]);

    if (isLoading) {
        return <Card><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>;
    }

    if (userReports.length === 0) {
        return <p className="text-muted-foreground text-center py-8">You have not reported any issues yet.</p>;
    }

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>My Reported Issues</CardTitle>
                <CardDescription>Here is a list of all the questions you have reported.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Test</TableHead>
                                <TableHead>Question</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userReports.map(report => (
                                 <TableRow key={report.id}>
                                    <TableCell className="font-medium max-w-xs truncate">{report.testTitle}</TableCell>
                                    <TableCell className="max-w-xs truncate">{report.questionText}</TableCell>
                                    <TableCell>{report.reason}</TableCell>
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
                </div>
            </CardContent>
        </Card>
        <ReportChatDialog
            isOpen={!!viewingReport}
            onClose={() => setViewingReport(null)}
            report={viewingReport}
            onUpdate={handleUpdate}
            role="student"
        />
        </>
    );
}

function DashboardContent() {
  const user = useUser();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'series';

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Welcome back, {user?.fullName}!</h1>
        <p className="text-muted-foreground">Here are your available tests and progress.</p>
      </div>
      
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
            <TabsTrigger value="series">Test Series</TabsTrigger>
            <TabsTrigger value="progress">My Progress</TabsTrigger>
            <TabsTrigger value="reports">My Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="series" className="pt-6">
            <TestSeriesList />
        </TabsContent>
        <TabsContent value="progress" className="pt-6">
            <MyProgressTab />
        </TabsContent>
        <TabsContent value="reports" className="pt-6">
             <MyReportsTab />
        </TabsContent>
      </Tabs>

      <FeedbackCarousel />
    </div>
  );
}

export default function DashboardPage() {
    return (
        <AuthGuard>
            <Suspense fallback={<p>Loading dashboard...</p>}>
                <DashboardContent />
            </Suspense>
        </AuthGuard>
    );
}
