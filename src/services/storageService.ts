import type {
  AppSettings,
  ChatMessageItem,
  QuizAttemptSummary,
  SavedStudyNote,
  SavedStudyPlan,
} from '../types';

const KEYS = {
  SETTINGS: 'edugenius_settings_v1',
  CHAT_HISTORY: 'edugenius_tutor_chat_v1',
  STUDY_NOTES: 'edugenius_study_notes_v1',
  QUIZ_HISTORY: 'edugenius_quiz_history_v1',
  STUDY_PLANS: 'edugenius_study_plans_v1',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  model: 'gemini-4-hydrogen',
  temperature: 0.4,
  preferredLanguage: 'Bangla',
  defaultLevel: 'Higher Secondary (HSC)',
};

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota or restricted context errors
  }
}

function safeRemoveItem(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore restricted context errors
  }
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const storageService = {
  getSettings(): AppSettings {
    const parsed = safeParse<Partial<AppSettings>>(
      safeGetItem(KEYS.SETTINGS),
      {}
    );
    const model =
      parsed.model === 'gemini-4-hydrogen' || parsed.model === 'gemini-3.1-flash-lite'
        ? parsed.model
        : DEFAULT_SETTINGS.model;
    const temperature =
      typeof parsed.temperature === 'number' &&
      parsed.temperature >= 0.2 &&
      parsed.temperature <= 0.7
        ? Number(parsed.temperature.toFixed(1))
        : DEFAULT_SETTINGS.temperature;

    return {
      model,
      temperature,
      preferredLanguage: parsed.preferredLanguage ?? DEFAULT_SETTINGS.preferredLanguage,
      defaultLevel: parsed.defaultLevel ?? DEFAULT_SETTINGS.defaultLevel,
    };
  },

  saveSettings(settings: AppSettings): void {
    safeSetItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  resetSettings(): AppSettings {
    safeSetItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    return { ...DEFAULT_SETTINGS };
  },

  getChatHistory(): ChatMessageItem[] {
    return safeParse<ChatMessageItem[]>(safeGetItem(KEYS.CHAT_HISTORY), []);
  },

  saveChatHistory(messages: ChatMessageItem[]): void {
    safeSetItem(KEYS.CHAT_HISTORY, JSON.stringify(messages.slice(-60)));
  },

  clearChatHistory(): void {
    safeRemoveItem(KEYS.CHAT_HISTORY);
  },

  getStudyNotes(): SavedStudyNote[] {
    return safeParse<SavedStudyNote[]>(safeGetItem(KEYS.STUDY_NOTES), []);
  },

  saveStudyNote(note: SavedStudyNote): SavedStudyNote[] {
    const existing = this.getStudyNotes();
    const updated = [note, ...existing.filter((n) => n.id !== note.id)].slice(0, 20);
    safeSetItem(KEYS.STUDY_NOTES, JSON.stringify(updated));
    return updated;
  },

  deleteStudyNote(id: string): SavedStudyNote[] {
    const updated = this.getStudyNotes().filter((n) => n.id !== id);
    safeSetItem(KEYS.STUDY_NOTES, JSON.stringify(updated));
    return updated;
  },

  getQuizHistory(): QuizAttemptSummary[] {
    return safeParse<QuizAttemptSummary[]>(safeGetItem(KEYS.QUIZ_HISTORY), []);
  },

  saveQuizAttempt(attempt: QuizAttemptSummary): QuizAttemptSummary[] {
    const updated = [attempt, ...this.getQuizHistory()].slice(0, 20);
    safeSetItem(KEYS.QUIZ_HISTORY, JSON.stringify(updated));
    return updated;
  },

  getStudyPlans(): SavedStudyPlan[] {
    return safeParse<SavedStudyPlan[]>(safeGetItem(KEYS.STUDY_PLANS), []);
  },

  saveStudyPlan(plan: SavedStudyPlan): SavedStudyPlan[] {
    const updated = [plan, ...this.getStudyPlans()].slice(0, 10);
    safeSetItem(KEYS.STUDY_PLANS, JSON.stringify(updated));
    return updated;
  },

  clearAllLocalData(): void {
    safeRemoveItem(KEYS.CHAT_HISTORY);
    safeRemoveItem(KEYS.STUDY_NOTES);
    safeRemoveItem(KEYS.QUIZ_HISTORY);
    safeRemoveItem(KEYS.STUDY_PLANS);
  },
};
