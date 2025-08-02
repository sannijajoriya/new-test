
'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { Test, Category, User, Result, Report, ChatThread, SarthiBotTrainingData, SarthiBotConversation, Feedback, SiteSettings, Question, DirectMessage, ChatMessage, SarthiBotMessage } from '@/lib/types';

// Helper to handle JSON conversion for Prisma - no longer needed for fields that are now JSON type
function serialize<T>(data: T): T {
    return JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
}

// Fetch Actions
export async function fetchTests(): Promise<Test[]> {
  const tests = await prisma.test.findMany();
  return tests as Test[];
}

export async function fetchCategories(): Promise<Category[]> {
  const categories = await prisma.category.findMany();
  return categories as Category[];
}

export async function fetchAllUsers(): Promise<User[]> {
    return serialize(await prisma.user.findMany());
}

export async function fetchResults(): Promise<Result[]> {
    const results = await prisma.result.findMany();
    return results as Result[];
}

export async function fetchReports(): Promise<Report[]> {
    const reports = await prisma.report.findMany();
    return reports as Report[];
}

export async function fetchChatThreads(): Promise<ChatThread[]> {
    const threads = await prisma.chatThread.findMany();
    return threads as ChatThread[];
}

export async function fetchSarthiBotTrainingData(): Promise<SarthiBotTrainingData[]> {
    return serialize(await prisma.sarthiBotTrainingData.findMany());
}

export async function fetchSarthiBotConversations(): Promise<SarthiBotConversation[]> {
    const convos = await prisma.sarthiBotConversation.findMany();
    return convos as SarthiBotConversation[];
}

export async function fetchStudentFeedbacks(): Promise<Feedback[]> {
    return serialize(await prisma.feedback.findMany());
}

export async function fetchSiteSettings(): Promise<SiteSettings | null> {
    return serialize(await prisma.siteSettings.findUnique({ 
        where: { id: 'default' },
    }));
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
    }));
}

export async function verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.password && await bcrypt.compare(password, user.password)) {
        const { password: _, ...userWithoutPassword } = user;
        return serialize(userWithoutPassword as User);
    }
    return null;
}

// Upsert Actions
export async function upsertUser(data: Partial<User> & { id: string }) {
    const updateData: any = { ...data };
    if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
    }
    const createData: any = { ...data };
     if (data.password) {
        createData.password = await bcrypt.hash(data.password, 10);
    } else {
        // A password is required for creation, but we may not have it.
        // This is a bit of a hack for this simplified setup.
        // A real app would separate user creation and updates more cleanly.
        delete createData.password;
    }


    return serialize(await prisma.user.upsert({
        where: { id: data.id },
        update: updateData,
        create: createData as any,
    }));
}

export async function upsertTest(test: Test) {
    const testData = { ...test, id: test.id || undefined };
    return serialize(await prisma.test.upsert({
        where: { id: test.id || 'new' },
        update: testData as any,
        create: testData as any,
    }));
}

export async function upsertCategory(category: Category) {
    const categoryData = { ...category, id: category.id || undefined };
     return serialize(await prisma.category.upsert({
        where: { id: category.id || 'new' },
        update: categoryData as any,
        create: categoryData as any,
    }));
}

export async function upsertResult(result: Result) {
    const data = { ...result };
    return serialize(await prisma.result.upsert({
        where: { id: result.id || 'new' },
        update: data as any,
        create: data as any,
    }));
}

export async function upsertReport(report: Report) {
    const data = { ...report };
    return serialize(await prisma.report.upsert({
        where: { id: report.id || 'new' },
        update: data as any,
        create: data as any,
    }));
}

export async function upsertChatThread(thread: ChatThread) {
    const data = { ...thread };
    return serialize(await prisma.chatThread.upsert({
        where: { studentId: thread.studentId },
        update: data as any,
        create: data as any,
    }));
}

export async function saveSarthiBotTrainingData(data: SarthiBotTrainingData[]) {
    await prisma.sarthiBotTrainingData.deleteMany({});
    return serialize(await prisma.sarthiBotTrainingData.createMany({ data }));
}

export async function upsertSarthiBotConversation(conversation: SarthiBotConversation) {
    const data = { ...conversation };
    return serialize(await prisma.sarthiBotConversation.upsert({
        where: { studentId: conversation.studentId },
        update: data as any,
        create: data as any,
    }));
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
    }));
}

// Delete Actions
export async function removeTest(testId: string) {
    return await prisma.test.delete({ where: { id: testId } });
}

export async function removeCategory(categoryId: string, deleteTests: boolean) {
    if (deleteTests) {
        await prisma.test.deleteMany({ where: { categoryId } });
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
