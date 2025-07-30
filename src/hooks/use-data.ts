
'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Test, Category, User, Result, Report, ChatThread, SarthiBotTrainingData, SarthiBotConversation, Feedback, SiteSettings } from '@/lib/types';
import { useLoading } from './use-loading';
import { useAuth } from './use-auth';

interface DataContextType {
    user: User | null;
    tests: Test[] | null;
    categories: Category[] | null;
    allUsers: User[] | null;
    results: Result[] | null;
    reports: Report[] | null;
    chatThreads: ChatThread[] | null;
    sarthiBotTrainingData: SarthiBotTrainingData[] | null;
    sarthiBotConversations: SarthiBotConversation[] | null;
    studentFeedbacks: Feedback[] | null;
    siteSettings: SiteSettings | null;
    isLoading: boolean;
    updateUser: (userId: string, data: Partial<User>) => Promise<void>;
    updateTest: (test: Test) => Promise<void>;
    deleteTest: (testId: string) => Promise<void>;
    updateCategory: (category: Category) => Promise<void>;
    deleteCategory: (categoryId: string, deleteTests: boolean) => Promise<void>;
    updateResult: (result: Result) => Promise<void>;
    updateReport: (report: Report) => Promise<void>;
    updateChatThread: (thread: ChatThread) => Promise<void>;
    deleteChatThread: (threadId: string) => Promise<void>;
    updateSarthiBotTrainingData: (data: SarthiBotTrainingData[]) => Promise<void>;
    updateSarthiBotConversation: (conversation: SarthiBotConversation) => Promise<void>;
    deleteSarthiBotConversation: (conversationId: string) => Promise<void>;
    updateFeedbacks: (feedbacks: Feedback[]) => Promise<void>;
    updateSiteSettings: (settings: Partial<SiteSettings>) => Promise<void>;
    deleteStudent: (studentId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

const defaultSiteSettings: SiteSettings = {
    id: 'default', logoUrl: '/logo.png', botName: 'UdaanSarthi Bot', botAvatarUrl: '',
    botIntroMessage: 'नमस्ते! मैं उड़ान सारथी हूँ। मैं आपकी पढ़ाई में कैसे मदद कर सकता हूँ?',
    isBotEnabled: true, isNewsBannerEnabled: false, newsBannerImageUrl: '', newsBannerTitle: '',
    newsBannerLink: '', newsBannerDisplayRule: 'session',
    heroBannerText: 'Your Journey to Success Starts Here.\nGuided by AI. Designed for Results.',
    isHeroBannerTextEnabled: true, heroBannerImageUrl: 'https://placehold.co/1200x480.png',
    heroBannerOverlayOpacity: 0.3, adminChatAutoReply: "Thanks for reaching out! An admin will get back to you as soon as possible.",
};


export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const { authUser } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [tests, setTests] = useState<Test[] | null>(null);
    const [categories, setCategories] = useState<Category[] | null>(null);
    const [allUsers, setAllUsers] = useState<User[] | null>(null);
    const [results, setResults] = useState<Result[] | null>(null);
    const [reports, setReports] = useState<Report[] | null>(null);
    const [chatThreads, setChatThreads] = useState<ChatThread[] | null>(null);
    const [sarthiBotTrainingData, setSarthiBotTrainingData] = useState<SarthiBotTrainingData[] | null>(null);
    const [sarthiBotConversations, setSarthiBotConversations] = useState<SarthiBotConversation[] | null>(null);
    const [studentFeedbacks, setStudentFeedbacks] = useState<Feedback[] | null>(null);
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const { setLoading: setAppLoading } = useLoading();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setAppLoading(true);

        try {
            const fetchPromises = [
                supabase.from('tests').select('*'),
                supabase.from('categories').select('*'),
                supabase.from('results').select('*'),
                supabase.from('reports').select('*'),
                supabase.from('chatThreads').select('*'),
                supabase.from('sarthiBotTrainingData').select('*'),
                supabase.from('sarthiBotConversations').select('*'),
                supabase.from('studentFeedbacks').select('*'),
                supabase.from('siteSettings').select('*').eq('id', 'default').maybeSingle(),
            ];

            // Only fetch all users if the logged-in user is an admin
            if (user?.role === 'admin') {
                fetchPromises.push(supabase.from('users').select('*'));
            }

            const [
                testsRes, categoriesRes, resultsRes, reportsRes, chatThreadsRes,
                sarthiBotTrainingDataRes, sarthiBotConversationsRes, studentFeedbacksRes,
                siteSettingsRes, allUsersRes
            ] = await Promise.all(fetchPromises);

            setTests(testsRes.data as Test[] || []);
            setCategories(categoriesRes.data as Category[] || []);
            setResults(resultsRes.data as Result[] || []);
            setReports(reportsRes.data as Report[] || []);
            setChatThreads(chatThreadsRes.data as ChatThread[] || []);
            setSarthiBotTrainingData(sarthiBotTrainingDataRes.data as SarthiBotTrainingData[] || []);
            setSarthiBotConversations(sarthiBotConversationsRes.data as SarthiBotConversation[] || []);
            setStudentFeedbacks(studentFeedbacksRes.data as Feedback[] || []);
            setSiteSettings(siteSettingsRes.data ? { ...defaultSiteSettings, ...siteSettingsRes.data } : defaultSiteSettings);

            if (allUsersRes) {
                setAllUsers(allUsersRes.data as User[] || []);
            }
            
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
            setAppLoading(false);
        }
    }, [setAppLoading, user?.role]);

    useEffect(() => {
        if (authUser) {
            const fetchUserProfile = async () => {
                const { data, error } = await supabase.from('users').select('*').eq('id', authUser.id).single();
                if (data) {
                    setUser(data as User);
                } else if (error) {
                    console.error("Error fetching user profile:", error);
                    setUser(null); // Explicitly set user to null on error
                }
            };
            fetchUserProfile();
        } else {
            setUser(null);
        }
    }, [authUser]);

    useEffect(() => {
        // Fetch all data once the user profile is loaded
        if (user) {
            fetchData();
        } else if (!authUser) {
             // If there's no auth user, we can still load public data like site settings
             setIsLoading(true);
             supabase.from('siteSettings').select('*').eq('id', 'default').maybeSingle().then(({data}) => {
                setSiteSettings(data ? { ...defaultSiteSettings, ...data } : defaultSiteSettings);
                setIsLoading(false);
             });
        }
    }, [user, fetchData, authUser]);

    const genericUpdate = async (tableName: string, item: any) => {
        const { error } = await supabase.from(tableName).upsert(item);
        if (error) throw error;
        await fetchData();
    };
    
    const genericDelete = async (tableName: string, itemId: string) => {
        const { error } = await supabase.from(tableName).delete().eq('id', itemId);
        if (error) throw error;
        await fetchData();
    };
    
    const updateUser = useCallback(async (userId: string, data: Partial<User>) => genericUpdate('users', { id: userId, ...data }), [fetchData]);
    const updateTest = useCallback(async (test: Test) => genericUpdate('tests', { id: test.id || `test-${Date.now()}`, ...test }), [fetchData]);
    const deleteTest = useCallback(async (testId: string) => genericDelete('tests', testId), [fetchData]);
    const updateCategory = useCallback(async (category: Category) => genericUpdate('categories', { id: category.id || `cat-${Date.now()}`, ...category }), [fetchData]);
    
    const deleteCategory = useCallback(async (categoryId: string, deleteTests: boolean) => {
        if (deleteTests) {
            await supabase.from('tests').delete().eq('categoryId', categoryId);
        }
        await genericDelete('categories', categoryId);
    }, [fetchData]);
    
    const deleteStudent = useCallback(async (studentId: string) => {
        // This should be handled via a Supabase Function for security to cascade deletes.
        // For now, just deleting from the users table. Auth user must be deleted separately.
        await genericDelete('users', studentId);
    }, [fetchData]);

    const updateResult = useCallback(async (result: Result) => genericUpdate('results', result), [fetchData]);
    const updateReport = useCallback(async (report: Report) => genericUpdate('reports', report), [fetchData]);
    const updateChatThread = useCallback(async (thread: ChatThread) => genericUpdate('chatThreads', thread), [fetchData]);
    const deleteChatThread = useCallback(async (threadId: string) => genericDelete('chatThreads', threadId), [fetchData]);
    const updateSarthiBotConversation = useCallback(async (conversation: SarthiBotConversation) => genericUpdate('sarthiBotConversations', conversation), [fetchData]);
    const deleteSarthiBotConversation = useCallback(async (conversationId: string) => genericDelete('sarthiBotConversations', conversationId), [fetchData]);
    
    const updateSarthiBotTrainingData = useCallback(async (data: SarthiBotTrainingData[]) => {
        await supabase.from('sarthiBotTrainingData').delete().neq('id', 'dummy-id-to-delete-all');
        const { error } = await supabase.from('sarthiBotTrainingData').insert(data);
        if (error) throw error;
        await fetchData();
    }, [fetchData]);
    
    const updateFeedbacks = useCallback(async (feedbacks: Feedback[]) => {
        const { error } = await supabase.from('studentFeedbacks').upsert(feedbacks);
        if (error) throw error;
        await fetchData();
    }, [fetchData]);

    const updateSiteSettings = useCallback(async (settings: Partial<SiteSettings>) => {
        await genericUpdate('siteSettings', { id: 'default', ...settings });
    }, [fetchData]);
    
    const value = useMemo(() => ({
        user, tests, categories, allUsers, results, reports,
        chatThreads, sarthiBotTrainingData, sarthiBotConversations,
        studentFeedbacks, siteSettings, isLoading,
        updateUser, updateTest, deleteTest, updateCategory, deleteCategory,
        updateResult, updateReport, updateChatThread, deleteChatThread,
        updateSarthiBotTrainingData, updateSarthiBotConversation,
        deleteSarthiBotConversation, updateFeedbacks, updateSiteSettings, deleteStudent,
    }), [
        user, tests, categories, allUsers, results, reports,
        chatThreads, sarthiBotTrainingData, sarthiBotConversations,
        studentFeedbacks, siteSettings, isLoading,
        updateUser, updateTest, deleteTest, updateCategory, deleteCategory,
        updateResult, updateReport, updateChatThread, deleteChatThread,
        updateSarthiBotTrainingData, updateSarthiBotConversation,
        deleteSarthiBotConversation, updateFeedbacks, updateSiteSettings, deleteStudent
    ]);

    return React.createElement(DataContext.Provider, { value }, children);
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === null) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

// Convenience hooks
export const useUser = () => useData().user;

export const useTests = () => {
    const { tests, isLoading, updateTest, deleteTest } = useData();
    return { data: tests, isLoading, updateItem: updateTest, deleteItem: deleteTest };
}

export const useCategories = () => {
    const { categories, isLoading, updateCategory, deleteCategory } = useData();
    return { data: categories, isLoading, updateItem: updateCategory, deleteCategory };
}

export const useAllUsers = () => {
    const { allUsers, isLoading, updateUser } = useData();
    return { allUsers: allUsers || [], isLoading, updateUser };
}

export const useStudents = () => {
    const { allUsers, isLoading, deleteStudent } = useData();
    const students = useMemo(() => allUsers?.filter(u => u.role === 'student'), [allUsers]);
    return { students, deleteStudent, isLoading };
}

export const useAdminUser = () => {
    const { allUsers, isLoading } = useData();
    const adminUser = useMemo(() => allUsers?.find(u => u.role === 'admin'), [allUsers]);
    return { adminUser, isLoading };
}

export const useResults = () => {
    const { results, isLoading, updateResult } = useData();
    return { data: results, isLoading, updateItem: updateResult };
}

export const useReports = () => {
    const { reports, isLoading, updateReport } = useData();
    return { data: reports, updateItem: updateReport, isLoading };
}

export const useChatThreads = () => {
    const { chatThreads, isLoading, updateChatThread, deleteChatThread } = useData();
    return { data: chatThreads, isLoading, updateItem: updateChatThread, deleteItem: deleteChatThread };
}

export const useSarthiBotTrainingData = () => {
    const { sarthiBotTrainingData, isLoading, updateSarthiBotTrainingData } = useData();
    return { trainingData: sarthiBotTrainingData, updateSarthiBotTrainingData, isLoading };
}

export const useSarthiBotConversations = () => {
    const { sarthiBotConversations, isLoading, updateSarthiBotConversation, deleteSarthiBotConversation } = useData();
    return { conversations: sarthiBotConversations, updateSarthiBotConversation, deleteSarthiBotConversation, isLoading };
}

export const useFeedbacks = () => {
    const { studentFeedbacks, isLoading, updateFeedbacks } = useData();
    return { data: studentFeedbacks, updateFeedbacks, isLoading };
}

export const useSiteSettings = () => {
    const { siteSettings, isLoading, updateSiteSettings } = useData();
    return { settings: siteSettings, updateSettings: updateSiteSettings, isLoading };
}
