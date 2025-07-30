
"use client";

import { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AuthGuard } from '@/components/auth-guard';
import { type Test, type Result, type Category } from '@/lib/types';
import { Clock, ListChecks, CheckCircle, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTests, useCategories, useResults, useUser } from '@/hooks/use-data';


function TestList({ categoryId }: { categoryId: string }) {
    const user = useUser();
    const { data: tests, isLoading: isLoadingTests } = useTests();
    const { data: categories, isLoading: isLoadingCategories } = useCategories();
    const { data: userResults, isLoading: isLoadingResults } = useResults();
    
    const [filteredTests, setFilteredTests] = useState<Test[]>([]);
    
    const isLoading = isLoadingTests || isLoadingCategories || isLoadingResults;

    const userAttemptedResults = useMemo(() => {
        if (!user || !userResults) return [];
        return userResults.filter(r => r.userId === user.id);
    }, [user, userResults]);

    useEffect(() => {
        if (isLoading || !tests) return;
        
        const testsInCategory = categoryId === 'uncategorized'
                ? tests.filter(t => !t.categoryId || !categories?.find(c => c.id === t.categoryId))
                : tests.filter(t => t.categoryId === categoryId);
        
        setFilteredTests(testsInCategory);
        
    }, [categoryId, tests, categories, isLoading]);


    if (isLoading) {
         return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
        )
    }

    if (filteredTests.length === 0) {
        return <p className="text-muted-foreground text-center py-8">No available tests in this category.</p>;
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTests.map((test) => {
                const result = userAttemptedResults.find(r => r.testId === test.id);
                const isAttempted = !!result;

                return (
                    <Card key={test.id} className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <CardHeader>
                            <CardTitle>{test.title}</CardTitle>
                            <CardDescription>A test to challenge your knowledge.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <ListChecks className="h-4 w-4" />
                                <span>{test.questions.length} Questions</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{test.duration} Minutes</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col items-start gap-2">
                            {isAttempted && result ? (
                                <>
                                 <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                                    <CheckCircle className="mr-1 h-3 w-3"/>
                                    Attempted on {new Date(result.submittedAt).toLocaleDateString()}
                                 </Badge>
                                 <Button asChild className="w-full" variant="outline">
                                    <Link href={`/results/${test.id}`}>View Result</Link>
                                 </Button>
                                </>
                            ) : (
                                <>
                                 <Badge variant="secondary">Not Attempted</Badge>
                                <Button asChild className="w-full">
                                    <Link href={`/test/${test.id}`}>Start Test</Link>
                                </Button>
                                </>
                            )}
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    )
}

function TestsByCategoryContent() {
    const params = useParams<{ categoryId: string }>();
    const categoryId = params.categoryId;
    const router = useRouter();

    const { data: categories, isLoading } = useCategories();
    const [category, setCategory] = useState<Category | null>(null);

    useEffect(() => {
        if (!categoryId || isLoading || !categories) return;
        
        const categoryInfo = categories.find(c => c.id === categoryId);
        setCategory(categoryInfo || (categoryId === 'uncategorized' ? {id: 'uncategorized', name: 'Uncategorized'} : null));
       
    }, [categoryId, categories, isLoading]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-8 w-1/3" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                </div>
            </div>
        );
    }
    
    if (!category) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Category Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The test category you are looking for does not exist.</p>
                    <Button onClick={() => router.push('/dashboard')} variant="link" className="mt-4">
                        Back to Dashboard
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Test Series</Button>
            <div>
                 <h1 className="text-3xl font-bold">{category.name}</h1>
                 <p className="text-muted-foreground">Browse all tests available in this category.</p>
            </div>
            <TestList categoryId={categoryId} />
        </div>
    )
}

export default function TestsByCategoryPage() {
    return (
        <AuthGuard>
            <Suspense fallback={<p>Loading tests...</p>}>
                <TestsByCategoryContent />
            </Suspense>
        </AuthGuard>
    )
}
