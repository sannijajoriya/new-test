
"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { type Test, type Question as QuestionType, type Result, type Report, type User, type ChatMessage } from '@/lib/types';
import { AuthGuard } from '@/components/auth-guard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Flag, Library, Clock, ListChecks, Hash, Edit } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useTests, useCategories, useResults, useReports, useUser } from '@/hooks/use-data';

const reportSchema = z.object({
  reason: z.string().min(1, "Please select a reason."),
  remarks: z.string().optional(),
});
type ReportFormData = z.infer<typeof reportSchema>;

function TestSummary({ test, categoryName }: { test: Test, categoryName: string }) {
    const { questions, duration, marksPerCorrect } = test;
    const maxScore = questions.length * (marksPerCorrect || 1);

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-2xl">{test.title}</CardTitle>
                <CardDescription>Review the test details below.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Library className="h-5 w-5 mt-1 text-primary" />
                    <div>
                        <p className="text-muted-foreground">Category</p>
                        <p className="font-semibold">{categoryName}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <ListChecks className="h-5 w-5 mt-1 text-primary" />
                    <div>
                        <p className="text-muted-foreground">Questions</p>
                        <p className="font-semibold">{questions.length}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Clock className="h-5 w-5 mt-1 text-primary" />
                    <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-semibold">{duration} mins</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Hash className="h-5 w-5 mt-1 text-primary" />
                    <div>
                        <p className="text-muted-foreground">Max Marks</p>
                        <p className="font-semibold">{maxScore}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RaiseObjectionDialog({ isOpen, onClose, question, test, user, onUpdateReport }: { isOpen: boolean; onClose: () => void; question: QuestionType | null; test: Test | null; user: User | null; onUpdateReport: (report: Report) => void; }) {
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

            onUpdateReport(newReport);
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

const QuestionPalette = ({
  questions,
  currentQuestionIndex,
  answers,
  onQuestionSelect,
  isPreview = false
}: {
  questions: QuestionType[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  onQuestionSelect: (index: number) => void;
  isPreview?: boolean;
}) => {
  return (
    <div className="hidden md:block w-64">
      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-96">
                <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, index) => (
                    <Button
                        key={q.id}
                        variant={currentQuestionIndex === index ? 'default' : (isPreview ? 'secondary' : (answers[q.id] ? 'secondary' : 'outline'))}
                        className={cn(
                            "h-10 w-10 p-0",
                            !isPreview && answers[q.id] && answers[q.id] !== 'Not Attempted' && "bg-green-200 hover:bg-green-300 text-green-800 dark:bg-green-800 dark:hover:bg-green-700 dark:text-green-100",
                            !isPreview && answers[q.id] === 'Not Attempted' && "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100",
                            currentQuestionIndex === index && "ring-2 ring-primary-foreground ring-offset-2"
                        )}
                        onClick={() => onQuestionSelect(index)}
                    >
                        {index + 1}
                    </Button>
                    ))}
                </div>
            </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

const MobileQuestionPalette = ({
  questions,
  currentQuestionIndex,
  answers,
  onQuestionSelect,
  isPreview = false
}: {
  questions: QuestionType[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  onQuestionSelect: (index: number) => void;
  isPreview?: boolean;
}) => {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-2 z-50">
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                    {questions.map((q, index) => (
                    <Button
                        key={q.id}
                        size="icon"
                        variant={currentQuestionIndex === index ? 'default' : (isPreview ? 'secondary' : (answers[q.id] ? 'secondary' : 'outline'))}
                        className={cn(
                            "h-9 w-9 p-0 flex-shrink-0",
                             !isPreview && answers[q.id] && answers[q.id] !== 'Not Attempted' && "bg-green-200 hover:bg-green-300 text-green-800 dark:bg-green-800 dark:hover:bg-green-700 dark:text-green-100",
                             !isPreview && answers[q.id] === 'Not Attempted' && "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100",
                            currentQuestionIndex === index && "ring-2 ring-primary-foreground ring-offset-2"
                        )}
                        onClick={() => onQuestionSelect(index)}
                    >
                        {index + 1}
                    </Button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}

function GuidelinesScreen({ test, categoryName, onStartTest }: { test: Test, categoryName: string, onStartTest: () => void }) {
    return (
        <div className="w-full max-w-3xl mx-auto">
            <TestSummary test={test} categoryName={categoryName} />
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Guidelines</CardTitle>
                    <CardDescription>Please read the guidelines carefully before starting.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-md prose prose-sm dark:prose-invert max-w-none">
                        <p className="whitespace-pre-line">{test.guidelines || 'No specific guidelines provided for this test.'}</p>
                    </div>
                     <div className="p-4 border-l-4 border-destructive bg-destructive/10 rounded-md">
                        <h4 className="font-bold text-destructive">Important Scoring Note</h4>
                        <p className="text-sm text-destructive/80 mt-1">
                            Any question that is left unanswered (i.e., no option selected) will be treated as incorrect and will incur negative marks if applicable. To skip a question without penalty, you must select the "Not Attempted" option.
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={onStartTest} className="w-full">
                        I am ready to start the test
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

function ActiveTestUI({
    test,
    user,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    setAnswers,
    timeLeft,
    onSubmit,
    isPreview = false
}: {
    test: Test;
    user: User;
    currentQuestionIndex: number;
    setCurrentQuestionIndex: (index: number | ((prev: number) => number)) => void;
    answers: Record<string, string>;
    setAnswers: (answers: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
    timeLeft: number | null;
    onSubmit: () => void;
    isPreview?: boolean;
}) {
    const [showSubmitConfirmDialog, setShowSubmitConfirmDialog] = useState(false);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [questionToReport, setQuestionToReport] = useState<QuestionType | null>(null);
    const { updateItem: updateReport } = useReports();

    const currentQuestion: QuestionType = test.questions[currentQuestionIndex];

    const handleSelectOption = (option: string) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
    };

    const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
    const seconds = timeLeft !== null ? timeLeft % 60 : 0;
    const progress = timeLeft !== null ? ((test.duration * 60 - timeLeft) / (test.duration * 60)) * 100 : 0;

    return (
        <>
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 w-full">
                    <Card className="w-full">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl">{test.title}</CardTitle>
                                    <CardDescription>Question {currentQuestionIndex + 1} of {test.questions.length}</CardDescription>
                                </div>
                                {!isPreview && timeLeft !== null && (
                                    <div className="text-right">
                                        <div className="text-lg font-semibold tabular-nums text-destructive">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</div>
                                        <div className="text-sm text-muted-foreground">Time Left</div>
                                    </div>
                                )}
                                {isPreview && (
                                     <Badge variant="secondary">Preview Mode</Badge>
                                )}
                            </div>
                           {!isPreview && <Progress value={progress} className="w-full mt-2" />}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6 min-h-[200px] mb-16 md:mb-0">
                                <p className="text-lg font-medium">{currentQuestion.text}</p>
                                {currentQuestion.imageUrl && (
                                     <div className="relative w-full max-w-md h-64 mx-auto rounded-md overflow-hidden border">
                                         <Image src={currentQuestion.imageUrl} alt={`Question ${currentQuestionIndex + 1} image`} layout="fill" objectFit="contain" data-ai-hint="diagram illustration" />
                                     </div>
                                )}
                                <RadioGroup onValueChange={handleSelectOption} value={answers[currentQuestion.id] || ''} className="space-y-3" disabled={isPreview}>
                                    {currentQuestion.options.map((option, index) => (
                                        <div key={index} className="flex items-center space-x-3 p-3 rounded-md border has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-colors">
                                            <RadioGroupItem value={option} id={`option-${index}`} />
                                            <Label htmlFor={`option-${index}`} className="text-base font-normal cursor-pointer flex-1">{option}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                                {!isPreview && (
                                    <div className="mt-4 text-center">
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-xs text-muted-foreground h-auto p-1"
                                            onClick={() => {
                                                setQuestionToReport(currentQuestion);
                                                setIsReportDialogOpen(true);
                                            }}
                                        >
                                            <Flag className="mr-1 h-3 w-3" /> Raise Objection
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button 
                                variant="outline" 
                                onClick={() => setCurrentQuestionIndex(p => p - 1)} 
                                disabled={currentQuestionIndex === 0}
                            >
                                Previous
                            </Button>

                           {!isPreview && currentQuestionIndex === test.questions.length - 1 ? (
                                <Button onClick={() => setShowSubmitConfirmDialog(true)}>Submit</Button>
                            ) : (
                                <Button onClick={() => setCurrentQuestionIndex(p => p + 1)} disabled={currentQuestionIndex === test.questions.length - 1}>
                                    Next
                                </Button>
                            )}

                             {isPreview && (
                                <Button asChild>
                                    <Link href="/admin/tests">Back to Tests</Link>
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
                
                <QuestionPalette 
                    questions={test.questions} 
                    currentQuestionIndex={currentQuestionIndex} 
                    answers={answers} 
                    onQuestionSelect={setCurrentQuestionIndex}
                    isPreview={isPreview}
                />
                
                <MobileQuestionPalette
                    questions={test.questions} 
                    currentQuestionIndex={currentQuestionIndex} 
                    answers={answers} 
                    onQuestionSelect={setCurrentQuestionIndex}
                    isPreview={isPreview}
                />
            </div>
             <AlertDialog open={showSubmitConfirmDialog} onOpenChange={setShowSubmitConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You cannot change your answers after submitting. Any unanswered questions will receive negative marks if applicable.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onSubmit}>Submit Test</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {user && (
                 <RaiseObjectionDialog
                    isOpen={isReportDialogOpen}
                    onClose={() => setIsReportDialogOpen(false)}
                    question={questionToReport}
                    test={test}
                    user={user}
                    onUpdateReport={updateReport}
                />
            )}
        </>
    );
}

function TestComponent() {
  const params = useParams<{ id: string }>();
  const testId = params.id;
  const router = useRouter();
  const user = useUser();
  const { toast } = useToast();
  
  const { data: tests, isLoading: isLoadingTests } = useTests();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: results, updateItem: updateResult, isLoading: isLoadingResults } = useResults();

  const [test, setTest] = useState<Test | null>(null);
  const [categoryName, setCategoryName] = useState('Uncategorized');
  const [testState, setTestState] = useState<'loading' | 'guidelines' | 'active' | 'attempted'>('loading');
  const [showStartConfirmDialog, setShowStartConfirmDialog] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(0);
  
  const isLoading = isLoadingTests || isLoadingCategories || isLoadingResults;

  useEffect(() => {
    if (!user || !testId || isLoading) return;
    
    const currentTest = tests?.find(t => t.id === testId);

    if (!currentTest) {
        router.push('/dashboard');
        return;
    }
    setTest(currentTest);

    const cat = categories?.find(c => c.id === currentTest.categoryId);
    if (cat) setCategoryName(cat.name);

    if (user.role === 'admin') {
        setTestState('active'); // Directly to active state for admin preview
        return;
    }

    const existingAttempt = results?.find(r => r.testId === testId && r.userId === user.id);
    if (existingAttempt) {
        setTestState('attempted');
    } else {
        setTestState('guidelines');
    }

  }, [testId, router, user, tests, categories, results, isLoading]);

  const handleSubmit = useCallback(() => {
    if (!test || !user || !startTime) return;

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    test.questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer && userAnswer !== 'Not Attempted') {
          if (userAnswer === q.correctAnswer) {
            correctCount++;
          } else {
            wrongCount++;
          }
      } else {
          unansweredCount++;
      }
    });

    const marksPerCorrect = test.marksPerCorrect || 1;
    const negativeMarksPerWrong = test.negativeMarksPerWrong || 0;
    
    const score = (correctCount * marksPerCorrect) + ((wrongCount + unansweredCount) * negativeMarksPerWrong);

    const newResult: Result = {
      id: `${user.id}_${test.id}`,
      testId: test.id,
      userId: user.id,
      score,
      correctCount,
      wrongCount,
      unansweredCount,
      timeTaken,
      answers,
      submittedAt: Date.now(),
    };
    
    updateResult(newResult);

    router.push(`/results/${test.id}`);
  }, [test, user, answers, startTime, router, updateResult]);

  useEffect(() => {
    if (timeLeft === null || testState !== 'active' || user?.role === 'admin') return;

    if (timeLeft <= 0) {
      toast({
        title: "Time's up!",
        description: "Your test has been submitted automatically.",
      })
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, testState, handleSubmit, toast, user]);

  const startTest = () => {
    if (!test) return;
    setTestState('active');
    setTimeLeft(test.duration * 60);
    setStartTime(Date.now());
  };

  if (testState === 'loading' || !test || !user || isLoading) {
    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (testState === 'attempted') {
    return (
        <Card className="w-full max-w-lg mx-auto text-center">
            <CardHeader>
                <CardTitle>Test Already Attempted</CardTitle>
                <CardDescription>You can only take each test once.</CardDescription>
            </CardHeader>
            <CardFooter className="flex-col gap-4">
                <Button onClick={() => router.push(`/results/${test.id}`)} className="w-full">
                    View Your Results
                </Button>
                <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">
                    Back to Dashboard
                </Button>
            </CardFooter>
        </Card>
    );
  }
  
  if (testState === 'guidelines') {
    return (
      <>
        <GuidelinesScreen test={test} categoryName={categoryName} onStartTest={() => setShowStartConfirmDialog(true)} />
        <AlertDialog open={showStartConfirmDialog} onOpenChange={setShowStartConfirmDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you are ready for the test?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={startTest}>Yes, Start Test</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  if (testState === 'active') {
      const isPreview = user.role === 'admin';
      return (
        <ActiveTestUI
            test={test}
            user={user}
            currentQuestionIndex={currentQuestionIndex}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
            answers={answers}
            setAnswers={setAnswers}
            timeLeft={timeLeft}
            onSubmit={handleSubmit}
            isPreview={isPreview}
        />
      );
  }

  return null; // Fallback
}

export default function TestPage() {
    return (
        <AuthGuard>
            <Suspense fallback={<p>Loading test...</p>}>
                <TestComponent />
            </Suspense>
        </AuthGuard>
    );
}
