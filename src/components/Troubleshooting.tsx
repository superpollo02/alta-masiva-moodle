import React, { useState, useMemo } from 'react';
import { TROUBLESHOOTING_ITEMS } from '../data/protocolData';
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { HeroHeader } from './HeroHeader';
import { FilterSearchBar } from './FilterSearchBar';

export const Troubleshooting: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Memorización de filtrado para evitar re-cálculos en re-render
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return TROUBLESHOOTING_ITEMS;
    const term = searchTerm.toLowerCase();
    return TROUBLESHOOTING_ITEMS.filter(item =>
      item.problem.toLowerCase().includes(term) ||
      item.cause.toLowerCase().includes(term) ||
      item.solution.some(s => s.toLowerCase().includes(term))
    );
  }, [searchTerm]);

  return (
    <div className="space-y-8 pb-12">
      <HeroHeader
        badgeText="Guía de Resolución de Incidencias"
        badgeVariant="amber"
        title="Solución a Errores Comunes en Matriculación Moodle"
        description="Consulta basada en el análisis de excepciones del videotutorial (direcciones de correo duplicadas, usuarios preexistentes y verificación cruzada en participantes)."
      />

      <FilterSearchBar
        placeholder="Buscar error, causa o solución..."
        value={searchTerm}
        onChange={setSearchTerm}
        count={filteredItems.length}
        countLabel="casos documentados"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems.map(item => {
          const badgeColor =
            item.severity === 'error'
              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
              : item.severity === 'warning'
              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              : 'bg-blue-500/10 text-blue-600 border-blue-500/20';

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${badgeColor}`}>
                      {item.severity === 'error' ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {item.problem}
                    </h3>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Causa Raíz Identificada:</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {item.cause}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pasos de Resolución y Verificación:</span>
                  <ul className="space-y-2">
                    {item.solution.map((sol, idx) => (
                      <li key={idx} className="flex items-start space-x-2.5 text-sm text-slate-700 dark:text-slate-300">
                        <ArrowRight className="w-4 h-4 text-blue-600 shrink-0 mt-1" />
                        <span className="leading-relaxed">{sol}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Severidad: <strong className="capitalize">{item.severity}</strong></span>
                <span className="text-blue-500 font-medium">Protocolo ESalud</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
