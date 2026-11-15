interface LogoProps {
  compact?: boolean;
  darkSurface?: boolean;
}

export function Logo({ compact = false, darkSurface = false }: LogoProps) {
  const wordmarkColor = darkSurface ? 'text-white' : 'text-[#1E1B4B]';
  const badgeBg = darkSurface ? 'bg-white/15 text-white' : 'bg-[#4338CA] text-white';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <svg
        width="34"
        height="34"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="40" height="40" rx="10" fill="#1E1B4B" />
        {/* Smart Open Book */}
        <path
          d="M9 14.5C9 13.4 9.9 12.5 11 12.5C14.2 12.5 17.5 13.7 20 15.8C22.5 13.7 25.8 12.5 29 12.5C30.1 12.5 31 13.4 31 14.5V27.5C31 28.4 30.2 29.1 29.3 29C26.1 28.6 22.8 29.5 20 31.2C17.2 29.5 13.9 28.6 10.7 29C9.8 29.1 9 28.4 9 27.5V14.5Z"
          stroke="#F8FAFC"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
        <path d="M20 15.8V31" stroke="#F8FAFC" strokeWidth="1.6" strokeLinecap="round" />

        {/* Neural Network Connections */}
        <path
          d="M14 19.5L17 21.5M14 23.5L17 21.5M26 19.5L23 21.5M26 23.5L23 21.5"
          stroke="#7C3AED"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="13.5" cy="19.5" r="1.35" fill="#10B981" />
        <circle cx="13.5" cy="23.5" r="1.35" fill="#7C3AED" />
        <circle cx="26.5" cy="19.5" r="1.35" fill="#7C3AED" />
        <circle cx="26.5" cy="23.5" r="1.35" fill="#10B981" />

        {/* AI Sparkle Symbol */}
        <path
          d="M20 6.5L21.05 9.45L24 10.5L21.05 11.55L20 14.5L18.95 11.55L16 10.5L18.95 9.45L20 6.5Z"
          fill="#10B981"
        />
      </svg>

      {!compact && (
        <span className="inline-flex items-center gap-1.5">
          <span className={`font-display text-lg font-bold tracking-tight ${wordmarkColor}`}>
            EduGenius
          </span>
          <span
            className={`px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded ${badgeBg}`}
          >
            AI
          </span>
        </span>
      )}
    </span>
  );
}
