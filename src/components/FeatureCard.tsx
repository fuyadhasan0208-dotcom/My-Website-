import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface FeatureCardProps {
  indexLabel: string;
  title: string;
  description: string;
  icon: ReactNode;
  to: string;
  ctaLabel: string;
  featured?: boolean;
}

export function FeatureCard({
  indexLabel,
  title,
  description,
  icon,
  to,
  ctaLabel,
  featured = false,
}: FeatureCardProps) {
  return (
    <div
      className={`group flex flex-col justify-between p-6 sm:p-8 rounded-2xl border transition-all duration-200 ${
        featured
          ? 'bg-[#1E1B4B] text-white border-[#1E1B4B]'
          : 'bg-white text-[#1E1B4B] border-slate-200 hover:border-[#4338CA]/40'
      }`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              featured
                ? 'bg-[#7C3AED] text-white'
                : 'bg-[#4338CA]/10 text-[#4338CA]'
            }`}
          >
            {icon}
          </div>
          <span
            className={`text-xs font-mono tabular-nums ${
              featured ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            {indexLabel}
          </span>
        </div>

        <h3 className="font-display text-xl font-bold tracking-tight">{title}</h3>
        <p
          className={`text-sm leading-relaxed ${
            featured ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {description}
        </p>
      </div>

      <div className="pt-6 mt-6 border-t border-current/10">
        <Link
          to={to}
          className={`inline-flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-colors ${
            featured
              ? 'text-[#10B981] hover:text-white'
              : 'text-[#4338CA] hover:text-[#7C3AED]'
          }`}
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
