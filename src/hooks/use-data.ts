
"use client";

import React from 'react';
import type { Test, Category, User, Result, Report, ChatThread, SarthiBotTrainingData, SarthiBotConversation, Feedback, SiteSettings } from '@/lib/types';
import useSWR, { mutate } from 'swr';
import * as DataActions from '@/actions/data-actions';

// SWR fetcher for all data types
const fetcher = async (key: string) => {
    switch (key) {
        case 'tests': return DataActions.fetchTests();
        case 'categories': return DataActions.fetchCategories();
        case 'allUsers': return DataActions.fetchAllUsers();
        case 'results': return DataActions.fetchResults();
        case 'reports': return DataActions.fetchReports();
        case 'chatThreads': return DataActions.fetchChatThreads();
        case 'sarthiBotTrainingData': return DataActions.fetchSarthiBotTrainingData();
        case 'sarthiBotConversations': return DataActions.fetchSarthiBotConversations();
        case 'feedbacks': return DataActions.fetchStudentFeedbacks();
        case 'siteSettings': return DataActions.fetchSiteSettings();
        default: throw new Error(`Unknown SWR key: ${key}`);
    }
};

const defaultSiteSettings: SiteSettings = {
    id: 'default',
    logoUrl: null,
    botName: 'UdaanSarthi Bot',
    botAvatarUrl: null,
    botIntroMessage: 'नमस्ते! मैं उड़ान सारथी हूँ। मैं आपकी पढ़ाई में कैसे मदद कर सकता हूँ?',
    isBotEnabled: true,
    isNewsBannerEnabled: false,
    newsBannerImageUrl: null,
    newsBannerTitle: null,
    newsBannerLink: null,
    newsBannerDisplayRule: 'SESSION',
    heroBannerText: null,
    isHeroBannerTextEnabled: false,
    heroBannerImageUrl: null,
    heroBannerOverlayOpacity: 0,
    adminChatAutoReply: "Thanks for reaching out! An admin will get back to you as soon as possible.",
};


export const useTests = () => {
    const { data, error, isLoading, mutate } = useSWR<Test[]>('tests', fetcher);
    const updateTest = React.useCallback(async (test: Test) => {
        const optimisticData = (data || []).map(t => t.id === test.id ? test : t);
        if (!(data || []).some(t => t.id === test.id)) {
            optimisticData.push(test);
        }
        await mutate(DataActions.upsertTest(test), { optimisticData, revalidate: false });
    }, [data, mutate]);

    const deleteTest = React.useCallback(async (id: string) => {
        const optimisticData = (data || []).filter(t => t.id !== id);
        await mutate(DataActions.removeTest(id), { optimisticData, revalidate: false });
    }, [data, mutate]);

    return { 
        data: data || [], 
        isLoading, 
        error, 
        mutate,
        updateTest,
        deleteTest
    };
};

export const useCategories = () => {
    const { data, error, isLoading, mutate } = useSWR<Category[]>('categories', fetcher);
    const updateCategory = React.useCallback(async (category: Category) => {
        const isNew = !(data || []).some(c => c.id === category.id);
        const optimisticData = isNew 
            ? [...(data || []), category]
            : (data || []).map(c => c.id === category.id ? category : c);

        await mutate(DataActions.upsertCategory(category), { 
            optimisticData,
            rollbackOnError: true,
            populateCache: true,
            revalidate: true,
        });
    }, [data, mutate]);

    const deleteCategory = React.useCallback(async (id: string, deleteTests: boolean) => {
        const optimisticData = (data || []).filter(c => c.id !== id);
        await mutate(DataActions.removeCategory(id, deleteTests), { optimisticData, revalidate: false });
    }, [data, mutate]);

    return {
        data: data || [],
        isLoading,
        error,
        mutate,
        updateCategory,
        deleteCategory,
    };
};

export const useAllUsers = () => {
    const { data, isLoading, mutate, error } = useSWR<User[]>('allUsers', fetcher);
    const updateUser = React.useCallback(async (id: string, userData: Partial<User>) => {
        const optimisticData = (data || []).map(u => u.id === id ? { ...u, ...userData } : u);
        await mutate(DataActions.upsertUser({ id, ...userData }), { optimisticData, revalidate: false });
    }, [data, mutate]);

    const deleteStudent = React.useCallback(async (id: string) => {
        const optimisticData = (data || []).filter(u => u.id !== id);
        await mutate(DataActions.removeStudent(id), { optimisticData, revalidate: false });
    }, [data, mutate]);

    return {
        allUsers: data || [],
        isLoading,
        error,
        updateUser,
        deleteStudent,
        mutate
    };
};

export const useStudents = () => {
    const { allUsers, isLoading, deleteStudent: deleteUserAction, error } = useAllUsers();
    
    const students = React.useMemo(() => (allUsers || []).filter(u => u.role === 'student'), [allUsers]);

    const deleteStudent = React.useCallback(async (id: string) => {
        await deleteUserAction(id);
    }, [deleteUserAction]);

    return { 
        students, 
        isLoading: isLoading,
        error,
        deleteStudent
    };
};


export const useResults = () => {
    const { data, error, isLoading, mutate } = useSWR<Result[]>('results', fetcher);
    
     const updateItem = React.useCallback(async (result: Omit<Result, 'id'>): Promise<Result> => {
        const savedResult = await DataActions.upsertResult(result);
        
        await mutate(
            (currentData) => {
                const results = Array.isArray(currentData) ? currentData : [];
                const index = results.findIndex(r => r.testId === savedResult.testId && r.userId === savedResult.userId);
                
                if (index !== -1) {
                    const updatedData = [...results];
                    updatedData[index] = savedResult;
                    return updatedData;
                } else {
                    return [...results, savedResult];
                }
            }, 
            { revalidate: true }
        ); 
        return savedResult;
    }, [mutate]);


    return { 
        data: data || [], 
        isLoading, 
        error, 
        updateItem
    };
};

export const useReports = () => {
    const { data, error, isLoading, mutate } = useSWR<Report[]>('reports', fetcher);
    
    const updateItem = React.useCallback(async (report: Report) => {
        const optimisticData = (data || []).map(r => r.id === report.id ? report : r);
        if (!(data || []).some(r => r.id === report.id)) {
            optimisticData.push(report);
        }
        await mutate(DataActions.upsertReport(report), { optimisticData, revalidate: false });
    }, [data, mutate]);
    
    return { 
        data: data || [], 
        isLoading, 
        error, 
        updateItem
    };
};

export const useChatThreads = () => {
    const { data, error, isLoading, mutate } = useSWR<ChatThread[]>('chatThreads', fetcher);

    const updateItem = React.useCallback(async (thread: ChatThread) => {
        // --- This is the new, stable logic ---
        // 1. Update the local cache instantly for a smooth UI update.
        mutate(
            (cachedData: ChatThread[] | undefined) => {
                const currentThreads = cachedData || [];
                const index = currentThreads.findIndex(c => c.id === thread.id);
                if (index > -1) {
                    const updatedThreads = [...currentThreads];
                    updatedThreads[index] = thread;
                    return updatedThreads;
                }
                return [...currentThreads, thread];
            }, 
            false // IMPORTANT: Do not revalidate immediately.
        );

        // 2. Call the server action in the background. SWR will handle revalidation later if needed.
        await DataActions.upsertChatThread(thread);
    }, [mutate]);

    const deleteItem = React.useCallback(async (id: string) => {
        const optimisticData = (data || []).filter(t => t.studentId !== id);
        await mutate(DataActions.removeChatThread(id), { optimisticData, revalidate: false });
    }, [data, mutate]);
    
    return {
        data: data || [],
        isLoading,
        error,
        updateItem,
        deleteItem
    };
};

export const useSarthiBotTrainingData = () => {
    const { data, error, isLoading, mutate } = useSWR<SarthiBotTrainingData[]>('sarthiBotTrainingData', fetcher);
    const updateSarthiBotTrainingData = React.useCallback(async (trainingData: SarthiBotTrainingData[]) => {
        await mutate(DataActions.saveSarthiBotTrainingData(trainingData), { optimisticData: trainingData, revalidate: false });
    }, [mutate]);
    return { 
        trainingData: data, 
        isLoading, 
        error, 
        updateSarthiBotTrainingData
    };
};

export const useSarthiBotConversations = () => {
    const { data, error, isLoading, mutate } = useSWR<SarthiBotConversation[]>('sarthiBotConversations', fetcher);

    const updateSarthiBotConversation = React.useCallback(async (conversation: SarthiBotConversation) => {
       // --- This is the new, stable logic ---
        // 1. Update the local cache instantly for a smooth UI update.
        mutate(
            (cachedData: SarthiBotConversation[] | undefined) => {
                const currentConversations = cachedData || [];
                const index = currentConversations.findIndex(c => c.id === conversation.id);
                if (index > -1) {
                    const updatedConversations = [...currentConversations];
                    updatedConversations[index] = conversation;
                    return updatedConversations;
                }
                return [...currentConversations, conversation];
            }, 
            false // IMPORTANT: Do not revalidate immediately.
        );
        
        // 2. Call the server action in the background.
        await DataActions.upsertSarthiBotConversation(conversation);
    }, [mutate]);


    const deleteSarthiBotConversation = React.useCallback(async (id: string) => {
        const optimisticData = (data || []).filter(c => c.studentId !== id);
        await mutate(DataActions.removeSarthiBotConversation(id), { optimisticData, revalidate: false });
    }, [data, mutate]);

     return {
        conversations: data || [],
        isLoading,
        error,
        updateSarthiBotConversation,
        deleteSarthiBotConversation
    };
};

export const useFeedbacks = () => {
    const { data, error, isLoading, mutate } = useSWR<Feedback[]>('feedbacks', fetcher);
    const updateFeedbacks = React.useCallback(async (feedbacks: Feedback[]) => {
        await mutate(DataActions.saveFeedbacks(feedbacks), { optimisticData: feedbacks, revalidate: false });
    }, [mutate]);
    return { 
        data, 
        isLoading, 
        error,
        updateFeedbacks
    };
};

export const useSiteSettings = () => {
    const { data, error, isLoading, mutate } = useSWR<SiteSettings | null>('siteSettings', fetcher);
    
    const settings = data ? { ...defaultSiteSettings, ...data } : defaultSiteSettings;

    const updateSettings = React.useCallback(async (newSettings: Partial<SiteSettings>) => {
        const optimisticData = { ...settings, ...newSettings };
        
        // Correct way to handle optimistic UI with SWR
        // 1. Mutate locally without revalidation to show instant UI update
        // 2. Trigger the async update
        // 3. Let SWR handle revalidation upon completion by default
        await mutate(DataActions.upsertSiteSettings(newSettings), {
          optimisticData: optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: true,
        });

    }, [settings, mutate]);

    return { settings, isLoading, error, updateSettings };
};

// Re-export useUser and useAdminUser from use-auth to colocate all data hooks
export { useUser, useAdminUser } from '@/hooks/use-auth';
