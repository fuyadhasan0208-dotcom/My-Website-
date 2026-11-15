import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '../utils/export';
import { isSafeUrl } from '../utils/sanitize';

interface MarkdownRendererProps {
  content: string;
  compact?: boolean;
}

function CodeBlock({
  language,
  code,
}: {
  language: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-200 bg-[#1E1B4B]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1E1B4B] border-b border-white/10 text-xs text-slate-300">
        <span className="font-mono">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.84rem',
          lineHeight: '1.6',
          background: '#0F172A',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export function MarkdownRenderer({ content, compact = false }: MarkdownRendererProps) {
  return (
    <div
      className={`max-w-none text-[#1E1B4B] ${
        compact ? 'text-sm leading-relaxed' : 'text-[15px] sm:text-base leading-relaxed'
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display text-2xl font-bold text-[#1E1B4B] mt-6 mb-3 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-display text-xl font-bold text-[#1E1B4B] mt-5 mb-2.5 first:mt-0 pb-1.5 border-b border-slate-200">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-display text-lg font-semibold text-[#4338CA] mt-4 mb-2 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-3 last:mb-0 text-slate-700">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-3 space-y-1.5 text-slate-700">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-slate-700">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-[#1E1B4B]">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-700">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => {
            if (!isSafeUrl(href)) {
              return <span className="text-slate-700">{children}</span>;
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4338CA] underline underline-offset-2 hover:text-[#7C3AED]"
              >
                {children}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm text-left border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 text-[#1E1B4B] font-semibold">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2.5 border-b border-slate-200">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 border-b border-slate-100 text-slate-700">{children}</td>
          ),
          code: ({ className, children }) => {
            const match = /language-(\w+)/.exec(className || '');
            const raw = String(children).replace(/\n$/, '');
            if (match || raw.includes('\n')) {
              return <CodeBlock language={match?.[1] ?? 'text'} code={raw} />;
            }
            return (
              <code className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[0.86em] text-[#4338CA]">
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
