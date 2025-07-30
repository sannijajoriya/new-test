
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Lightbulb, Edit, FilePenLine, FileUp, ClipboardPaste, Library, ArrowRight, Eye, ArrowLeft, FolderPlus, FolderSymlink } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Test, Category } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as pdfjs from 'pdfjs-dist';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ImageUploader } from '@/components/image-uploader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLoading } from '@/hooks/use-loading';
import { useTests, useCategories } from '@/hooks/use-data';
import { Skeleton } from '@/components/ui/skeleton';


const optionSchema = z.object({ value: z.string().min(1, 'Option cannot be empty') });

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Question text cannot be empty'),
  imageUrl: z.string().optional().or(z.literal('')),
  options: z.array(optionSchema).min(1, 'Must have at least one option').max(5, 'Cannot have more than 5 options'),
  correctAnswer: z.string({ required_error: 'Please select a correct answer.' }),
});

const testSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  duration: z.coerce.number().positive('Duration must be positive').min(1, 'Duration must be at least 1 minute'),
  marksPerCorrect: z.coerce.number().default(1),
  negativeMarksPerWrong: z.coerce.number().default(0),
  questions: z.array(questionSchema).min(1, 'Must have at least one question'),
  guidelines: z.string().optional(),
  categoryId: z.string({ required_error: 'Please select a category.' }).min(1, "Category is required."),
});

const categorySchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, 'Category name must be at least 2 characters.'),
    logoImageUrl: z.string().optional(),
    bannerImageUrl: z.string().optional(),
    userCount: z.coerce.number().min(0, "User count cannot be negative").optional(),
    description: z.string().optional(),
    languages: z.string().optional(),
    features: z.string().optional(), // Admin will enter comma-separated values
});


type TestFormData = z.infer<typeof testSchema>;
type CategoryFormData = z.infer<typeof categorySchema>;


function ExistingTestsTable({ tests, categories, onEdit, onDelete }: { tests: Test[], categories: Category[], onEdit: (test: Test) => void, onDelete: (test: Test) => void }) {
    if (tests.length === 0) {
        return (
            <CardContent>
                <p className="text-muted-foreground py-8 text-center">No tests found in this category. Add one using the forms below!</p>
            </CardContent>
        );
    }

    const getCategoryName = (categoryId?: string) => {
        if (!categoryId) return 'Uncategorized';
        return categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
    }

    return (
        <CardContent>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-center">Questions</TableHead>
                            <TableHead className="text-center">Duration</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tests.map(test => (
                            <TableRow key={test.id}>
                                <TableCell className="font-medium">{test.title}</TableCell>
                                <TableCell>{getCategoryName(test.categoryId)}</TableCell>
                                <TableCell className="text-center">{test.questions.length}</TableCell>
                                <TableCell className="text-center">{test.duration} min</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="icon" asChild>
                                        <Link href={`/test/${test.id}`} target="_blank"><Eye className="h-4 w-4" /></Link>
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => onEdit(test)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="destructive" size="icon" onClick={() => onDelete(test)}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    )
}

function EditTestDialog({ test, isOpen, onClose, onSave, categories }: { test: Test, isOpen: boolean, onClose: () => void, onSave: (data: Test) => void, categories: Category[] }) {
    const form = useForm<TestFormData>({
        resolver: zodResolver(testSchema),
        mode: 'onChange',
    });

    useEffect(() => {
        if (test) {
            form.reset({
                id: test.id,
                title: test.title,
                duration: test.duration,
                marksPerCorrect: test.marksPerCorrect || 1,
                negativeMarksPerWrong: test.negativeMarksPerWrong || 0,
                guidelines: test.guidelines || '',
                categoryId: test.categoryId,
                questions: test.questions.map(q => ({
                    id: q.id,
                    text: q.text,
                    imageUrl: q.imageUrl || '',
                    options: q.options.map(opt => ({ value: opt })),
                    correctAnswer: q.correctAnswer,
                }))
            });
        }
    }, [test, form]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'questions',
    });

    const onSubmit = (data: TestFormData) => {
        const updatedTest: Test = {
            ...test,
            title: data.title,
            duration: data.duration,
            marksPerCorrect: data.marksPerCorrect,
            negativeMarksPerWrong: data.negativeMarksPerWrong,
            guidelines: data.guidelines,
            categoryId: data.categoryId,
            questions: data.questions.map((q, index) => ({
                id: q.id || `${test.id}-${index}`,
                text: q.text,
                imageUrl: q.imageUrl,
                options: q.options.map(opt => opt.value),
                correctAnswer: q.correctAnswer,
            })),
        };
        onSave(updatedTest);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Test: {test.title}</DialogTitle>
                    <DialogDescription>
                        Make changes to your test here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-4">
                        <Card>
                            <CardContent className="space-y-4 pt-6">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Test Title</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="categoryId"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select a category for this test" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                <FormField
                                    control={form.control}
                                    name="duration"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duration (in minutes)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="marksPerCorrect"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Marks per Correct</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="negativeMarksPerWrong"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Negative Marks</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="guidelines"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Test Guidelines</FormLabel>
                                        <FormControl><Textarea rows={4} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {fields.map((field, index) => (
                            <QuestionField key={field.id} form={form} questionIndex={index} removeQuestion={remove} />
                        ))}

                        <div className="flex justify-start">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => append({ text: '', imageUrl: '', options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: 'Not Attempted' }], correctAnswer: '' })}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Question
                            </Button>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function QuestionField({ form, questionIndex, removeQuestion }: { form: UseFormReturn<TestFormData>, questionIndex: number, removeQuestion: (index: number) => void }) {
    const { fields: optionFields } = useFieldArray({
        control: form.control,
        name: `questions.${questionIndex}.options`,
    });

    return (
        <Card key={`question-${questionIndex}`} className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between bg-primary/5">
                <CardTitle>Question {questionIndex + 1}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => removeQuestion(questionIndex)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.text`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Question Text</FormLabel>
                            <FormControl>
                                <Textarea placeholder="What is the capital of France?" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.imageUrl`}
                    render={({ field }) => (
                        <ImageUploader
                            value={field.value || ''}
                            onChange={field.onChange}
                            onCrop={field.onChange}
                            label="Image (Optional)"
                            description="Upload an image for the question (e.g., a diagram)."
                            aspect={16 / 9}
                            cropShape="rect"
                        />
                    )}
                />
                
                <Separator />
                
                <FormField
                    control={form.control}
                    name={`questions.${questionIndex}.correctAnswer`}
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Options (select the correct one)</FormLabel>
                             <FormDescription>Each question must have 5 options. The 5th option is typically "Not Attempted".</FormDescription>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="flex flex-col space-y-2"
                                >
                                    {optionFields.map((option, optionIndex) => (
                                        <div key={option.id} className="flex items-center gap-2 group">
                                            <FormControl>
                                                <RadioGroupItem value={form.watch(`questions.${questionIndex}.options.${optionIndex}.value`)} id={`q${questionIndex}-o${optionIndex}`} disabled={!form.watch(`questions.${questionIndex}.options.${optionIndex}.value`)} />
                                            </FormControl>
                                            <FormField
                                                control={form.control}
                                                name={`questions.${questionIndex}.options.${optionIndex}.value`}
                                                render={({ field: optionField }) => (
                                                    <FormItem className="flex-grow">
                                                        <FormControl>
                                                           <Input placeholder={`Option ${optionIndex + 1}`} {...optionField} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    ))}
                                </RadioGroup>
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}

function CategoryDialog({ isOpen, onClose, onSave, category }: { isOpen: boolean, onClose: () => void, onSave: (data: CategoryFormData) => void, category?: Category | null }) {
    const form = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: '', logoImageUrl: '', bannerImageUrl: '', userCount: 0, description: '', languages: '', features: '',
        }
    });

    useEffect(() => {
        if (category) {
            form.reset({
                id: category.id,
                name: category.name,
                logoImageUrl: category.logoImageUrl || '',
                bannerImageUrl: category.bannerImageUrl || '',
                userCount: category.userCount || 0,
                description: category.description || '',
                languages: category.languages || '',
                features: category.features?.join(', ') || ''
            });
        } else {
             form.reset({
                id: undefined, name: '', logoImageUrl: '', bannerImageUrl: '', userCount: 0, description: '', languages: '', features: ''
            });
        }
    }, [category, form, isOpen]);

    const onSubmit = (data: CategoryFormData) => {
        onSave(data);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{category ? 'Edit Category' : 'Create New Category'}</DialogTitle>
                    <DialogDescription>
                        {category ? 'Update the details for this category.' : 'Create a new subject or vacancy to group your tests.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField name="name" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Category Name</FormLabel><FormControl><Input placeholder="e.g., Rajasthan GK" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        
                        <FormField
                            control={form.control}
                            name="logoImageUrl"
                            render={({ field }) => (
                                <ImageUploader
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    onCrop={field.onChange}
                                    label="Logo Image"
                                    description="Upload a logo for the category (1:1 ratio recommended)."
                                    aspect={1}
                                    cropShape="round"
                                />
                            )}
                        />
                        
                        <FormField
                            control={form.control}
                            name="bannerImageUrl"
                            render={({ field }) => (
                                <ImageUploader
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    onCrop={field.onChange}
                                    label="Banner Image"
                                    description="Upload a banner for the category (3:1 ratio recommended)."
                                    aspect={3}
                                    cropShape="rect"
                                />
                            )}
                        />

                        <FormField name="userCount" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>User Count (Optional)</FormLabel><FormControl><Input type="number" placeholder="e.g., 58400" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="description" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Input placeholder="e.g., 1048 Total Tests | 2 Free Tests" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="languages" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Languages (Optional)</FormLabel><FormControl><Input placeholder="e.g., English,Hindi + 6 More" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name="features" control={form.control} render={({ field }) => (
                            <FormItem>
                                <FormLabel>Features (comma-separated)</FormLabel>
                                <FormControl><Textarea placeholder="e.g., 317 Previous Year Paper, 291 All SSC Exam Basic PYQs" {...field} /></FormControl>
                                <FormDescription>Enter features separated by commas.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>{category ? 'Save Changes' : 'Create Category'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteCategoryDialog({ category, isOpen, onClose, onDelete }: { category: Category | undefined | null, isOpen: boolean, onClose: () => void, onDelete: (id: string, method: 'delete' | 'unassign') => void }) {
    const [deleteMethod, setDeleteMethod] = useState<'delete' | 'unassign'>('unassign');

    if (!category) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{category.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. What would you like to do with the tests inside this category?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 my-4">
                    <RadioGroup value={deleteMethod} onValueChange={(value: 'delete' | 'unassign') => setDeleteMethod(value)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="unassign" id="unassign" />
                            <Label htmlFor="unassign">Unassign tests (keep them in "Uncategorized")</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="delete" id="delete" />
                            <Label htmlFor="delete">Permanently delete all tests in this category</Label>
                        </div>
                    </RadioGroup>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(category.id, deleteMethod)} className="bg-destructive hover:bg-destructive/90">
                        Delete Category
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function CategoryList({ categories, onSelect, onEdit, onDelete, onCreate, uncategorizedCount, onSelectUncategorized }: { categories: Category[], onSelect: (cat: Category) => void, onEdit: (cat: Category) => void, onDelete: (cat: Category) => void, onCreate: () => void, uncategorizedCount: number, onSelectUncategorized: () => void }) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Test Series</CardTitle>
                            <CardDescription>Select a series to view its tests, or create a new one.</CardDescription>
                        </div>
                         <Button onClick={onCreate}><FolderPlus /> Create Series</Button>
                    </div>
                </CardHeader>
                 <CardContent>
                    {(categories.length === 0 && uncategorizedCount === 0) ? (
                        <p className="text-muted-foreground text-center py-8">No series created yet. Click the button above to start.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {categories.map(category => (
                                <Card key={category.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="p-4 flex-grow cursor-pointer" onClick={() => onSelect(category)}>
                                        <div className="flex items-center gap-4 mb-4">
                                            <Avatar>
                                                {category.logoImageUrl ? <AvatarImage src={category.logoImageUrl} data-ai-hint="logo" /> : <AvatarFallback>{category.name.charAt(0)}</AvatarFallback>}
                                            </Avatar>
                                            <h3 className="font-semibold">{category.name}</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 h-10">{category.description || 'No description'}</p>
                                    </div>
                                    <CardFooter className="p-2 border-t bg-muted/50 flex-wrap">
                                        <Button variant="ghost" size="sm" className="flex-1" onClick={() => onEdit(category)}>Edit</Button>
                                        <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={() => onDelete(category)}>Delete</Button>
                                    </CardFooter>
                                </Card>
                            ))}
                             {uncategorizedCount > 0 && (
                                <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelectUncategorized}>
                                    <div className="flex-grow">
                                        <div className="p-4 flex flex-col items-center justify-center h-full">
                                            <FolderSymlink className="w-10 h-10 text-muted-foreground mb-2" />
                                            <h3 className="font-semibold">Uncategorized</h3>
                                            <p className="text-sm text-muted-foreground">{uncategorizedCount} test(s)</p>
                                        </div>
                                    </div>
                                    <CardFooter className="p-2 border-t text-center bg-muted/50">
                                        <p className="text-xs text-muted-foreground w-full">Edit tests to assign a category.</p>
                                    </CardFooter>
                                </Card>
                            )}
                        </div>
                    )}
                 </CardContent>
            </Card>
        </div>
    );
}

export default function ManageTestsPage() {
  const { toast } = useToast();
  const { tests, updateTest, deleteTest, isLoading: isLoadingTests } = useTests();
  const { categories, updateCategory, deleteCategory, isLoading: isLoadingCategories } = useCategories();
  
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [testToEdit, setTestToEdit] = useState<Test | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showUncategorized, setShowUncategorized] = useState(false);

  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const isLoading = isLoadingTests || isLoadingCategories;
  
  const createForm = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: '',
      duration: 10,
      marksPerCorrect: 1,
      negativeMarksPerWrong: 0,
      questions: [{ text: '', imageUrl: '', options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: 'Not Attempted' }], correctAnswer: '' }],
      guidelines: '1. This test consists of multiple-choice questions.\n2. Do not refresh the page during the test.\n3. Your test will be submitted automatically when the timer runs out.',
      categoryId: '',
    },
    mode: 'onChange',
  });
  
  useEffect(() => {
    if (selectedCategory) {
        createForm.setValue('categoryId', selectedCategory.id);
    }
  }, [selectedCategory, createForm]);

  const { fields, append, remove } = useFieldArray({
    control: createForm.control,
    name: 'questions',
  });

  const onCreateSubmit = async (data: TestFormData) => {
    const newTest: Omit<Test, 'id'> = {
      title: data.title,
      duration: data.duration,
      marksPerCorrect: data.marksPerCorrect,
      negativeMarksPerWrong: data.negativeMarksPerWrong,
      guidelines: data.guidelines,
      categoryId: data.categoryId,
      questions: data.questions.map((q, index) => ({
        id: `${Date.now()}-${index}`,
        text: q.text,
        imageUrl: q.imageUrl,
        options: q.options.map(opt => opt.value),
        correctAnswer: q.correctAnswer,
      })),
    };

    try {
      await updateTest(newTest as Test); // Casting because the hook will handle the ID
      toast({
        title: 'Test Created!',
        description: 'The new test has been added successfully.',
      });
      createForm.reset({
        ...createForm.formState.defaultValues,
        title: '',
        questions: [{ text: '', imageUrl: '', options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: 'Not Attempted' }], correctAnswer: '' }],
        categoryId: selectedCategory?.id || '',
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save the test.', variant: 'destructive' });
    }
  };
  
  const handleUpdateTest = async (updatedTest: Test) => {
    try {
      await updateTest(updatedTest);
      setTestToEdit(null);
      toast({ title: "Test Updated", description: "The test has been successfully updated." });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update the test.', variant: 'destructive' });
    }
  }

  const handleDeleteTest = async (testId: string) => {
    try {
      await deleteTest(testId);
      setTestToDelete(null);
      toast({ title: "Test Deleted", description: "The test and all its results have been deleted.", variant: 'destructive' });
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete the test.', variant: 'destructive' });
    }
  };

  const handleSaveCategory = async (data: CategoryFormData) => {
    try {
        const categoryData: Partial<Category> = {
            id: data.id || `cat-${Date.now()}`,
            name: data.name,
            logoImageUrl: data.logoImageUrl,
            bannerImageUrl: data.bannerImageUrl,
            userCount: data.userCount,
            description: data.description,
            languages: data.languages,
            features: data.features ? data.features.split(',').map(s => s.trim()).filter(Boolean) : [],
        };
        
        await updateCategory(categoryData as Category);

        toast({ title: data.id ? "Category Updated!" : "Category Created!", description: `${data.name} has been saved.` });

    } catch (error) {
        toast({ title: "Error", description: "Could not save category.", variant: "destructive" });
    }
  };
  
  const handleDeleteCategory = async (id: string, method: 'delete' | 'unassign') => {
      try {
          await deleteCategory(id, method === 'delete');
          
          if(selectedCategory?.id === id) {
              setSelectedCategory(null);
          }

          setCategoryToDelete(null);
          toast({ title: "Category Deleted", variant: 'destructive' });

      } catch (error) {
          toast({ title: "Error", description: "Could not delete category.", variant: "destructive" });
      }
  };

  const uncategorizedTests = useMemo(() => {
    if (!tests || !categories) return [];
    const categorizedIds = new Set(categories.map(c => c.id));
    return tests.filter(t => !t.categoryId || !categorizedIds.has(t.categoryId));
  }, [tests, categories]);

  const handleSelectCategory = (category: Category) => {
      setSelectedCategory(category);
      setShowUncategorized(false);
  }
  
  const handleSelectUncategorized = () => {
      setSelectedCategory(null);
      setShowUncategorized(true);
  }

  const currentViewTests = useMemo(() => {
    if (!tests) return [];
    if (showUncategorized) return uncategorizedTests;
    if (selectedCategory) return tests.filter(t => t.categoryId === selectedCategory.id);
    return [];
  }, [tests, showUncategorized, selectedCategory, uncategorizedTests]);

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Manage Tests & Series</h1>
        <p className="text-muted-foreground">Create and manage your tests and test series (categories).</p>
      </div>
      <div className="space-y-8">
             <CategoryList 
                categories={categories || []}
                onSelect={handleSelectCategory}
                onEdit={(cat) => { setCategoryToEdit(cat); setIsCategoryDialogOpen(true); }}
                onDelete={setCategoryToDelete}
                onCreate={() => { setCategoryToEdit(null); setIsCategoryDialogOpen(true); }}
                uncategorizedCount={uncategorizedTests.length}
                onSelectUncategorized={handleSelectUncategorized}
            />
            
            {(selectedCategory || showUncategorized) && (
                <>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Tests in "{selectedCategory?.name || 'Uncategorized'}"</CardTitle>
                            <Button variant="outline" onClick={() => { setSelectedCategory(null); setShowUncategorized(false); }}><ArrowLeft /> Back to Categories</Button>
                        </div>
                    </CardHeader>
                    <ExistingTestsTable 
                        tests={currentViewTests} 
                        categories={categories || []} 
                        onEdit={setTestToEdit} 
                        onDelete={setTestToDelete} 
                    />
                </Card>

                <Separator />
                
                <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-8">
                    <h2 className="text-2xl font-semibold flex items-center gap-2"><FilePenLine /> Manual Test Creator</h2>
                    <Card>
                        <CardHeader><CardTitle>Test Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                        <FormField control={createForm.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Test Title</FormLabel>
                                <FormControl><Input placeholder="e.g., General Knowledge Quiz" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={createForm.control} name="categoryId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a category for this test" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {(categories || []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={createForm.control} name="duration" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Duration (in minutes)</FormLabel>
                                <FormControl><Input type="number" placeholder="e.g., 30" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={createForm.control} name="marksPerCorrect" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Marks per Correct Answer</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 4" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={createForm.control} name="negativeMarksPerWrong" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Negative Marks per Wrong</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., -1 or 0" {...field} /></FormControl>
                                    <FormDescription>Also applies to unanswered questions.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={createForm.control} name="guidelines" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Test Guidelines</FormLabel>
                                <FormControl><Textarea placeholder="e.g., 1. Do not refresh the page..." rows={4} {...field} /></FormControl>
                                <FormDescription>These instructions will be shown to the student before they start the test.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />
                        </CardContent>
                    </Card>

                    {fields.map((field, index) => (
                        <QuestionField key={field.id} form={createForm} questionIndex={index} removeQuestion={remove} />
                    ))}

                    <div className="flex justify-between items-center">
                        <Button type="button" variant="outline" onClick={() => append({ text: '', imageUrl: '', options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: 'Not Attempted' }], correctAnswer: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Question
                        </Button>
                        <Button type="submit">Create New Test</Button>
                    </div>
                    </form>
                </Form>
                </>
            )}

        </div>
      
      {testToEdit && (
        <EditTestDialog
          test={testToEdit}
          isOpen={!!testToEdit}
          onClose={() => setTestToEdit(null)}
          onSave={handleUpdateTest}
          categories={categories || []}
        />
      )}

      <AlertDialog open={!!testToDelete} onOpenChange={(open) => !open && setTestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the test
              and all student results associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTestToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteTest(testToDelete!.id)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <CategoryDialog 
            isOpen={isCategoryDialogOpen}
            onClose={() => { setIsCategoryDialogOpen(false); setCategoryToEdit(null); }}
            onSave={handleSaveCategory}
            category={categoryToEdit}
      />
      
      {categoryToDelete && (
          <DeleteCategoryDialog
            category={categoryToDelete}
            isOpen={!!categoryToDelete}
            onClose={() => setCategoryToDelete(null)}
            onDelete={handleDeleteCategory}
          />
      )}
    </div>
  );
}
