



export interface Category {
  id: string;
  name: string;
  logoImageUrl?: string;
  bannerImageUrl?: string;
  userCount?: number;
  description?: string;
  languages?: string;
  features?: string[];
}

export interface Question {
  id:string;
  text: string;
  options: string[];
  correctAnswer: string;
  imageUrl?: string;
}

export interface Test {
  id: string;
  title: string;
  duration: number; // in minutes
  questions: Question[];
  marksPerCorrect: number;
  negativeMarksPerWrong: number;
  guidelines?: string;
  categoryId?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  profilePictureUrl?: string;
  role: 'student' | 'admin';
  createdAt: number;
}

export interface Result {
  id: string; // Composite key: `${userId}_${testId}`
  testId: string;
  userId: string;
  score: number; // final calculated score
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  timeTaken: number; // in seconds
  answers: Record<string, string>; // { questionId: selectedOption }
  submittedAt: number; // timestamp
}

export interface ChatMessage {
  sender: 'student' | 'admin';
  message: string;
  timestamp: number;
}

export interface Report {
  id: string;
  studentId: string;
  studentName: string;
  testId: string;
  testTitle: string;
  questionId: string;
  questionText: string;
  reason: string;
  remarks: string;
  status: 'pending' | 'responded';
  chat: ChatMessage[];
  createdAt: number;
}

export interface DirectMessage {
  sender: 'student' | 'admin';
  text: string;
  timestamp: number;
}

export interface ChatThread {
  id: string; // studentId
  studentId: string;
  studentName: string;
  messages: DirectMessage[];
  lastMessageAt: number;
  seenByAdmin: boolean;
}

export interface Feedback {
  id: string;
  studentId: string;
  fullName: string;
  city: string;
  message: string;
  photoUrl?: string;
  createdAt: number;
  status: 'pending' | 'approved' | 'rejected';
  order?: number;
}

export interface SiteSettings {
  id?: 'default'; // Singleton document
  logoUrl?: string;
  botName?: string;
  botAvatarUrl?: string;
  botIntroMessage?: string;
  isBotEnabled?: boolean;
  isNewsBannerEnabled?: boolean;
  newsBannerImageUrl?: string;
  newsBannerTitle?: string;
  newsBannerLink?: string;
  newsBannerDisplayRule?: 'always' | 'session';
  heroBannerText?: string;
  isHeroBannerTextEnabled?: boolean;
  heroBannerImageUrl?: string;
  heroBannerOverlayOpacity?: number;
  adminChatAutoReply?: string;
}

export interface SarthiBotMessage {
  role: 'user' | 'bot';
  text: string;
  image?: string; // dataURI for user's image
}

export interface SarthiBotTrainingData {
    id: string;
    question: string;
    answer: string;
}

export interface SarthiBotConversation {
    id: string; // studentId
    studentId: string;
    studentName: string;
    messages: SarthiBotMessage[];
    lastMessageAt: number;
}

export interface ChatHistory {
  role: 'user' | 'model';
  content: {
    text?: string;
    media?: {
      url: string;
      contentType?: string;
    };
  }[];
}

// For Supabase client typing
export interface AllData {
  public: {
    Tables: {
      tests: {
        Row: Test;
        Insert: Omit<Test, 'id'>;
        Update: Partial<Test>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id'>;
        Update: Partial<Category>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'id'>;
        Update: Partial<User>;
      };
       results: {
        Row: Result;
        Insert: Omit<Result, 'id'>;
        Update: Partial<Result>;
      };
       reports: {
        Row: Report;
        Insert: Omit<Report, 'id'>;
        Update: Partial<Report>;
      };
      chatThreads: {
        Row: ChatThread;
        Insert: Omit<ChatThread, 'id'>;
        Update: Partial<ChatThread>;
      };
      sarthiBotTrainingData: {
        Row: SarthiBotTrainingData;
        Insert: Omit<SarthiBotTrainingData, 'id'>;
        Update: Partial<SarthiBotTrainingData>;
      };
      sarthiBotConversations: {
        Row: SarthiBotConversation;
        Insert: Omit<SarthiBotConversation, 'id'>;
        Update: Partial<SarthiBotConversation>;
      };
      studentFeedbacks: {
        Row: Feedback;
        Insert: Omit<Feedback, 'id'>;
        Update: Partial<Feedback>;
      };
      siteSettings: {
        Row: SiteSettings;
        Insert: SiteSettings;
        Update: Partial<SiteSettings>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}
