

// NOTE: `@@unique([testId, userId])` is enforced in the schema for the Result model.
export interface Category {
  id: string;
  name: string;
  logoImageUrl?: string | null;
  bannerImageUrl?: string | null;
  userCount?: number;
  description?: string | null;
  languages?: string | null;
  features?: string[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  imageUrl?: string;
}

export interface Test {
  id:string;
  title: string;
  duration: number; 
  questions: Question[];
  marksPerCorrect: number;
  negativeMarksPerWrong: number;
  guidelines?: string | null;
  categoryId?: string | null;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string | null;
  profilePictureUrl?: string | null;
  role: 'student' | 'admin';
  createdAt?: Date;
}

export interface Result {
  id: string; 
  testId: string;
  userId: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  timeTaken: number; 
  answers: Record<string, string>; 
  submittedAt: Date; 
}

export interface ChatMessage {
  sender: 'student' | 'admin';
  message: string;
  timestamp: Date;
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
  createdAt: Date;
}

export interface DirectMessage {
  sender: 'student' | 'admin';
  text: string;
  timestamp: Date;
}

export interface ChatThread {
  id: string; 
  studentId: string;
  studentName: string;
  messages: DirectMessage[];
  lastMessageAt: Date;
  seenByAdmin: boolean;
}

export interface Feedback {
  id: string;
  studentId: string;
  fullName: string;
  city: string;
  message: string;
  photoUrl?: string | null;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  order?: number;
}

export interface SiteSettings {
  id?: 'default';
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
  image?: string; 
}

export interface SarthiBotTrainingData {
    id: string;
    question: string;
    answer: string;
}

export interface SarthiBotConversation {
    id: string; 
    studentId: string;
    studentName: string;
    messages: SarthiBotMessage[];
    lastMessageAt: Date;
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
