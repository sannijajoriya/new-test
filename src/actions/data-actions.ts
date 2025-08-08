

'use server';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { Test, Category, User, Result, Report, ChatThread, SarthiBotTrainingData, SarthiBotConversation, Feedback, SiteSettings, Question, DirectMessage, ChatMessage, SarthiBotMessage } from '@/lib/types';

const prisma = new PrismaClient();

// Helper to handle JSON conversion for Prisma
function serialize<T>(data: T): T {
    // Using JSON.parse(JSON.stringify(...)) is a robust way to ensure deep conversion
    // of any non-serializable values (like Date objects in nested structures) and to
    // correctly type the complex JSON fields from Prisma.
    return JSON.parse(JSON.stringify(data));
}

// Fetch Actions
export async function fetchTests(): Promise<Test[]> {
  const tests = await prisma.test.findMany();
  // The 'questions' field is of type Json. We must properly cast it.
  // Using a helper function handles any potential complexities.
  return serialize(tests) as unknown as Test[];
}

export async function fetchCategories(): Promise<Category[]> {
  const categories = await prisma.category.findMany();
  return categories as Category[];
}

export async function fetchAllUsers(): Promise<User[]> {
    return serialize(await prisma.user.findMany()) as unknown as User[];
}

export async function fetchResults(): Promise<Result[]> {
    const results = await prisma.result.findMany();
    return results as unknown as Result[];
}

export async function fetchReports(): Promise<Report[]> {
    const reports = await prisma.report.findMany();
    return serialize(reports) as unknown as Report[];
}

export async function fetchChatThreads(): Promise<ChatThread[]> {
    const threads = await prisma.chatThread.findMany();
    // The 'messages' field contains Date objects that need serialization.
    return serialize(threads) as unknown as ChatThread[];
}

export async function fetchSarthiBotTrainingData(): Promise<SarthiBotTrainingData[]> {
    return serialize(await prisma.sarthiBotTrainingData.findMany()) as unknown as SarthiBotTrainingData[];
}

export async function fetchSarthiBotConversations(): Promise<SarthiBotConversation[]> {
    const convos = await prisma.sarthiBotConversation.findMany();
    return serialize(convos) as unknown as SarthiBotConversation[];
}

export async function fetchStudentFeedbacks(): Promise<Feedback[]> {
    return serialize(await prisma.feedback.findMany()) as unknown as Feedback[];
}

export async function fetchSiteSettings(): Promise<SiteSettings | null> {
    return serialize(await prisma.siteSettings.findUnique({ 
        where: { id: 'default' },
    })) as SiteSettings | null;
}


// Auth Actions
export async function createUser(fullName: string, email: string, password: string): Promise<User> {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error("User with this email already exists.");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = email.toLowerCase() === 'sunnyjajoriya2003@gmail.com' ? 'admin' : 'student';

    return serialize(await prisma.user.create({
        data: {
            fullName,
            email,
            password: hashedPassword,
            role: userRole,
        }
    })) as unknown as User;
}

export async function verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.password && await bcrypt.compare(password, user.password)) {
        const { password: _, ...userWithoutPassword } = user;
        return serialize(userWithoutPassword as User) as unknown as User;
    }
    return null;
}

// Upsert Actions
export async function upsertUser(data: Partial<User> & { id: string }) {
    const { id, ...updateData } = data;
    if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return serialize(await prisma.user.upsert({
        where: { id: id }, 
        update: updateData,
        create: {
            ...updateData,
            // Ensure required fields are present for creation
            fullName: updateData.fullName || 'New User',
            email: updateData.email || `user-${Date.now()}@example.com`,
            role: updateData.role || 'student',
        } as any,
    })) as unknown as User;
}

export async function upsertTest(test: Test) {
    const testData = { ...test, id: test.id || undefined };
    return serialize(await prisma.test.upsert({
        where: { id: test.id || 'new' },
        update: testData as any,
        create: testData as any,
    })) as unknown as Test;
}

export async function upsertCategory(category: Category): Promise<Category> {
  const { id, ...data } = category;

  // Check if a category with this ID already exists
  const existingCategory = await prisma.category.findUnique({
    where: { id: id },
  });

  if (existingCategory) {
    // If it exists, update it
    const updatedCategory = await prisma.category.update({
      where: { id: id },
      data: data,
    });
    return serialize(updatedCategory) as unknown as Category;
  } else {
    // If it does not exist, create it
    const newCategory = await prisma.category.create({
      data: {
        id: id,
        ...data,
      },
    });
    return serialize(newCategory) as unknown as Category;
  }
}


export async function upsertResult(result: Omit<Result, 'id'>): Promise<Result> {
    const { testId, userId } = result;

    const dataToUpsert = {
        ...result,
        submittedAt: new Date(result.submittedAt),
    };

    const createdOrUpdatedResult = await prisma.result.upsert({
        where: {
            testId_userId: {
                testId,
                userId,
            },
        },
        update: {
            ...dataToUpsert,
            submittedAt: new Date(dataToUpsert.submittedAt), // Ensure date object on update
        },
        create: {
             ...dataToUpsert,
            submittedAt: new Date(dataToUpsert.submittedAt), // Ensure date object on create
        },
    });
    return serialize(createdOrUpdatedResult) as unknown as Result;
}


export async function upsertReport(report: Report) {
    const data = { ...report };
    return serialize(await prisma.report.upsert({
        where: { id: report.id || 'new' },
        update: data as any,
        create: data as any,
    })) as unknown as Report;
}

export async function upsertChatThread(thread: ChatThread) {
    const data = { 
        ...thread,
        lastMessageAt: new Date(thread.lastMessageAt),
        messages: thread.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
    };
    return serialize(await prisma.chatThread.upsert({
        where: { studentId: thread.studentId },
        update: data as any,
        create: data as any,
    })) as unknown as ChatThread;
}

export async function saveSarthiBotTrainingData(data: SarthiBotTrainingData[]) {
    await prisma.sarthiBotTrainingData.deleteMany({});
    return serialize(await prisma.sarthiBotTrainingData.createMany({ data })) as unknown as SarthiBotTrainingData[];
}

export async function upsertSarthiBotConversation(conversation: SarthiBotConversation) {
    const data = { ...conversation };
    return serialize(await prisma.sarthiBotConversation.upsert({
        where: { studentId: conversation.studentId },
        update: data as any,
        create: data as any,
    })) as unknown as SarthiBotConversation;
}

export async function saveFeedbacks(feedbacks: Feedback[]) {
    // This is a simple implementation. For large datasets, a more granular approach would be better.
    for (const feedback of feedbacks) {
        await prisma.feedback.upsert({
            where: { id: feedback.id || 'new' },
            update: feedback,
            create: feedback as any,
        });
    }
}

export async function upsertSiteSettings(settings: Partial<SiteSettings>) {
    return serialize(await prisma.siteSettings.upsert({
        where: { id: 'default' },
        update: settings,
        create: { ...settings, id: 'default' } as any,
    })) as unknown as SiteSettings;
}

// Delete Actions
export async function removeTest(testId: string) {
    return await prisma.test.delete({ where: { id: testId } });
}

export async function removeCategory(categoryId: string, deleteTests: boolean) {
    if (deleteTests) {
        await prisma.test.deleteMany({ where: { categoryId } });
    } else {
        // Unassign tests instead of deleting them
        await prisma.test.updateMany({
            where: { categoryId },
            data: { categoryId: null },
        });
    }
    return await prisma.category.delete({ where: { id: categoryId } });
}

export async function removeStudent(studentId: string) {
    return await prisma.user.delete({ where: { id: studentId } });
}

export async function removeChatThread(threadId: string) {
    // ID is studentId in this case for chat threads
    return await prisma.chatThread.delete({ where: { studentId: threadId } });
}

export async function removeSarthiBotConversation(conversationId: string) {
    // ID is studentId in this case
    return await prisma.sarthiBotConversation.delete({ where: { studentId: conversationId } });
}
