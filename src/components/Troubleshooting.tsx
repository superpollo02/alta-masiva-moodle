import React, { useState } from 'react';
import { TROUBLESHOOTING_ITEMS } from '../data/protocolData';
import { AlertTriangle, HelpCircle, CheckCircle2, Search, ArrowRight, ShieldAlert, Info } from 'lucide-react';

export const Troubleshooting: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = TROUBLESHOOTING_ITEMS.filter(item =>
    item.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cause.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.solution.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-blue-900/50">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-4">
          Guía de Resolución de Incidencias
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
          Solución a Errores Comunes en Matriculación Moodle
        </h2>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Consulta basada en el análisis de excepciones del videotutorial (direcciones de correo duplicadas, usuarios preexistentes y verificación cruzada en participantes).
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar error, causa o solución..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
          />
        </div>
        <div className="text-sm text-slate-500">
          Mostrando <span className="font-semibold text-slate-900 dark:text-white">{filteredItems.length}</span> casos documentados
        </div>
      </div>

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
                <span>Protocolo ESalud Mendoza</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">Verificación Manual en Moodle</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
