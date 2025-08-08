

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
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    return serialize(settings);
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
    const { id, ...testData } = test;
    const dataToSave = {
        ...testData,
        questions: testData.questions as any, // Prisma expects JsonValue for questions
    };

    if (id && !id.startsWith('new-')) {
        // This is an update to an existing test
        return serialize(await prisma.test.update({
            where: { id: id },
            data: dataToSave,
        })) as unknown as Test;
    } else {
        // This is a new test, so we let Prisma generate the ID
        return serialize(await prisma.test.create({
            data: dataToSave,
        })) as unknown as Test;
    }
}


export async function upsertCategory(category: Category): Promise<Category> {
  const { id, ...data } = category;

  if (id && !id.startsWith('cat-')) {
    // This is an update to an existing category
    const updatedCategory = await prisma.category.update({
      where: { id: id },
      data: data,
    });
    return serialize(updatedCategory) as unknown as Category;
  } else {
    // This is a new category, so we let Prisma generate the ID
    const newCategory = await prisma.category.create({
      data: data,
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
    const data = { ...report, chat: report.chat as any };
    if (report.id && !report.id.startsWith('new-')) {
        return serialize(await prisma.report.update({
            where: { id: report.id },
            data: data
        })) as unknown as Report;
    }
    return serialize(await prisma.report.create({ data })) as unknown as Report;
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
    // Manually handle ID creation for this model if it's not autoincrement
    const dataToCreate = data.map(item => ({ question: item.question, answer: item.answer }));
    return serialize(await prisma.sarthiBotTrainingData.createMany({ data: dataToCreate })) as any;
}

export async function upsertSarthiBotConversation(conversation: SarthiBotConversation) {
    const data = { ...conversation, messages: conversation.messages as any };
    return serialize(await prisma.sarthiBotConversation.upsert({
        where: { studentId: conversation.studentId },
        update: data,
        create: data,
    })) as unknown as SarthiBotConversation;
}

export async function saveFeedbacks(feedbacks: Feedback[]) {
    for (const feedback of feedbacks) {
        const { id, ...data } = feedback;
        await prisma.feedback.upsert({
            where: { id: id || 'new' },
            update: data,
            create: data as any,
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
    await prisma.result.deleteMany({ where: { testId } });
    return await prisma.test.delete({ where: { id: testId } });
}

export async function removeCategory(categoryId: string, deleteTests: boolean) {
    if (deleteTests) {
        // First delete results for all tests in this category
        const testsToDelete = await prisma.test.findMany({ where: { categoryId } });
        const testIds = testsToDelete.map(t => t.id);
        await prisma.result.deleteMany({ where: { testId: { in: testIds } } });
        // Then delete the tests
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
