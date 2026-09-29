import React, { useState, useRef, useEffect } from 'react';
import { Search, X, BookOpen, AlertTriangle, FileSpreadsheet, Film, PlayCircle, ExternalLink } from 'lucide-react';
import { SEARCH_INDEX, SearchResultItem } from '../data/searchIndex';

interface SearchBarProps {
  setActiveTab: (tab: any) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  Protocolo: BookOpen,
  'Solución de Errores': AlertTriangle,
  Glosario: BookOpen,
  'Video Tutorial': Film,
  Herramientas: FileSpreadsheet
};

export const SearchBar: React.FC<SearchBarProps> = ({ setActiveTab }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredResults = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return SEARCH_INDEX.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.keywords.some(kw => kw.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: SearchResultItem) => {
    setActiveTab(item.targetTab);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar secciones, términos, errores..."
          aria-label="Buscar en el manual"
          className="w-48 sm:w-64 md:w-80 pl-9 pr-8 py-1.5 bg-slate-800 text-sm text-slate-100 placeholder-slate-400 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 text-slate-400 hover:text-white"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
          <div className="p-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Resultados para "{query}"</span>
            <span>{filteredResults.length} encontrados</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {filteredResults.length > 0 ? (
              filteredResults.map((item) => {
                const Icon = categoryIcons[item.category] || BookOpen;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full text-left p-3 hover:bg-slate-800/80 transition-colors flex items-start space-x-3 group"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-colors mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                          {item.title}
                        </p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-400 text-sm">
                <p>No se encontraron resultados para "{query}".</p>
                <p className="text-xs text-slate-500 mt-1">Intenta con términos como "CSV", "Duplicado", "Fase 1" o "UTF-8".</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
