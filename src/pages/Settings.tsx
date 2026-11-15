import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Cpu,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Trash2,
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { GeminiServiceError, testApiConnection } from '../services/geminiService';
import { storageService } from '../services/storageService';
import type {
  ApiConnectionTestResult,
  LearningLanguage,
  StudentLevel,
  SupportedModel,
} from '../types';

const MODELS: Array<{
  id: SupportedModel;
  name: string;
  description: string;
  tag: string;
}> = [
  {
    id: 'gemini-4-hydrogen',
    name: 'gemini-4-hydrogen',
    description:
      'Active default Gemini model. Delivers fast, well-structured Bangla and English explanations, JSON quizzes, and multi-turn tutoring.',
    tag: 'Recommended',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'gemini-3.1-flash-lite',
    description:
      'Lightweight, ultra-low-latency model ideal for rapid concept lookups and quick practice drills.',
    tag: 'Fast',
  },
];

const LANGUAGES: LearningLanguage[] = ['Bangla', 'English', 'Mixed Bangla-English'];
const LEVELS: StudentLevel[] = [
  'Primary',
  'Secondary (SSC)',
  'Higher Secondary (HSC)',
  'University',
  'Admission Preparation',
  'Job Preparation',
];

export function Settings() {
  const { settings, updateSettings, resetSettings, confirmAction, showToast } =
    useAppContext();

  const [testing, setTesting] = useState(false);
  const [connectionResult, setConnectionResult] =
    useState<ApiConnectionTestResult | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [serverConfigured, setServerConfigured] = useState<
    'loading' | 'configured' | 'unconfigured' | 'offline'
  >('loading');

  useEffect(() => {
    let active = true;
    const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');
    fetch(`${apiBase}/api/health`)
      .then((res) => {
        if (!res.ok) throw new Error('Health check unavailable');
        return res.json();
      })
      .then((data: { configured?: boolean }) => {
        if (active) {
          setServerConfigured(data.configured ? 'configured' : 'unconfigured');
        }
      })
      .catch(() => {
        if (active) setServerConfigured('offline');
      });
    return () => {
      active = false;
    };
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionError(null);
    setConnectionResult(null);

    try {
      const result = await testApiConnection(settings);
      setConnectionResult(result);
      setServerConfigured(result.configured ? 'configured' : 'unconfigured');
      showToast({
        type: 'success',
        title: 'Gemini API connected',
        description: `Verified ${result.model} in ${result.latencyMs}ms.`,
      });
    } catch (err) {
      if (err instanceof GeminiServiceError) {
        setConnectionError(err.message);
        if (err.needsConfiguration) {
          setServerConfigured('unconfigured');
        }
      } else {
        setConnectionError('Unable to test API connection right now.');
      }
      showToast({
        type: 'error',
        title: 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClearLocalData = () => {
    confirmAction({
      title: 'Clear Saved Study Data?',
      description:
        'This removes saved AI Study Hub notes, AI Tutor chat history, quiz score history, and study plans from browser LocalStorage. Your settings preferences will remain.',
      confirmLabel: 'Clear Local Data',
      destructive: true,
      onConfirm: () => {
        storageService.clearAllLocalData();
        showToast({
          type: 'info',
          title: 'Local study data cleared',
        });
      },
    });
  };

  const handleResetSettings = () => {
    confirmAction({
      title: 'Reset Settings to Default?',
      description:
        'Restores model selection (gemini-4-hydrogen), temperature (0.4), preferred language, and default education level.',
      confirmLabel: 'Reset Settings',
      onConfirm: () => {
        resetSettings();
        showToast({
          type: 'info',
          title: 'Settings restored to defaults',
        });
      },
    });
  };

  const getTempLabel = (val: number) => {
    if (val <= 0.3) return 'Focused & Analytical';
    if (val <= 0.5) return 'Balanced';
    return 'Elaborate & Creative';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#4338CA]">Platform Configuration</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1E1B4B] tracking-tight">
          Settings &amp; Gemini AI Preferences
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Verify server-side Gemini API connectivity, choose active supported models, and customize
          your learning defaults.
        </p>
      </div>

      {/* Server-Side API Connection Card */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#1E1B4B]">
                Server-Side Gemini API Connection
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                API keys are managed securely on the backend via{' '}
                <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-[#4338CA]">
                  GEMINI_API_KEY
                </code>{' '}
                (AI Studio Secrets panel or server environment) and routed through{' '}
                <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-[#4338CA]">
                  /api/ai/*
                </code>
                .
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-60 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Activity className="w-4 h-4" />
            <span>{testing ? 'Testing...' : 'Test API Connection'}</span>
          </button>
        </div>

        {/* Status Bar */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            {connectionResult?.ok ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span className="font-semibold text-[#10B981]">Connected</span>
                <span className="text-slate-600">
                  · Model <span className="font-mono text-[#1E1B4B]">{connectionResult.model}</span>{' '}
                  responded in{' '}
                  <span className="font-mono tabular-nums text-[#1E1B4B]">
                    {connectionResult.latencyMs}ms
                  </span>
                </span>
              </>
            ) : connectionError ? (
              <>
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-semibold text-red-700">Connection Issue:</span>
                <span className="text-red-700">{connectionError}</span>
              </>
            ) : serverConfigured === 'configured' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span className="font-medium text-[#1E1B4B]">
                  Server key detected. Click &ldquo;Test API Connection&rdquo; to verify live
                  model access.
                </span>
              </>
            ) : serverConfigured === 'unconfigured' ? (
              <>
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-medium text-red-700">
                  GEMINI_API_KEY is not configured yet. Set it in AI Studio Secrets or your server{' '}
                  <code className="font-mono text-xs">.env</code> file.
                </span>
              </>
            ) : serverConfigured === 'offline' ? (
              <>
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium text-slate-700">
                  Backend API server (<code className="font-mono text-xs">/api/health</code>) is
                  not reachable from this static host. Deploy <code className="font-mono text-xs">server.ts</code>{' '}
                  or configure <code className="font-mono text-xs">VITE_API_BASE_URL</code> for live AI responses.
                </span>
              </>
            ) : (
              <span className="text-slate-600">Checking server configuration...</span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Security Architecture Note: Storing API keys in browser LocalStorage is vulnerable to XSS
          and client-side script inspection. EduGenius AI proxies every request through the Express
          backend so credentials stay out of browser bundles.
        </p>
      </section>

      {/* Model Selection Card */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#1E1B4B]">
              Gemini Model Selection
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Select an active supported model identifier for Study Hub, Smart Quiz, AI Tutor, and
              Study Planner.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {MODELS.map((m) => {
            const active = settings.model === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  updateSettings({ model: m.id });
                  showToast({
                    type: 'success',
                    title: `Model updated to ${m.id}`,
                  });
                }}
                className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#4338CA]/5 border-[#4338CA]'
                    : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-sm font-bold text-[#1E1B4B]">{m.name}</span>
                  <span
                    className={`text-xs font-semibold ${
                      active ? 'text-[#4338CA]' : 'text-slate-500'
                    }`}
                  >
                    {active ? 'Selected' : m.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>
              </button>
            );
          })}
        </div>

        <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs text-slate-600 leading-relaxed">
          Model Compatibility Note: Legacy <code className="font-mono">gemini-1.5-flash</code> and{' '}
          <code className="font-mono">gemini-1.5-pro</code> identifiers have been retired by the
          Gemini API and are unavailable. EduGenius AI uses the current{' '}
          <code className="font-mono">gemini-4-hydrogen</code> and{' '}
          <code className="font-mono">gemini-3.1-flash-lite</code> endpoints directly.
        </div>
      </section>

      {/* Temperature & Learning Preferences */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#1E1B4B]">
              Response Tuning &amp; Learning Defaults
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Customize response creativity/reasoning depth and your default study profile.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <label htmlFor="settings-temp" className="font-semibold text-[#1E1B4B]">
              Temperature / Reasoning Profile
            </label>
            <span className="font-mono tabular-nums font-bold text-[#4338CA]">
              {settings.temperature.toFixed(1)} · {getTempLabel(settings.temperature)}
            </span>
          </div>
          <input
            id="settings-temp"
            type="range"
            min={0.2}
            max={0.7}
            step={0.1}
            value={settings.temperature}
            onChange={(e) => updateSettings({ temperature: Number(e.target.value) })}
            className="w-full accent-[#4338CA] cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-500 font-mono tabular-nums">
            <span>0.2 (Analytical)</span>
            <span>0.4 (Default)</span>
            <span>0.7 (Elaborate)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label
              htmlFor="settings-lang"
              className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
            >
              Preferred Language
            </label>
            <select
              id="settings-lang"
              value={settings.preferredLanguage}
              onChange={(e) => {
                updateSettings({ preferredLanguage: e.target.value as LearningLanguage });
                showToast({ type: 'success', title: 'Preferred language saved' });
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4338CA]"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="settings-level"
              className="block text-xs font-semibold text-[#1E1B4B] mb-1.5"
            >
              Default Education Level
            </label>
            <select
              id="settings-level"
              value={settings.defaultLevel}
              onChange={(e) => {
                updateSettings({ defaultLevel: e.target.value as StudentLevel });
                showToast({ type: 'success', title: 'Default education level saved' });
              }}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-[#F8FAFC] text-[#1E1B4B] focus:outline-none focus:ring-2 focus:ring-[#4338CA]"
            >
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-bold text-[#1E1B4B]">
            Local Data &amp; Preferences Management
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Clear locally stored chat history, study notes, quiz scores, and study plans, or reset
            preferences to defaults.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetSettings}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#1E1B4B] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Settings</span>
          </button>

          <button
            type="button"
            onClick={handleClearLocalData}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local Data</span>
          </button>
        </div>
      </section>
    </div>
  );
}
