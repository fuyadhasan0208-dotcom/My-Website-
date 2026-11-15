# EduGenius AI — Smart Learning & Education Assistant

Built by **Apex Edutech Labs**.

EduGenius AI is a full-stack AI-powered educational platform integrating Google's Gemini API (`@google/genai`) through a secure Express backend proxy to deliver bilingual (Bangla & English) topic explanations, active-recall flashcards, structured MCQ quizzes, a context-aware 24/7 AI Tutor, and personalized study planning.

## Core Modules

- **Home (`/`)**: Bilingual hero with an instant interactive Gemini Q&A preview, feature overview, and demonstration showcase metrics.
- **AI Study Hub (`/study-hub`)**: Subject, academic level, explanation style, and language controls with Markdown, LaTeX math (`KaTeX`), syntax-highlighted code blocks, `.txt` export, clipboard copy, and interactive flip flashcards.
- **Smart Quiz (`/quiz`)**: Structured JSON MCQ generator (5–20 questions across Easy/Medium/Hard in Bangla or English), immediate color + icon feedback, explanations, Recharts score analytics, and full answer review.
- **AI Tutor (`/tutor`)**: 24/7 context-aware conversational tutor with quick-prompt suggestions, Enter-to-send, and LocalStorage conversation persistence.
- **Study Planner (`/planner`)**: Personalized exam timetable generator with daily schedules, weekly subject-hour bar charts, break/revision blocks, practice tests, and `.txt` export.
- **Settings (`/settings`)**: Server-side Gemini API connectivity test, active model selector (`gemini-4-hydrogen`, `gemini-3.1-flash-lite`), response profile slider (`0.2`–`0.7`), default language/level preferences, and LocalStorage management.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, React Router, Lucide React, Recharts, React Markdown (`remark-gfm`, `remark-math`, `rehype-katex`), React Syntax Highlighter
- **Backend**: Node.js + Express (`server.ts`) + `@google/genai` SDK
- **Persistence**: Browser LocalStorage for MVP notes, chat history, quiz scores, study plans, and preferences

## Setup & Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` and set your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Set `GEMINI_API_KEY` in `.env` (or via the AI Studio **Settings > Secrets** panel).

3. Run in development mode (port `3000`):
   ```bash
   npm run dev
   ```

4. Build and run for production:
   ```bash
   npm run build
   npm start
   ```

## Security Notes

- Gemini API calls execute exclusively on the server (`server.ts` `/api/ai/*`) using `process.env.GEMINI_API_KEY`. API keys are never embedded in client bundles or stored in browser LocalStorage.
- All user inputs are validated and sanitized before sending to the AI or rendering Markdown links.
