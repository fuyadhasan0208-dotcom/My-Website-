export type SubjectOption =
  | 'Science'
  | 'Mathematics'
  | 'English'
  | 'General Knowledge'
  | 'Programming'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Other';

export type StudentLevel =
  | 'Primary'
  | 'Secondary (SSC)'
  | 'Higher Secondary (HSC)'
  | 'University'
  | 'Admission Preparation'
  | 'Job Preparation';

export type ExplanationStyle =
  | 'Simple Summary'
  | 'Detailed Explanation with Examples'
  | 'Flashcard Points';

export type LearningLanguage = 'Bangla' | 'English' | 'Mixed Bangla-English';

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

export type SupportedModel = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';

export interface AppSettings {
  model: SupportedModel;
  temperature: number;
  preferredLanguage: LearningLanguage;
  defaultLevel: StudentLevel;
}

export interface ExplainTopicRequest {
  subject: SubjectOption;
  level: StudentLevel;
  topic: string;
  style: ExplanationStyle;
  language: LearningLanguage;
}

export interface SavedStudyNote {
  id: string;
  subject: SubjectOption;
  level: StudentLevel;
  topic: string;
  style: ExplanationStyle;
  language: LearningLanguage;
  content: string;
  flashcards?: FlashcardItem[];
  createdAt: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

export interface QuizConfig {
  subject: SubjectOption;
  topic: string;
  level: StudentLevel;
  questionCount: 5 | 10 | 15 | 20;
  difficulty: QuizDifficulty;
  language: 'Bangla' | 'English';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: QuizDifficulty;
}

export interface QuizAttemptSummary {
  id: string;
  subject: SubjectOption;
  topic: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  difficulty: QuizDifficulty;
  createdAt: string;
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface StudyPlanRequest {
  studentName?: string;
  examName: string;
  subjects: string[];
  dailyHours: number;
  examDate: string;
  weakSubjects: string[];
  language: LearningLanguage;
}

export interface DailyScheduleSlot {
  timeBlock: string;
  activity: string;
  subject: string;
  focusTip: string;
}

export interface SubjectAllocationItem {
  subject: string;
  hoursPerWeek: number;
  priority: 'High' | 'Medium' | 'Standard';
  strategy: string;
}

export interface StudyPlanResponse {
  overview: string;
  dailySchedule: DailyScheduleSlot[];
  subjectAllocation: SubjectAllocationItem[];
  breakSchedule: string[];
  revisionSessions: string[];
  practiceTests: string[];
  weeklyGoals: string[];
  markdownPlan: string;
}

export interface SavedStudyPlan {
  id: string;
  request: StudyPlanRequest;
  plan: StudyPlanResponse;
  createdAt: string;
}

export interface ApiConnectionTestResult {
  ok: boolean;
  configured: boolean;
  model: string;
  latencyMs: number;
  message: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}
