import type {
  ApiConnectionTestResult,
  AppSettings,
  ChatMessageItem,
  ExplainTopicRequest,
  FlashcardItem,
  LearningLanguage,
  QuizConfig,
  QuizQuestion,
  StudentLevel,
  StudyPlanRequest,
  StudyPlanResponse,
} from '../types';

export class GeminiServiceError extends Error {
  status: number;
  code: string;
  needsConfiguration: boolean;

  constructor(
    message: string,
    status = 500,
    code = 'AI_REQUEST_FAILED',
    needsConfiguration = false
  ) {
    super(message);
    this.name = 'GeminiServiceError';
    this.status = status;
    this.code = code;
    this.needsConfiguration = needsConfiguration;
  }
}

async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new GeminiServiceError(
      'Unable to reach the EduGenius AI server. Please check your internet connection and try again.',
      0,
      'NETWORK_ERROR',
      false
    );
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    throw new GeminiServiceError(
      `Server returned an unexpected response (HTTP ${response.status}).`,
      response.status,
      'INVALID_SERVER_RESPONSE',
      false
    );
  }

  if (!response.ok) {
    const message =
      typeof data.error === 'string' && data.error.trim().length > 0
        ? data.error
        : 'AI request failed. Please try again.';
    const code = typeof data.code === 'string' ? data.code : 'API_ERROR';
    const needsConfiguration = Boolean(data.needsConfiguration);
    throw new GeminiServiceError(message, response.status, code, needsConfiguration);
  }

  return data as TResponse;
}

export async function testApiConnection(
  settings: AppSettings
): Promise<ApiConnectionTestResult> {
  return postJson<ApiConnectionTestResult>('/api/ai/test', {
    model: settings.model,
    temperature: settings.temperature,
  });
}

export async function quickAsk(
  question: string,
  language: 'Bangla' | 'English',
  settings: AppSettings
): Promise<{ answer: string; model: string }> {
  const result = await postJson<{ answer: string; model: string }>('/api/ai/quick-ask', {
    question,
    language,
    model: settings.model,
    temperature: settings.temperature,
  });

  if (!result.answer || typeof result.answer !== 'string') {
    throw new GeminiServiceError(
      'Received an empty explanation from the AI model.',
      502,
      'EMPTY_RESPONSE'
    );
  }

  return result;
}

export async function explainTopic(
  request: ExplainTopicRequest,
  settings: AppSettings
): Promise<{ explanation: string; model: string }> {
  const result = await postJson<{ explanation: string; model: string }>('/api/ai/explain', {
    ...request,
    model: settings.model,
    temperature: settings.temperature,
  });

  if (!result.explanation || typeof result.explanation !== 'string') {
    throw new GeminiServiceError(
      'Received an empty explanation from the AI model.',
      502,
      'EMPTY_RESPONSE'
    );
  }

  return result;
}

export async function generateFlashcards(
  request: ExplainTopicRequest,
  settings: AppSettings
): Promise<{ flashcards: FlashcardItem[]; model: string }> {
  const result = await postJson<{ flashcards: FlashcardItem[]; model: string }>(
    '/api/ai/flashcards',
    {
      ...request,
      model: settings.model,
      temperature: settings.temperature,
    }
  );

  if (!Array.isArray(result.flashcards) || result.flashcards.length === 0) {
    throw new GeminiServiceError(
      'Could not generate valid flashcards for this topic.',
      502,
      'INVALID_FLASHCARDS'
    );
  }

  return result;
}

export async function generateQuiz(
  config: QuizConfig,
  settings: AppSettings
): Promise<{ questions: QuizQuestion[]; model: string }> {
  const result = await postJson<{ questions: QuizQuestion[]; model: string }>('/api/ai/quiz', {
    ...config,
    model: settings.model,
    temperature: settings.temperature,
  });

  if (!Array.isArray(result.questions) || result.questions.length === 0) {
    throw new GeminiServiceError(
      'Quiz generation returned no valid questions.',
      502,
      'INVALID_QUIZ'
    );
  }

  const validQuestions = result.questions.filter(
    (q) =>
      q &&
      typeof q.question === 'string' &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correctAnswerIndex === 'number' &&
      q.correctAnswerIndex >= 0 &&
      q.correctAnswerIndex <= 3 &&
      typeof q.explanation === 'string'
  );

  if (validQuestions.length === 0) {
    throw new GeminiServiceError(
      'Generated quiz questions failed format validation. Please try again.',
      502,
      'QUIZ_VALIDATION_FAILED'
    );
  }

  return {
    questions: validQuestions,
    model: result.model,
  };
}

export async function chatWithTutor(
  params: {
    message: string;
    history: ChatMessageItem[];
    level: StudentLevel;
    language: LearningLanguage;
  },
  settings: AppSettings
): Promise<{ reply: string; model: string }> {
  const result = await postJson<{ reply: string; model: string }>('/api/ai/tutor', {
    message: params.message,
    history: params.history.slice(-16).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    level: params.level,
    language: params.language,
    model: settings.model,
    temperature: settings.temperature,
  });

  if (!result.reply || typeof result.reply !== 'string') {
    throw new GeminiServiceError(
      'AI Tutor returned an empty message.',
      502,
      'EMPTY_RESPONSE'
    );
  }

  return result;
}

export async function generateStudyPlan(
  request: StudyPlanRequest,
  settings: AppSettings
): Promise<{ plan: StudyPlanResponse; model: string }> {
  const result = await postJson<{ plan: StudyPlanResponse; model: string }>(
    '/api/ai/study-plan',
    {
      ...request,
      model: settings.model,
      temperature: settings.temperature,
    }
  );

  if (!result.plan || typeof result.plan.markdownPlan !== 'string') {
    throw new GeminiServiceError(
      'Generated study plan failed validation.',
      502,
      'INVALID_STUDY_PLAN'
    );
  }

  return result;
}
