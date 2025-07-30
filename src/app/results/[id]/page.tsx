
"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { type Test, type Question as QuestionType, type Result, type User, type Report, type ChatMessage } from '@/lib/types';
import { useReports, useAllUsers, useTests, useResults, useUser } from '@/hooks/use-data';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, CheckCircle, Clock, Lightbulb, XCircle, FileDown, MinusCircle, Flag } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';


const reportSchema = z.object({
  reason: z.string().min(1, "Please select a reason."),
  remarks: z.string().optional(),
});
type ReportFormData = z.infer<typeof reportSchema>;

function RaiseObjectionDialog({ isOpen, onClose, question, test, user, onSubmit }: { isOpen: boolean; onClose: () => void; question: QuestionType | null; test: Test | null; user: User | null, onSubmit: (report: Report) => void }) {
    const { toast } = useToast();
    const form = useForm<ReportFormData>({
        resolver: zodResolver(reportSchema),
        defaultValues: { reason: "", remarks: "" },
    });
    
    useEffect(() => {
        if (!isOpen) {
            form.reset();
        }
    }, [isOpen, form]);

    if (!question || !test || !user) return null;

    const handleReportSubmit = (data: ReportFormData) => {
        try {
            const chatMessage: ChatMessage = {
                sender: 'student',
                message: `Reason: ${data.reason}\nRemarks: ${data.remarks || 'N/A'}`,
                timestamp: Date.now(),
            };

            const newReport: Report = {
                id: Date.now().toString(),
                studentId: user.id,
                studentName: user.fullName,
                testId: test.id,
                testTitle: test.title,
                questionId: question.id,
                questionText: question.text,
                reason: data.reason,
                remarks: data.remarks || '',
                status: 'pending',
                chat: [chatMessage],
                createdAt: Date.now(),
            };

            onSubmit(newReport);
            toast({ title: "Objection Raised", description: "Your objection has been submitted to the admin." });
            onClose();
        } catch (error) {
            toast({ title: "Error", description: "Failed to submit your objection.", variant: "destructive" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Raise an Objection</DialogTitle>
                    <DialogDescription>
                        Objection for: "{question.text.substring(0, 50)}..."
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleReportSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason for Objection</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Incorrect question">Incorrect question</SelectItem>
                                            <SelectItem value="Wrong answer in options">Wrong answer is marked as correct</SelectItem>
                                            <SelectItem value="Multiple correct answers">Multiple correct answers</SelectItem>
                                            <SelectItem value="Unclear image or diagram">Unclear image or diagram</SelectItem>
                                            <SelectItem value="Spelling or grammar errors">Spelling or grammar errors</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="remarks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Comments/Evidence (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Provide more details about the issue." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit">Submit Objection</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

interface RankedResult extends Result {
  rank: number;
  userFullName: string;
}

function LoadingSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-8 p-4 bg-background">
                <Card>
                    <CardHeader><Skeleton className="h-10 w-3/4 mx-auto" /></CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                    <CardFooter className="grid grid-cols-1 md:grid-cols-3 gap-2">
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-full" />
                    </CardFooter>
                </Card>
                <Card><CardHeader><Skeleton className="h-8 w-1/2 mx-auto" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
            </div>
             <div className='text-center space-x-4'>
                <Skeleton className="h-12 w-36 inline-block" />
                <Skeleton className="h-12 w-48 inline-block" />
            </div>
        </div>
    );
}

function ResultsContent() {
  const params = useParams<{ id: string }>();
  const testId = params.id;
  const searchParams = useSearchParams();
  const adminViewedUserId = searchParams.get('userId');

  const user = useUser();
  const { data: tests, isLoading: isLoadingTests } = useTests();
  const { data: allResults, isLoading: isLoadingResults } = useResults();
  const { allUsers, isLoading: isLoadingAllUsers } = useAllUsers();
  const { updateItem: updateReport, isLoading: isLoadingReports } = useReports();
  
  const isLoading = isLoadingTests || isLoadingResults || isLoadingAllUsers || isLoadingReports;

  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);

  const [test, setTest] = useState<Test | null>(null);
  const [currentUserResult, setCurrentUserResult] = useState<RankedResult | null>(null);
  const [rankings, setRankings] = useState<RankedResult[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [objectionQuestion, setObjectionQuestion] = useState<QuestionType | null>(null);

  const viewingUserId = useMemo(() => {
    return (user?.role === 'admin' && adminViewedUserId) ? adminViewedUserId : user?.id;
  }, [user, adminViewedUserId]);

  const pdfLibraries = useMemo(() => {
    if (typeof window !== 'undefined') {
      return {
        jsPDF: () => import('jspdf'),
        html2canvas: () => import('html2canvas'),
      };
    }
    return null;
  }, []);

  useEffect(() => {
    if (isLoading || !viewingUserId || !testId || !tests || !allUsers || !allResults) return;

    if (user?.role === 'student' && adminViewedUserId && user.id !== adminViewedUserId) {
        router.push('/dashboard');
        return;
    }
    
    try {
        const testResults = allResults.filter(r => r.testId === testId);
        
        const sortedResults = [...testResults].sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.timeTaken - b.timeTaken;
        });

        const rankedResults: RankedResult[] = sortedResults.map((r, index) => {
            const resultUser = allUsers.find(u => u.id === r.userId);
            return { ...r, rank: index + 1, userFullName: resultUser?.fullName || 'N/A' };
        });
        setRankings(rankedResults);
        
        const userRes = rankedResults.find(r => r.userId === viewingUserId);
        const currentTest = tests.find(t => t.id === testId);
        
        if (!userRes || !currentTest) {
            setCurrentUserResult(null);
            setTest(null);
        } else {
            setCurrentUserResult(userRes);
            setTest(currentTest);
        }

    } catch (e) {
        console.error("Failed to process results", e);
        router.push('/dashboard');
    }

  }, [isLoading, testId, viewingUserId, user, router, adminViewedUserId, tests, allUsers, allResults]);

  const handleDownload = async () => {
    const input = reportRef.current;
    if (!input || isDownloading || !pdfLibraries) return;

    setIsDownloading(true);
    try {
      const { default: jsPDF } = await pdfLibraries.jsPDF();
      const { default: html2canvas } = await pdfLibraries.html2canvas();

      const canvas = await html2canvas(input, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / pdfWidth;
      const imgHeight = canvasHeight / ratio;
      const pdfHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(`Test-Report-${test?.title.replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
        console.error("PDF generation failed:", err);
    } finally {
        setIsDownloading(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!currentUserResult || !test) {
    return (
        <div className="text-center py-12">
            <Card>
                <CardHeader><CardTitle>No Results Found</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The specified user has not attempted this test.</p>
                    <Button asChild className="mt-4">
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  const { correctCount, wrongCount, unansweredCount, score, timeTaken } = currentUserResult;
  const { marksPerCorrect = 1, negativeMarksPerWrong = 0 } = test;
  const maxScore = test.questions.length * marksPerCorrect;
  const viewingOwnResult = currentUserResult.userId === user?.id;

  return (
    <div className="space-y-8">
      <div ref={reportRef} className="space-y-8 p-4 bg-background">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">Test Results: {test.title}</CardTitle>
            {!viewingOwnResult && <CardDescription className="text-center font-semibold">Viewing Report for: {currentUserResult.userFullName}</CardDescription>}
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-secondary rounded-lg">
              <Trophy className="mx-auto h-8 w-8 text-primary" />
              <div className="text-2xl font-bold">{currentUserResult.rank}</div>
              <div className="text-muted-foreground">Rank</div>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
                <div className="flex items-center justify-center gap-2">
                    <div className="text-2xl font-bold">{score}</div>
                    <div className="text-muted-foreground">/ {maxScore}</div>
                </div>
                <div className="text-muted-foreground">Final Score</div>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="text-2xl font-bold">{Math.floor(timeTaken / 60)}m {timeTaken % 60}s</div>
              <div className="text-muted-foreground">Time Taken</div>
            </div>
          </CardContent>
           <CardFooter className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-center">
                <div className="flex items-center justify-center gap-2 p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Correct: {correctCount} (+{correctCount * marksPerCorrect} Marks)</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-md">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span>Wrong: {wrongCount} ({wrongCount * negativeMarksPerWrong} Marks)</span>
                </div>
                <div className="flex items-center justify-center gap-2 p-2 bg-gray-100 dark:bg-gray-700/30 rounded-md">
                    <MinusCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span>Unanswered: {unansweredCount} ({unansweredCount * negativeMarksPerWrong} Marks)</span>
                </div>
           </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2"><Lightbulb className="text-accent" /> AI Motivation Box</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert>
                    <AlertDescription className="prose prose-lg dark:prose-invert max-w-none text-center">
                        <p>"सफलता की पहली सीढ़ी मेहनत है।"</p>
                        <p className="text-sm text-muted-foreground mt-2">"The first step to success is hard work."</p>
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle>Detailed Review</CardTitle>
            <CardDescription>Review of the answers for each question.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {test.questions.map((q, index) => {
              const userAnswer = currentUserResult.answers[q.id];
              const isCorrect = userAnswer === q.correctAnswer;
              return (
                <div key={q.id}>
                  <div className="flex items-start gap-3">
                    {isCorrect ? <CheckCircle className="h-5 w-5 text-green-500 mt-1" /> : (userAnswer ? <XCircle className="h-5 w-5 text-destructive mt-1" /> : <MinusCircle className="h-5 w-5 text-muted-foreground mt-1" />)}
                    <h4 className="font-semibold text-lg flex-1">Q{index + 1}: {q.text}</h4>
                    {viewingOwnResult && user && (
                         <Button variant="outline" size="sm" onClick={() => setObjectionQuestion(q)}>
                            <Flag className="mr-2 h-4 w-4" /> Raise Objection
                        </Button>
                    )}
                  </div>
                   {q.imageUrl && (
                    <div className="relative w-full max-w-md h-64 my-4 ml-8 rounded-md overflow-hidden border">
                         <Image src={q.imageUrl} alt={`Question ${index + 1} image`} layout="fill" objectFit="contain" data-ai-hint="diagram illustration" />
                    </div>
                   )}
                  <div className="mt-4 space-y-2 pl-8">
                    {q.options.map((opt, optionIndex) => {
                       const isUserAnswer = opt === userAnswer;
                       const isCorrectAnswer = opt === q.correctAnswer;
                       return (
                         <div
                           key={`${q.id}-opt-${optionIndex}`}
                           className={cn(
                             "p-3 border rounded-md text-sm",
                             isCorrectAnswer && "bg-green-100 border-green-400 text-green-900 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300",
                             isUserAnswer && !isCorrectAnswer && "bg-red-100 border-red-400 text-red-900 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300",
                           )}
                         >
                           {isCorrectAnswer && <span className="font-bold">Correct Answer: </span>}
                           {isUserAnswer && !isCorrectAnswer && <span className="font-bold">Your Answer: </span>}
                           {opt}
                         </div>
                       );
                    })}
                  </div>
                  {!userAnswer && (
                     <Alert variant="destructive" className="mt-4 ml-8">
                        <AlertDescription>This question was not answered and received negative marks (if applicable).</AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
            <CardDescription>Comparison with other students.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Time Taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.slice(0, 10).map((r) => (
                  <TableRow key={r.userId} className={r.userId === viewingUserId ? 'bg-primary/20' : ''}>
                    <TableCell className="font-medium">{r.rank}</TableCell>
                    <TableCell>{r.userFullName}</TableCell>
                    <TableCell>{r.score} / {maxScore}</TableCell>
                    <TableCell>{Math.floor(r.timeTaken / 60)}m {r.timeTaken % 60}s</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className='text-center space-x-4'>
        {viewingOwnResult ? (
            <Button asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
        ) : (
            <Button onClick={() => router.back()}>Back to Student Report</Button>
        )}
        <Button variant="outline" onClick={handleDownload} disabled={isDownloading || !pdfLibraries}>
            <FileDown className="mr-2 h-4 w-4" />
            {isDownloading ? 'Downloading...' : 'Download as PDF'}
        </Button>
      </div>
      {user && (
          <RaiseObjectionDialog 
            isOpen={!!objectionQuestion}
            onClose={() => setObjectionQuestion(null)}
            question={objectionQuestion}
            test={test}
            user={user}
            onSubmit={updateReport}
          />
      )}
    </div>
  );
}

export default function ResultsPage() {
    return (
        <AuthGuard>
            <Suspense fallback={<LoadingSkeleton />}>
                <ResultsContent />
            </Suspense>
        </AuthGuard>
    );
}
