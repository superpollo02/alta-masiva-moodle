import React from 'react';
import { Search } from 'lucide-react';

interface FilterSearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  count?: number;
  countLabel?: string;
}

export const FilterSearchBar: React.FC<FilterSearchBarProps> = React.memo(({
  placeholder = 'Buscar...',
  value,
  onChange,
  count,
  countLabel = 'resultados'
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-all"
        />
      </div>
      {count !== undefined && (
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Mostrando <span className="font-semibold text-slate-900 dark:text-white">{count}</span> {countLabel}
        </div>
      )}
    </div>
  );
});
