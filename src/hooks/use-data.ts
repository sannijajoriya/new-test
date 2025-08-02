
'use client';

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import type { Test, Category, User, Result, Report, ChatThread, SarthiBotTrainingData, SarthiBotConversation, Feedback, SiteSettings } from '@/lib/types';
import { useAuth } from './use-auth';
import useSWR from 'swr';
import {
    fetchTests, fetchCategories, fetchAllUsers, fetchResults, fetchReports,
    fetchChatThreads, fetchSarthiBotTrainingData, fetchSarthiBotConversations,
    fetchStudentFeedbacks, fetchSiteSettings
} from '@/actions/data-actions';
import { upsertTest, removeTest } from '@/actions/data-actions';
import { upsertCategory, removeCategory } from '@/actions/data-actions';
import { upsertUser, removeStudent } from '@/actions/data-actions';
import { upsertResult } from '@/actions/data-actions';
import { upsertReport } from '@/actions/data-actions';
import { upsertChatThread, removeChatThread } from '@/actions/data-actions';
import { saveSarthiBotTrainingData, upsertSarthiBotConversation, removeSarthiBotConversation } from '@/actions/data-actions';
import { saveFeedbacks } from '@/actions/data-actions';
import { upsertSiteSettings } from '@/actions/data-actions';


interface DataContextType {
    user: User | null;
    isLoading: boolean;
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
    const { authUser, loading: authLoading } = useAuth();
    const { data: allUsers, isLoading: usersLoading } = useSWR(authUser ? 'allUsers' : null, fetchAllUsers);
    
    const user = useMemo(() => {
        if (!authUser || !allUsers) return null;
        return allUsers.find(u => u.id === authUser.id) || null;
    }, [authUser, allUsers]);

    const isLoading = authLoading || usersLoading;

    const value = useMemo(() => ({
        user,
        isLoading,
    }), [user, isLoading]);

    return React.createElement(DataContext.Provider, { value }, children);
};


// Custom Hooks for each data type
export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within a DataProvider.');
    return context;
};

export const useUser = () => useData().user;

export const useTests = () => {
    const { data, error, isLoading, mutate } = useSWR<Test[]>('tests', fetchTests);
    return { 
        data, 
        isLoading, 
        error, 
        mutate, 
        updateTest: async (test: Test) => {
            const optimisticData = data?.map(t => t.id === test.id ? test : t) || [test];
             if (!data?.some(t => t.id === test.id)) {
                optimisticData.push(test);
            }
            await mutate(upsertTest(test), { optimisticData, revalidate: false });
        },
        deleteTest: async (id: string) => {
            const optimisticData = data?.filter(t => t.id !== id) || [];
            await mutate(removeTest(id), { optimisticData, revalidate: false });
        }
    };
};

export const useCategories = () => {
    const { data, error, isLoading, mutate } = useSWR<Category[]>('categories', fetchCategories);
    return {
        data,
        isLoading,
        error,
        mutate,
        updateCategory: async (category: Category) => {
            const optimisticData = data?.map(c => c.id === category.id ? category : c) || [category];
            if (!data?.some(c => c.id === category.id)) {
                optimisticData.push(category);
            }
            await mutate(upsertCategory(category), { optimisticData, revalidate: false });
        },
        deleteCategory: async (id: string, deleteTests: boolean) => {
             const optimisticData = data?.filter(c => c.id !== id) || [];
             await mutate(removeCategory(id, deleteTests), { optimisticData, revalidate: false });
        }
    };
};

export const useAllUsers = () => {
    const { data, isLoading, mutate } = useSWR<User[]>('allUsers', fetchAllUsers);
     return {
        allUsers: data,
        isLoading,
        updateUser: async (id: string, userData: Partial<User>) => {
            const optimisticData = data?.map(u => u.id === id ? { ...u, ...userData } : u) || [];
            await mutate(upsertUser({ id, ...userData }), { optimisticData, revalidate: false });
        },
        deleteStudent: async (id: string) => {
            const optimisticData = data?.filter(u => u.id !== id);
            await mutate(removeStudent(id), { optimisticData, revalidate: false });
        },
        mutate
    };
};

export const useStudents = () => {
    const { data, isLoading, mutate } = useSWR('students', async () => {
        const users = await fetchAllUsers();
        return users.filter(u => u.role === 'student');
    });
    return { 
        students: data, 
        isLoading,
        deleteStudent: async (id: string) => {
            const optimisticData = data?.filter(u => u.id !== id);
            await mutate(removeStudent(id), { optimisticData, revalidate: false });
        }
    };
};

export const useAdminUser = () => {
    const { data, isLoading } = useSWR('adminUser', async () => {
        const users = await fetchAllUsers();
        return users.find(u => u.role === 'admin');
    });
    return { adminUser: data, isLoading };
};

export const useResults = () => {
    const { data, error, isLoading, mutate } = useSWR<Result[]>('results', fetchResults);
    return { 
        data, 
        isLoading, 
        error, 
        updateResult: async (result: Result) => {
            const optimisticData = data?.map(r => r.id === result.id ? result : r) || [result];
             if (!data?.some(r => r.id === result.id)) {
                optimisticData.push(result);
            }
            await mutate(upsertResult(result), { optimisticData, revalidate: false });
        }
    };
};

export const useReports = () => {
    const { data, error, isLoading, mutate } = useSWR<Report[]>('reports', fetchReports);
    return { 
        data, 
        isLoading, 
        error, 
        updateItem: async (report: Report) => {
             const optimisticData = data?.map(r => r.id === report.id ? report : r) || [report];
             if (!data?.some(r => r.id === report.id)) {
                optimisticData.push(report);
            }
            await mutate(upsertReport(report), { optimisticData, revalidate: false });
        }
    };
};

export const useChatThreads = () => {
    const { data, error, isLoading, mutate } = useSWR<ChatThread[]>('chatThreads', fetchChatThreads);
    return {
        data,
        isLoading,
        error,
        updateItem: async (thread: ChatThread) => {
            const optimisticData = data?.map(t => t.id === thread.id ? thread : t) || [thread];
             if (!data?.some(t => t.id === thread.id)) {
                optimisticData.push(thread);
            }
            await mutate(upsertChatThread(thread), { optimisticData, revalidate: false });
        },
        deleteItem: async (id: string) => {
            const optimisticData = data?.filter(t => t.id !== id);
            await mutate(removeChatThread(id), { optimisticData, revalidate: false });
        }
    };
};

export const useSarthiBotTrainingData = () => {
    const { data, error, isLoading, mutate } = useSWR<SarthiBotTrainingData[]>('sarthiBotTrainingData', fetchSarthiBotTrainingData);
    return { 
        trainingData: data, 
        isLoading, 
        error, 
        updateSarthiBotTrainingData: async (trainingData: SarthiBotTrainingData[]) => {
            await mutate(saveSarthiBotTrainingData(trainingData), { optimisticData: trainingData, revalidate: false });
        }
    };
};

export const useSarthiBotConversations = () => {
    const { data, error, isLoading, mutate } = useSWR<SarthiBotConversation[]>('sarthiBotConversations', fetchSarthiBotConversations);
     return {
        conversations: data,
        isLoading,
        error,
        updateSarthiBotConversation: async (conversation: SarthiBotConversation) => {
            const optimisticData = data?.map(c => c.id === conversation.id ? conversation : c) || [conversation];
             if (!data?.some(c => c.id === conversation.id)) {
                optimisticData.push(conversation);
            }
            await mutate(upsertSarthiBotConversation(conversation), { optimisticData, revalidate: false });
        },
        deleteSarthiBotConversation: async (id: string) => {
            const optimisticData = data?.filter(c => c.id !== id);
            await mutate(removeSarthiBotConversation(id), { optimisticData, revalidate: false });
        }
    };
};

export const useFeedbacks = () => {
    const { data, error, isLoading, mutate } = useSWR<Feedback[]>('feedbacks', fetchStudentFeedbacks);
    return { 
        data, 
        isLoading, 
        error,
        updateFeedbacks: async (feedbacks: Feedback[]) => {
            await mutate(saveFeedbacks(feedbacks), { optimisticData: feedbacks, revalidate: false });
        }
    };
};

export const useSiteSettings = () => {
    const { data, error, isLoading, mutate } = useSWR<SiteSettings | null>('siteSettings', fetchSiteSettings, {
        fallbackData: defaultSiteSettings
    });
    
    const settings = data ? { ...defaultSiteSettings, ...data } : defaultSiteSettings;

    const updateSettings = async (newSettings: Partial<SiteSettings>) => {
        const optimisticData = { ...settings, ...newSettings };
        const options = { optimisticData, revalidate: false };
        await mutate(upsertSiteSettings(newSettings), options as any);
    };

    return { settings, isLoading, error, updateSettings };
};
