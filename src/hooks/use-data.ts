
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
        await DataActions.upsertTest(test);
        mutate(); 
    }, [mutate]);

    const deleteTest = React.useCallback(async (id: string) => {
        await DataActions.removeTest(id);
        mutate();
    }, [mutate]);

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
        await DataActions.upsertCategory(category);
        mutate();
    }, [mutate]);

    const deleteCategory = React.useCallback(async (id: string, deleteTests: boolean) => {
        await DataActions.removeCategory(id, deleteTests);
        mutate();
    }, [mutate]);

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
        await DataActions.upsertUser({ id, ...userData });
        mutate();
    }, [mutate]);

    const deleteStudent = React.useCallback(async (id: string) => {
        await DataActions.removeStudent(id);
        mutate();
    }, [mutate]);

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
        mutate();
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
        await DataActions.upsertReport(report);
        mutate();
    }, [mutate]);
    
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
        await DataActions.upsertChatThread(thread);
        mutate();
    }, [mutate]);

    const deleteItem = React.useCallback(async (id: string) => {
        await DataActions.removeChatThread(id);
        mutate();
    }, [mutate]);
    
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
        await DataActions.saveSarthiBotTrainingData(trainingData);
        mutate();
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
        await DataActions.upsertSarthiBotConversation(conversation);
        mutate();
    }, [mutate]);


    const deleteSarthiBotConversation = React.useCallback(async (id: string) => {
        await DataActions.removeSarthiBotConversation(id);
        mutate();
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
        await DataActions.saveFeedbacks(feedbacks);
        mutate();
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
        // This is the corrected, simpler, and more robust logic.
        // It tells SWR that the data is stale and needs to be refetched
        // after the update operation completes.
        await DataActions.upsertSiteSettings(newSettings);
        mutate();
    }, [mutate]);

    return { settings, isLoading, error, updateSettings };
};

// Re-export useUser and useAdminUser from use-auth to colocate all data hooks
export { useUser, useAdminUser } from '@/hooks/use-auth';
