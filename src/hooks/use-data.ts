
'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import type { Test, Category, User, Result, Report, ChatThread, SarthiBotTrainingData, SarthiBotConversation, Feedback, SiteSettings } from '@/lib/types';
import { useLoading } from './use-loading';
import { useAuth } from './use-auth';
import { 
    fetchTests, fetchCategories, fetchAllUsers, fetchResults, fetchReports, 
    fetchChatThreads, fetchSarthiBotTrainingData, fetchSarthiBotConversations, 
    fetchStudentFeedbacks, fetchSiteSettings, upsertUser, upsertTest,
    removeTest, upsertCategory, removeCategory, upsertResult, upsertReport,
    upsertChatThread, removeChatThread, saveSarthiBotTrainingData,
    upsertSarthiBotConversation, removeSarthiBotConversation,
    saveFeedbacks, upsertSiteSettings, removeStudent
} from '@/actions/data-actions';

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
    heroBannerText: 'Your Journey to Success Starts Here.\\nGuided by AI. Designed for Results.',
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

    const loadAllData = useCallback(async (currentUser: User) => {
        setIsLoading(true);
        setAppLoading(true);

        try {
            const [
                testsRes, categoriesRes, resultsRes, reportsRes, chatThreadsRes,
                sarthiBotTrainingDataRes, sarthiBotConversationsRes, studentFeedbacksRes,
                siteSettingsRes, allUsersRes
            ] = await Promise.all([
                fetchTests(),
                fetchCategories(),
                fetchResults(),
                fetchReports(),
                fetchChatThreads(),
                fetchSarthiBotTrainingData(),
                fetchSarthiBotConversations(),
                fetchStudentFeedbacks(),
                fetchSiteSettings(),
                currentUser.role === 'admin' ? fetchAllUsers() : Promise.resolve([currentUser]),
            ]);

            setTests(testsRes as Test[] || []);
            setCategories(categoriesRes as Category[] || []);
            setResults(resultsRes as Result[] || []);
            setReports(reportsRes as Report[] || []);
            setChatThreads(chatThreadsRes as ChatThread[] || []);
            setSarthiBotTrainingData(sarthiBotTrainingDataRes as SarthiBotTrainingData[] || []);
            setSarthiBotConversations(sarthiBotConversationsRes as SarthiBotConversation[] || []);
            setStudentFeedbacks(studentFeedbacksRes as Feedback[] || []);
            const settingsData = siteSettingsRes as SiteSettings;
            setSiteSettings(settingsData ? { ...defaultSiteSettings, ...settingsData } : defaultSiteSettings);
            
            setAllUsers(allUsersRes as User[] || []);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
            setAppLoading(false);
        }
    }, [setAppLoading]);

    useEffect(() => {
        if (authUser) {
            const userInAllUsers = allUsers?.find(u => u.id === authUser.id);
            if (userInAllUsers) {
                setUser(userInAllUsers);
            } else {
                // Fetch all users to find the current user if not already loaded
                fetchAllUsers().then(users => {
                    const foundUser = (users as User[]).find(u => u.id === authUser.id);
                    setAllUsers(users as User[]);
                    if (foundUser) {
                        setUser(foundUser);
                        loadAllData(foundUser);
                    }
                });
            }
        } else {
            setUser(null);
        }
    }, [authUser, allUsers, loadAllData]);

    const updateUser = useCallback(async (userId: string, data: Partial<User>) => {
        await upsertUser({ ...data, id: userId });
        await loadAllData(user!);
    }, [loadAllData, user]);

    const updateTest = useCallback(async (test: Test) => {
        await upsertTest(test);
        await loadAllData(user!);
    }, [loadAllData, user]);

    const deleteTest = useCallback(async (testId: string) => {
        await removeTest(testId);
        await loadAllData(user!);
    }, [loadAllData, user]);

    const updateCategory = useCallback(async (category: Category) => {
        await upsertCategory(category);
        await loadAllData(user!);
    }, [loadAllData, user]);
    
    const deleteCategory = useCallback(async (categoryId: string, deleteTests: boolean) => {
        await removeCategory(categoryId, deleteTests);
        await loadAllData(user!);
    }, [loadAllData, user]);
    
    const deleteStudent = useCallback(async (studentId: string) => {
        await removeStudent(studentId);
        await loadAllData(user!);
    }, [loadAllData, user]);

    const updateResult = useCallback(async (result: Result) => {
        await upsertResult(result);
        await loadAllData(user!);
    }, [loadAllData, user]);

    const updateReport = useCallback(async (report: Report) => {
        await upsertReport(report);
        await loadAllData(user!);
    }, [loadAllData, user]);

    const updateChatThread = useCallback(async (thread: ChatThread) => {
        await upsertChatThread(thread);
        await loadAllData(user!);
    }, [loadAllData, user]);

    const deleteChatThread = useCallback(async (threadId: string) => {
        await removeChatThread(threadId);
        await loadAllData(user!);
    }, [loadAllData, user]);

    const updateSarthiBotConversation = useCallback(async (conversation: SarthiBotConversation) => {
        await upsertSarthiBotConversation(conversation);
        await loadAllData(user!);
    }, [loadAllData, user]);
    
    const deleteSarthiBotConversation = useCallback(async (conversationId: string) => {
        await removeSarthiBotConversation(conversationId);
        await loadAllData(user!);
    }, [loadAllData, user]);
    
    const updateSarthiBotTrainingData = useCallback(async (data: SarthiBotTrainingData[]) => {
        await saveSarthiBotTrainingData(data);
        await loadAllData(user!);
    }, [loadAllData, user]);
    
    const updateFeedbacks = useCallback(async (feedbacks: Feedback[]) => {
        await saveFeedbacks(feedbacks);
        await loadAllData(user!);
    }, [loadAllData, user]);

    const updateSiteSettings = useCallback(async (settings: Partial<SiteSettings>) => {
        await upsertSiteSettings(settings);
        await loadAllData(user!);
    }, [loadAllData, user]);
    
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
