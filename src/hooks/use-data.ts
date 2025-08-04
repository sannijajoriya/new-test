

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
    id: 'default', logoUrl: '/logo.png', botName: 'UdaanSarthi Bot', botAvatarUrl: '',
    botIntroMessage: 'नमस्ते! मैं उड़ान सारथी हूँ। मैं आपकी पढ़ाई में कैसे मदद कर सकता हूँ?',
    isBotEnabled: true, isNewsBannerEnabled: false, newsBannerImageUrl: '', newsBannerTitle: '',
    newsBannerLink: '', newsBannerDisplayRule: 'session',
    heroBannerText: 'Your Journey to Success Starts Here.\nGuided by AI. Designed for Results.',
    isHeroBannerTextEnabled: true, heroBannerImageUrl: 'https://placehold.co/1200x480.png',
    heroBannerOverlayOpacity: 0.3, adminChatAutoReply: "Thanks for reaching out! An admin will get back to you as soon as possible.",
};


export const useTests = () => {
    const { data, error, isLoading, mutate } = useSWR<Test[]>('tests', fetcher);
    const updateTest = React.useCallback(async (test: Test) => {
        const optimisticData = data?.map(t => t.id === test.id ? test : t) || [test];
        if (!data?.some(t => t.id === test.id)) {
            optimisticData.push(test);
        }
        await mutate(DataActions.upsertTest(test), { optimisticData, revalidate: false });
    }, [data, mutate]);

    const deleteTest = React.useCallback(async (id: string) => {
        const optimisticData = data?.filter(t => t.id !== id) || [];
        await mutate(DataActions.removeTest(id), { optimisticData, revalidate: false });
    }, [data, mutate]);

    return { 
        data, 
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
        const optimisticData = data?.map(c => c.id === category.id ? category : c) || [category];
        if (!data?.some(c => c.id === category.id)) {
            optimisticData.push(category);
        }
        await mutate(DataActions.upsertCategory(category), { optimisticData, revalidate: false });
    }, [data, mutate]);

    const deleteCategory = React.useCallback(async (id: string, deleteTests: boolean) => {
        const optimisticData = data?.filter(c => c.id !== id) || [];
        await mutate(DataActions.removeCategory(id, deleteTests), { optimisticData, revalidate: false });
    }, [data, mutate]);

    return {
        data,
        isLoading,
        error,
        mutate,
        updateCategory,
        deleteCategory,
    };
};

export const useAllUsers = () => {
    const { data, isLoading, mutate } = useSWR<User[]>('allUsers', fetcher);
    const updateUser = React.useCallback(async (id: string, userData: Partial<User>) => {
        const optimisticData = data?.map(u => u.id === id ? { ...u, ...userData } : u) || [];
        await mutate(DataActions.upsertUser({ id, ...userData }), { optimisticData, revalidate: false });
    }, [data, mutate]);

    const deleteStudent = React.useCallback(async (id: string) => {
        const optimisticData = data?.filter(u => u.id !== id);
        await mutate(DataActions.removeStudent(id), { optimisticData, revalidate: false });
    }, [data, mutate]);

    return {
        allUsers: data,
        isLoading,
        updateUser,
        deleteStudent,
        mutate
    };
};

export const useStudents = () => {
    const { allUsers, isLoading, deleteStudent: deleteUserAction } = useAllUsers();
    
    const students = React.useMemo(() => allUsers?.filter(u => u.role === 'student'), [allUsers]);

    const deleteStudent = React.useCallback(async (id: string) => {
        await deleteUserAction(id);
    }, [deleteUserAction]);

    return { 
        students, 
        isLoading: isLoading,
        deleteStudent
    };
};


export const useResults = () => {
    const { data, error, isLoading, mutate } = useSWR<Result[]>('results', fetcher);
    
    const updateResult = React.useCallback(async (result: Omit<Result, 'id'>) => {
        // Perform the server action and get the definitive result from the DB
        const newResult = await DataActions.upsertResult(result);
        
        // Update the local cache with the definitive data from the server.
        // This ensures the client has the correct ID generated by Prisma.
        mutate(currentData => {
            const updatedData = currentData ? 
                [...currentData.filter(r => !(r.testId === newResult.testId && r.userId === newResult.userId)), newResult] 
                : [newResult];
            return updatedData;
        }, false); // `false` to prevent immediate revalidation, as we just got the latest data.
        
        return newResult;
    }, [mutate]);


    return { 
        data, 
        isLoading, 
        error, 
        updateItem: updateResult
    };
};

export const useReports = () => {
    const { data, error, isLoading, mutate } = useSWR<Report[]>('reports', fetcher);
    const updateItem = React.useCallback(async (report: Report) => {
        const optimisticData = data?.map(r => r.id === report.id ? report : r) || [report];
        if (!data?.some(r => r.id === report.id)) {
            optimisticData.push(report);
        }
        await mutate(DataActions.upsertReport(report), { optimisticData, revalidate: false });
    }, [data, mutate]);
    
    return { 
        data, 
        isLoading, 
        error, 
        updateItem
    };
};

export const useChatThreads = () => {
    const { data, error, isLoading, mutate } = useSWR<ChatThread[]>('chatThreads', fetcher);

    const updateItem = React.useCallback(async (thread: ChatThread) => {
        const optimisticData = data?.map(t => t.id === thread.id ? thread : t) || [thread];
        if (!data?.some(t => t.id === thread.id)) {
            optimisticData.push(thread);
        }
        await mutate(DataActions.upsertChatThread(thread), { optimisticData, revalidate: false });
    }, [data, mutate]);

    const deleteItem = React.useCallback(async (id: string) => {
        const optimisticData = data?.filter(t => t.id !== id);
        await mutate(DataActions.removeChatThread(id), { optimisticData, revalidate: false });
    }, [data, mutate]);
    
    return {
        data,
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
        const optimisticData = data?.map(c => c.id === conversation.id ? conversation : c) || [conversation];
        if (!data?.some(c => c.id === conversation.id)) {
            optimisticData.push(conversation);
        }
        await mutate(DataActions.upsertSarthiBotConversation(conversation), { optimisticData, revalidate: false });
    }, [data, mutate]);

    const deleteSarthiBotConversation = React.useCallback(async (id: string) => {
        const optimisticData = data?.filter(c => c.id !== id);
        await mutate(DataActions.removeSarthiBotConversation(id), { optimisticData, revalidate: false });
    }, [data, mutate]);

     return {
        conversations: data,
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
        const options = { optimisticData, revalidate: false };
        await mutate(DataActions.upsertSiteSettings(newSettings), options as any);
    }, [settings, mutate]);

    return { settings, isLoading, error, updateSettings };
};
