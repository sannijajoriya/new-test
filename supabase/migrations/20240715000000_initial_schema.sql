-- Initial Schema for UdaanSarthi

-- Create users table
-- This table stores user profile information.
CREATE TABLE users (
    id UUID PRIMARY KEY, -- References auth.users(id)
    fullName TEXT,
    email TEXT UNIQUE,
    profilePictureUrl TEXT,
    role TEXT DEFAULT 'student',
    createdAt BIGINT
);

-- Create categories table
-- This table stores test categories or series.
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logoImageUrl TEXT,
    bannerImageUrl TEXT,
    userCount INT,
    description TEXT,
    languages TEXT,
    features TEXT[]
);

-- Create tests table
-- This table stores all the tests.
CREATE TABLE tests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    duration INT NOT NULL,
    marksPerCorrect INT DEFAULT 1,
    negativeMarksPerWrong INT DEFAULT 0,
    guidelines TEXT,
    categoryId TEXT REFERENCES categories(id) ON DELETE SET NULL,
    questions JSONB NOT NULL
);

-- Create results table
-- This table stores the results of tests taken by users.
CREATE TABLE results (
    id TEXT PRIMARY KEY, -- Composite key: `${userId}_${testId}`
    testId TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INT NOT NULL,
    correctCount INT NOT NULL,
    wrongCount INT NOT NULL,
    unansweredCount INT NOT NULL,
    timeTaken INT NOT NULL,
    answers JSONB NOT NULL,
    submittedAt BIGINT NOT NULL,
    UNIQUE(testId, userId)
);

-- Create reports table
-- This table stores issues reported by students.
CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    studentId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    studentName TEXT NOT NULL,
    testId TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    testTitle TEXT NOT NULL,
    questionId TEXT NOT NULL,
    questionText TEXT NOT NULL,
    reason TEXT NOT NULL,
    remarks TEXT,
    status TEXT DEFAULT 'pending',
    chat JSONB,
    createdAt BIGINT
);

-- Create chatThreads table
-- This table stores direct messages between students and admin.
CREATE TABLE chatThreads (
    id TEXT PRIMARY KEY, -- Corresponds to studentId
    studentId UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    studentName TEXT NOT NULL,
    messages JSONB,
    lastMessageAt BIGINT,
    seenByAdmin BOOLEAN DEFAULT false
);

-- Create sarthiBotTrainingData table
-- This table stores Q&A pairs for the Sarthi AI Bot.
CREATE TABLE sarthiBotTrainingData (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL
);

-- Create sarthiBotConversations table
-- This table stores conversation histories with the Sarthi AI Bot.
CREATE TABLE sarthiBotConversations (
    id TEXT PRIMARY KEY, -- Corresponds to studentId
    studentId UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    studentName TEXT NOT NULL,
    messages JSONB,
    lastMessageAt BIGINT
);

-- Create studentFeedbacks table
-- This table stores feedback and testimonials from students.
CREATE TABLE studentFeedbacks (
    id TEXT PRIMARY KEY,
    studentId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fullName TEXT NOT NULL,
    city TEXT NOT NULL,
    message TEXT NOT NULL,
    photoUrl TEXT,
    createdAt BIGINT,
    status TEXT DEFAULT 'pending',
    "order" INT
);

-- Create siteSettings table
-- This is a singleton table to hold site-wide settings.
CREATE TABLE siteSettings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    logoUrl TEXT,
    botName TEXT,
    botAvatarUrl TEXT,
    botIntroMessage TEXT,
    isBotEnabled BOOLEAN,
    isNewsBannerEnabled BOOLEAN,
    newsBannerImageUrl TEXT,
    newsBannerTitle TEXT,
    newsBannerLink TEXT,
    newsBannerDisplayRule TEXT,
    heroBannerText TEXT,
    isHeroBannerTextEnabled BOOLEAN,
    heroBannerImageUrl TEXT,
    heroBannerOverlayOpacity REAL,
    adminChatAutoReply TEXT,
    CONSTRAINT singleton_check CHECK (id = 'default')
);

-- Insert default settings
INSERT INTO siteSettings(id) VALUES('default');


-- RLS Policies --
-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatThreads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sarthiBotConversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studentFeedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sarthiBotTrainingData ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siteSettings ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Allow user to read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow user to update own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow admin to manage users" ON public.users FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

-- Policies for other tables (general access for authenticated users, full access for admin)
CREATE POLICY "Allow all authenticated users to read" ON public.categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users to read" ON public.tests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users to read" ON public.studentFeedbacks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users to read" ON public.siteSettings FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow user to manage their own results" ON public.results FOR ALL USING (auth.uid() = userId);
CREATE POLICY "Allow user to manage their own reports" ON public.reports FOR ALL USING (auth.uid() = studentId);
CREATE POLICY "Allow user to manage their own chat thread" ON public.chatThreads FOR ALL USING (auth.uid() = studentId);
CREATE POLICY "Allow user to manage their own bot conversations" ON public.sarthiBotConversations FOR ALL USING (auth.uid() = studentId);
CREATE POLICY "Allow user to submit feedback" ON public.studentFeedbacks FOR INSERT WITH CHECK (auth.uid() = studentId);


CREATE POLICY "Allow admin full access" ON public.categories FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Allow admin full access" ON public.tests FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Allow admin full access" ON public.results FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Allow admin full access" ON public.reports FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Allow admin full access" ON public.chatThreads FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Allow admin full access" ON public.sarthiBotTrainingData FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Allow admin full access" ON public.sarthiBotConversations FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Allow admin full access" ON public.studentFeedbacks FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Allow admin full access" ON public.siteSettings FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
