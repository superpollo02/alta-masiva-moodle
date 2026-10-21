import React from 'react';

interface HeroHeaderProps {
  badgeText: string;
  badgeIcon?: React.ReactNode;
  badgeVariant?: 'blue' | 'amber' | 'emerald' | 'red';
  title: string;
  description: string;
  children?: React.ReactNode;
}

const badgeVariants = {
  blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  red: 'bg-red-500/25 text-red-300 border-red-500/30'
};

export const HeroHeader: React.FC<HeroHeaderProps> = React.memo(({
  badgeText,
  badgeIcon,
  badgeVariant = 'blue',
  title,
  description,
  children
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-blue-900/50">
      <div className="max-w-3xl">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border mb-4 ${badgeVariants[badgeVariant]}`}>
          {badgeIcon && <span className="mr-1.5">{badgeIcon}</span>}
          {badgeText}
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
          {title}
        </h2>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4">
          {description}
        </p>
        {children}
      </div>
    </div>
  );
});
