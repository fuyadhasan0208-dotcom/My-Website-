import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const SUPPORTED_MODELS = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;
type SupportedModel = (typeof SUPPORTED_MODELS)[number];

const LEGACY_UNSUPPORTED_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-2.0-flash',
  'gemini-2.0-pro',
];

function isSupportedModel(model: unknown): model is SupportedModel {
  return typeof model === 'string' && (SUPPORTED_MODELS as readonly string[]).includes(model);
}

function resolveModelOrError(requestedModel: unknown): { model?: SupportedModel; error?: string } {
  if (!requestedModel) {
    return { model: 'gemini-4-hydrogen' };
  }
  if (isSupportedModel(requestedModel)) {
    return { model: requestedModel };
  }
  if (typeof requestedModel === 'string' && LEGACY_UNSUPPORTED_MODELS.includes(requestedModel)) {
    return {
      error: `Model "${requestedModel}" is deprecated and unavailable on the Gemini API. Please select an active supported model in Settings: ${SUPPORTED_MODELS.join(' or ')}.`,
    };
  }
  return {
    error: `Model "${String(requestedModel)}" is not supported. Available active models: ${SUPPORTED_MODELS.join(', ')}.`,
  };
}

function getThinkingLevel(temperature: unknown): ThinkingLevel {
  const value = typeof temperature === 'number' ? temperature : 0.4;
  if (value <= 0.3) return ThinkingLevel.LOW;
  if (value <= 0.55) return ThinkingLevel.MEDIUM;
  return ThinkingLevel.HIGH;
}

function buildModelConfig(
  model: SupportedModel,
  temperature: unknown,
  systemInstruction: string,
  extra?: Record<string, unknown>
) {
  const safeTemp =
    typeof temperature === 'number' && temperature >= 0.2 && temperature <= 0.7
      ? temperature
      : 0.4;

  if (model === 'gemini-4-hydrogen') {
    // gemini-4-hydrogen uses thinkingConfig instead of legacy temperature/topP/topK
    return {
      systemInstruction,
      thinkingConfig: {
        thinkingLevel: getThinkingLevel(safeTemp),
      },
      ...extra,
    };
  }

  return {
    systemInstruction,
    temperature: safeTemp,
    ...extra,
  };
}

function getGeminiClient(): { ai?: GoogleGenAI; error?: string } {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      error:
        'Gemini API key is not configured on the server yet. Please open Settings to verify connection status or configure GEMINI_API_KEY in the Secrets panel.',
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  return { ai };
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes('503') ||
        msg.includes('500') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('DEADLINE_EXCEEDED');
      if (!isTransient || attempt === retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 450 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

function mapGeminiError(err: unknown): {
  status: number;
  code: string;
  error: string;
  needsConfiguration: boolean;
} {
  const raw = err instanceof Error ? err.message : String(err);

  if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED') || raw.includes('403')) {
    return {
      status: 403,
      code: 'API_KEY_INVALID',
      error:
        'The configured Gemini API key was rejected (403/Invalid). Please check your GEMINI_API_KEY in the Secrets panel and test again in Settings.',
      needsConfiguration: true,
    };
  }

  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      code: 'RESOURCE_EXHAUSTED',
      error:
        'Gemini API rate limit or quota reached (429). Please wait a moment and try again, or verify your API quota in Settings > Secrets.',
      needsConfiguration: false,
    };
  }

  if (raw.includes('NOT_FOUND') || raw.includes('404')) {
    return {
      status: 404,
      code: 'MODEL_NOT_FOUND',
      error: `The requested Gemini model was not found. Supported models: ${SUPPORTED_MODELS.join(', ')}.`,
      needsConfiguration: false,
    };
  }

  return {
    status: 500,
    code: 'GEMINI_ERROR',
    error: 'Unable to complete the AI request right now. Please try again in a moment.',
    needsConfiguration: false,
  };
}

function cleanString(input: unknown, maxLength = 3000): string {
  if (typeof input !== 'string') return '';
  return input.replace(/\u0000/g, '').trim().slice(0, maxLength);
}

function parseJsonSafely<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  const trimmed = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return fallback;
  }
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const keySet = Boolean(
      process.env.GEMINI_API_KEY?.trim() &&
        process.env.GEMINI_API_KEY.trim() !== 'MY_GEMINI_API_KEY'
    );
    res.json({
      ok: true,
      service: 'EduGenius AI Server',
      configured: keySet,
      supportedModels: SUPPORTED_MODELS,
    });
  });

  app.post('/api/ai/test', async (req: Request, res: Response) => {
    const { model: requestedModel, temperature } = req.body ?? {};
    const resolved = resolveModelOrError(requestedModel);
    if (resolved.error || !resolved.model) {
      res.status(400).json({
        ok: false,
        configured: false,
        error: resolved.error,
        code: 'UNSUPPORTED_MODEL',
      });
      return;
    }

    const client = getGeminiClient();
    if (!client.ai) {
      res.status(400).json({
        ok: false,
        configured: false,
        error: client.error,
        code: 'MISSING_API_KEY',
        needsConfiguration: true,
      });
      return;
    }

    const started = Date.now();
    try {
      const response = await withRetry(() =>
        client.ai!.models.generateContent({
          model: resolved.model!,
          contents: 'Reply with exactly: EduGenius AI connected.',
          config: buildModelConfig(
            resolved.model!,
            temperature,
            'You are a connectivity verification endpoint. Reply concisely.'
          ),
        })
      );

      const latencyMs = Date.now() - started;
      const text = (response.text ?? '').trim();
      res.json({
        ok: true,
        configured: true,
        model: resolved.model,
        latencyMs,
        message: text || `Connected to ${resolved.model} successfully.`,
      });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json({
        ok: false,
        configured: !mapped.needsConfiguration,
        model: resolved.model,
        latencyMs: Date.now() - started,
        ...mapped,
      });
    }
  });

  app.post('/api/ai/quick-ask', async (req: Request, res: Response) => {
    const question = cleanString(req.body?.question, 1200);
    const language = req.body?.language === 'English' ? 'English' : 'Bangla';
    const resolved = resolveModelOrError(req.body?.model);

    if (!question) {
      res.status(400).json({ error: 'Please enter a study question first.', code: 'EMPTY_INPUT' });
      return;
    }
    if (resolved.error || !resolved.model) {
      res.status(400).json({ error: resolved.error, code: 'UNSUPPORTED_MODEL' });
      return;
    }

    const client = getGeminiClient();
    if (!client.ai) {
      res.status(400).json({
        error: client.error,
        code: 'MISSING_API_KEY',
        needsConfiguration: true,
      });
      return;
    }

    const systemInstruction = `You are EduGenius AI, an accurate, friendly educational assistant created by Apex Edutech Labs.
Answer the student's question clearly in ${language === 'Bangla' ? 'natural, clear Bangla (with standard English technical terms in parentheses where helpful)' : 'clear, concise English'}.
Structure your answer with:
1. Direct core answer (2-3 sentences)
2. Step-by-step reasoning or key points
3. One concrete real-life example
If something is uncertain or ambiguous, clearly state the uncertainty rather than guessing or inventing facts.`;

    try {
      const response = await withRetry(() =>
        client.ai!.models.generateContent({
          model: resolved.model!,
          contents: question,
          config: buildModelConfig(resolved.model!, req.body?.temperature, systemInstruction),
        })
      );

      const answer = (response.text ?? '').trim();
      if (!answer) {
        res.status(502).json({ error: 'The AI returned an empty response. Please try again.' });
        return;
      }

      res.json({ answer, model: resolved.model });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json(mapped);
    }
  });

  app.post('/api/ai/explain', async (req: Request, res: Response) => {
    const subject = cleanString(req.body?.subject, 80) || 'General';
    const level = cleanString(req.body?.level, 80) || 'Higher Secondary (HSC)';
    const topic = cleanString(req.body?.topic, 2500);
    const style = cleanString(req.body?.style, 80) || 'Detailed Explanation with Examples';
    const language = cleanString(req.body?.language, 60) || 'Bangla';
    const resolved = resolveModelOrError(req.body?.model);

    if (!topic) {
      res.status(400).json({ error: 'Please enter a topic to explain.', code: 'EMPTY_INPUT' });
      return;
    }
    if (resolved.error || !resolved.model) {
      res.status(400).json({ error: resolved.error, code: 'UNSUPPORTED_MODEL' });
      return;
    }

    const client = getGeminiClient();
    if (!client.ai) {
      res.status(400).json({
        error: client.error,
        code: 'MISSING_API_KEY',
        needsConfiguration: true,
      });
      return;
    }

    const languageDirective =
      language === 'Bangla'
        ? 'Write primarily in clear, natural Bangla (বাংলা), preserving key scientific/technical terms in English in parentheses where helpful for exams.'
        : language === 'Mixed Bangla-English'
          ? 'Write in clear Mixed Bangla-English (natural Bangla explanations combined with standard English academic terminology, formulas, and keywords).'
          : 'Write in clear, accessible academic English.';

    const styleDirective =
      style === 'Simple Summary'
        ? 'Keep the explanation concise, crystal-clear, and focused on quick conceptual mastery.'
        : style === 'Flashcard Points'
          ? 'Format the notes as high-yield revision bullets and crisp memory points ideal for rapid exam recall.'
          : 'Provide a thorough step-by-step explanation with rich real-life analogies, worked examples, formulas, or code blocks where relevant.';

    const systemInstruction = `You are EduGenius AI, an expert academic educator at Apex Edutech Labs.
${languageDirective}
${styleDirective}

Always follow these pedagogical rules:
- Tailor depth and vocabulary specifically to a "${level}" student studying "${subject}".
- Explain difficult concepts in simple, intuitive language.
- Explain step by step using clear Markdown headings, bullet points, and numbered lists.
- Highlight important definitions using bold terms or clean Markdown callouts.
- Include real-life and practical examples.
- Use LaTeX math formatting ($...$ for inline and $$...$$ for display blocks) for mathematical/physics/chemistry formulas.
- Include fenced code blocks with language tags when explaining Programming concepts.
- End with a short "Key Summary" section.
- Be intellectually honest: if a topic has ambiguity or depends on missing context, explicitly mention the uncertainty instead of fabricating facts.`;

    const prompt = `Subject: ${subject}\nStudent Level: ${level}\nExplanation Style: ${style}\nLanguage: ${language}\n\nTopic to explain:\n${topic}`;

    try {
      const response = await withRetry(() =>
        client.ai!.models.generateContent({
          model: resolved.model!,
          contents: prompt,
          config: buildModelConfig(resolved.model!, req.body?.temperature, systemInstruction),
        })
      );

      const explanation = (response.text ?? '').trim();
      if (!explanation) {
        res.status(502).json({ error: 'The AI returned an empty explanation. Please try again.' });
        return;
      }

      res.json({ explanation, model: resolved.model });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json(mapped);
    }
  });

  app.post('/api/ai/flashcards', async (req: Request, res: Response) => {
    const subject = cleanString(req.body?.subject, 80) || 'General';
    const level = cleanString(req.body?.level, 80) || 'Higher Secondary (HSC)';
    const topic = cleanString(req.body?.topic, 2000);
    const language = cleanString(req.body?.language, 60) || 'Bangla';
    const resolved = resolveModelOrError(req.body?.model);

    if (!topic) {
      res.status(400).json({ error: 'Topic is required to generate flashcards.', code: 'EMPTY_INPUT' });
      return;
    }
    if (resolved.error || !resolved.model) {
      res.status(400).json({ error: resolved.error, code: 'UNSUPPORTED_MODEL' });
      return;
    }

    const client = getGeminiClient();
    if (!client.ai) {
      res.status(400).json({
        error: client.error,
        code: 'MISSING_API_KEY',
        needsConfiguration: true,
      });
      return;
    }

    const systemInstruction = `You are an expert study-card designer. Create 6 high-yield active-recall flashcards for a ${level} student studying ${subject}. Use ${language}. Keep fronts concise (question or concept) and backs clear and accurate.`;

    try {
      const response = await withRetry(() =>
        client.ai!.models.generateContent({
          model: resolved.model!,
          contents: `Create 6 study flashcards on: ${topic}`,
          config: buildModelConfig(resolved.model!, req.body?.temperature, systemInstruction, {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING, description: 'Question, term, or prompt on front of card' },
                  back: { type: Type.STRING, description: 'Clear, accurate answer or definition' },
                  hint: { type: Type.STRING, description: 'Short memory cue or formula hint' },
                },
                required: ['front', 'back'],
              },
            },
          }),
        })
      );

      const parsed = parseJsonSafely<Array<{ front?: string; back?: string; hint?: string }>>(
        response.text,
        []
      );

      const flashcards = parsed
        .filter((item) => typeof item.front === 'string' && typeof item.back === 'string')
        .map((item, idx) => ({
          id: `fc-${Date.now()}-${idx}`,
          front: item.front!.trim(),
          back: item.back!.trim(),
          hint: typeof item.hint === 'string' ? item.hint.trim() : undefined,
        }));

      if (flashcards.length === 0) {
        res.status(502).json({ error: 'Failed to generate valid flashcards. Please try again.' });
        return;
      }

      res.json({ flashcards, model: resolved.model });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json(mapped);
    }
  });

  app.post('/api/ai/quiz', async (req: Request, res: Response) => {
    const subject = cleanString(req.body?.subject, 80) || 'General';
    const topic = cleanString(req.body?.topic, 1500);
    const level = cleanString(req.body?.level, 80) || 'Higher Secondary (HSC)';
    const difficulty =
      req.body?.difficulty === 'Easy' || req.body?.difficulty === 'Hard'
        ? req.body.difficulty
        : 'Medium';
    const language = req.body?.language === 'Bangla' ? 'Bangla' : 'English';
    const allowedCounts = [5, 10, 15, 20];
    const questionCount = allowedCounts.includes(Number(req.body?.questionCount))
      ? Number(req.body?.questionCount)
      : 5;
    const resolved = resolveModelOrError(req.body?.model);

    if (!topic) {
      res.status(400).json({ error: 'Please specify a chapter or topic for the quiz.', code: 'EMPTY_INPUT' });
      return;
    }
    if (resolved.error || !resolved.model) {
      res.status(400).json({ error: resolved.error, code: 'UNSUPPORTED_MODEL' });
      return;
    }

    const client = getGeminiClient();
    if (!client.ai) {
      res.status(400).json({
        error: client.error,
        code: 'MISSING_API_KEY',
        needsConfiguration: true,
      });
      return;
    }

    const systemInstruction = `You are a rigorous academic assessment designer for EduGenius AI.
Generate exactly ${questionCount} multiple-choice questions (MCQs) in ${language === 'Bangla' ? 'clear, standard Bangla' : 'clear, accurate English'}.
Target student level: ${level}.
Subject: ${subject}.
Difficulty: ${difficulty}.
Strict rules:
- Every question MUST have exactly 4 distinct options.
- "correctAnswerIndex" MUST be an integer from 0 to 3 matching the single unambiguously correct option.
- "explanation" MUST clearly explain why the correct option is right and why distractors are wrong.
- Never invent questionable or unverified facts.`;

    try {
      const response = await withRetry(() =>
        client.ai!.models.generateContent({
          model: resolved.model!,
          contents: `Create ${questionCount} ${difficulty}-level MCQ questions for ${subject} (${level}) covering: ${topic}`,
          config: buildModelConfig(resolved.model!, req.body?.temperature, systemInstruction, {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      correctAnswerIndex: { type: Type.INTEGER },
                      explanation: { type: Type.STRING },
                      difficulty: { type: Type.STRING },
                    },
                    required: [
                      'question',
                      'options',
                      'correctAnswerIndex',
                      'explanation',
                      'difficulty',
                    ],
                  },
                },
              },
              required: ['questions'],
            },
          }),
        })
      );

      const parsed = parseJsonSafely<{
        questions?: Array<{
          question?: string;
          options?: unknown[];
          correctAnswerIndex?: number;
          explanation?: string;
          difficulty?: string;
        }>;
      }>(response.text, {});

      const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
      const validated = rawQuestions
        .filter((q) => {
          if (!q || typeof q.question !== 'string' || !Array.isArray(q.options)) return false;
          if (q.options.length !== 4) return false;
          if (!q.options.every((opt) => typeof opt === 'string' && opt.trim().length > 0)) {
            return false;
          }
          if (
            typeof q.correctAnswerIndex !== 'number' ||
            !Number.isInteger(q.correctAnswerIndex) ||
            q.correctAnswerIndex < 0 ||
            q.correctAnswerIndex > 3
          ) {
            return false;
          }
          return typeof q.explanation === 'string' && q.explanation.trim().length > 0;
        })
        .map((q, idx) => ({
          id: `q-${Date.now()}-${idx}`,
          question: q.question!.trim(),
          options: (q.options as string[]).map((o) => o.trim()) as [string, string, string, string],
          correctAnswerIndex: q.correctAnswerIndex!,
          explanation: q.explanation!.trim(),
          difficulty:
            q.difficulty === 'Easy' || q.difficulty === 'Hard' || q.difficulty === 'Medium'
              ? q.difficulty
              : difficulty,
        }));

      if (validated.length === 0) {
        res.status(502).json({
          error: 'The AI returned quiz data that failed validation. Please try generating again.',
          code: 'QUIZ_VALIDATION_FAILED',
        });
        return;
      }

      res.json({ questions: validated, model: resolved.model });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json(mapped);
    }
  });

  app.post('/api/ai/tutor', async (req: Request, res: Response) => {
    const message = cleanString(req.body?.message, 2500);
    const level = cleanString(req.body?.level, 80) || 'Higher Secondary (HSC)';
    const language = cleanString(req.body?.language, 60) || 'Bangla';
    const rawHistory: unknown[] = Array.isArray(req.body?.history) ? req.body.history : [];
    const resolved = resolveModelOrError(req.body?.model);

    if (!message) {
      res.status(400).json({ error: 'Please write a message for the AI Tutor.', code: 'EMPTY_INPUT' });
      return;
    }
    if (resolved.error || !resolved.model) {
      res.status(400).json({ error: resolved.error, code: 'UNSUPPORTED_MODEL' });
      return;
    }

    const client = getGeminiClient();
    if (!client.ai) {
      res.status(400).json({
        error: client.error,
        code: 'MISSING_API_KEY',
        needsConfiguration: true,
      });
      return;
    }

    const systemInstruction = `You are EduGenius AI Tutor — a warm, patient, experienced personal teacher created by Apex Edutech Labs.
Student Context:
- Academic Level: ${level}
- Preferred Language: ${language} (respond fluently in Bangla or English matching the student's language, or Mixed Bangla-English if requested).

Teaching Approach:
- Explain difficult concepts step by step with clarity and empathy.
- Adapt complexity to the ${level} level.
- Use practical real-life examples and clean formatting (Markdown, LaTeX math, or code blocks when helpful).
- Encourage independent thinking by occasionally ending with a gentle follow-up check question or practice prompt.
- Maintain context from the conversation history.
- Never fabricate citations, exam facts, or unverified claims; acknowledge uncertainty honestly if needed.`;

    const formattedHistory = rawHistory
      .filter(
        (item: unknown): item is { role: 'user' | 'model'; content: string } =>
          Boolean(item) &&
          typeof item === 'object' &&
          ((item as { role?: string }).role === 'user' ||
            (item as { role?: string }).role === 'model') &&
          typeof (item as { content?: unknown }).content === 'string' &&
          (item as { content: string }).content.trim().length > 0
      )
      .slice(-16)
      .map((item) => ({
        role: item.role,
        parts: [{ text: item.content.slice(0, 3000) }],
      }));

    try {
      const chat = client.ai.chats.create({
        model: resolved.model,
        history: formattedHistory,
        config: buildModelConfig(resolved.model, req.body?.temperature, systemInstruction),
      });

      const response = await withRetry(() => chat.sendMessage({ message }));
      const reply = (response.text ?? '').trim();

      if (!reply) {
        res.status(502).json({ error: 'The AI Tutor returned an empty response. Please try again.' });
        return;
      }

      res.json({ reply, model: resolved.model });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json(mapped);
    }
  });

  app.post('/api/ai/study-plan', async (req: Request, res: Response) => {
    const studentName = cleanString(req.body?.studentName, 100);
    const examName = cleanString(req.body?.examName, 160);
    const examDate = cleanString(req.body?.examDate, 40);
    const language = cleanString(req.body?.language, 60) || 'Bangla';
    const dailyHours = Math.min(16, Math.max(1, Number(req.body?.dailyHours) || 4));
    const subjects = Array.isArray(req.body?.subjects)
      ? req.body.subjects.map((s: unknown) => cleanString(s, 80)).filter(Boolean)
      : [];
    const weakSubjects = Array.isArray(req.body?.weakSubjects)
      ? req.body.weakSubjects.map((s: unknown) => cleanString(s, 80)).filter(Boolean)
      : [];
    const resolved = resolveModelOrError(req.body?.model);

    if (!examName || subjects.length === 0 || !examDate) {
      res.status(400).json({
        error: 'Please provide the examination name, at least one subject, and the exam date.',
        code: 'INVALID_INPUT',
      });
      return;
    }
    if (resolved.error || !resolved.model) {
      res.status(400).json({ error: resolved.error, code: 'UNSUPPORTED_MODEL' });
      return;
    }

    const client = getGeminiClient();
    if (!client.ai) {
      res.status(400).json({
        error: client.error,
        code: 'MISSING_API_KEY',
        needsConfiguration: true,
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const systemInstruction = `You are an academic study strategist for EduGenius AI.
Create a realistic, sustainable, high-impact study routine in ${language}.
Prioritize weak subjects with extra focused practice blocks and spaced repetition, while keeping realistic breaks (Pomodoro or 50/10 cycles), weekly revision sessions, and mock practice tests.
Ensure the total daily study time matches approximately ${dailyHours} hours/day and accounts for the timeframe from today (${today}) until ${examDate}.
Return structured JSON matching the requested schema, including a clean full Markdown summary in "markdownPlan" suitable for copying or downloading as .txt.`;

    const prompt = `Student Name: ${studentName || 'Student'}
Examination: ${examName}
Exam Date: ${examDate} (Today: ${today})
Daily Available Study Hours: ${dailyHours} hours
Subjects: ${subjects.join(', ')}
Weak / Priority Subjects: ${weakSubjects.length > 0 ? weakSubjects.join(', ') : 'None specified'}
Preferred Language: ${language}`;

    try {
      const response = await withRetry(() =>
        client.ai!.models.generateContent({
          model: resolved.model!,
          contents: prompt,
          config: buildModelConfig(resolved.model!, req.body?.temperature, systemInstruction, {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overview: { type: Type.STRING },
                dailySchedule: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      timeBlock: { type: Type.STRING },
                      activity: { type: Type.STRING },
                      subject: { type: Type.STRING },
                      focusTip: { type: Type.STRING },
                    },
                    required: ['timeBlock', 'activity', 'subject', 'focusTip'],
                  },
                },
                subjectAllocation: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      subject: { type: Type.STRING },
                      hoursPerWeek: { type: Type.NUMBER },
                      priority: { type: Type.STRING },
                      strategy: { type: Type.STRING },
                    },
                    required: ['subject', 'hoursPerWeek', 'priority', 'strategy'],
                  },
                },
                breakSchedule: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                revisionSessions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                practiceTests: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                weeklyGoals: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                markdownPlan: { type: Type.STRING },
              },
              required: [
                'overview',
                'dailySchedule',
                'subjectAllocation',
                'breakSchedule',
                'revisionSessions',
                'practiceTests',
                'weeklyGoals',
                'markdownPlan',
              ],
            },
          }),
        })
      );

      const parsed = parseJsonSafely<Record<string, unknown>>(response.text, {});
      if (
        typeof parsed.overview !== 'string' ||
        !Array.isArray(parsed.dailySchedule) ||
        !Array.isArray(parsed.subjectAllocation) ||
        typeof parsed.markdownPlan !== 'string'
      ) {
        res.status(502).json({
          error: 'Generated study plan did not match expected structure. Please try again.',
          code: 'PLAN_VALIDATION_FAILED',
        });
        return;
      }

      res.json({ plan: parsed, model: resolved.model });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json(mapped);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduGenius AI server listening on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start EduGenius AI server:', err);
  process.exit(1);
});
