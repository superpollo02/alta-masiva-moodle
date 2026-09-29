import React, { useState } from 'react';
import { PROTOCOL_STEPS } from '../data/protocolData';
import { Search, CheckCircle2, AlertCircle, Lightbulb, Image as ImageIcon, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

export const ProtocolViewer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true, 4: true, 5: true });
  const [copied, setCopied] = useState(false);

  const toggleStep = (id: string) => {
    setCompletedSteps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePhase = (phase: number) => {
    setExpandedPhases(prev => ({ ...prev, [phase]: !prev[phase] }));
  };

  const filteredSteps = PROTOCOL_STEPS.filter(step => 
    step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    step.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    step.phaseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    step.details.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCopyProtocol = () => {
    const text = PROTOCOL_STEPS.map(s => `## ${s.phaseTitle}: ${s.title}\n${s.description}\n\nPasos:\n` + s.details.map(d => `- ${d}`).join('\n')).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / PROTOCOL_STEPS.length) * 100);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner / Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-blue-900/50">
        <div className="max-w-3xl">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-4">
            Instructivo Oficial Basado en Videotutorial
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            Protocolo de Matriculación Masiva y Control de Calidad
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Este manual técnico detalla el procedimiento exacto para procesar formularios de inscripción en Google Sheets, depurar datos pendientes, formatear archivos CSV y ejecutar la matriculación masiva en el Campus Virtual ESalud del Ministerio de Salud de Mendoza, resolviendo duplicidades y excepciones sin pérdida de datos.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                {progressPercent}%
              </div>
              <div>
                <p className="text-xs text-slate-400">Progreso del Protocolo</p>
                <p className="text-sm font-semibold text-white">{completedCount} de {PROTOCOL_STEPS.length} fases completadas</p>
              </div>
            </div>

            <button
              onClick={handleCopyProtocol}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-lg shadow-blue-600/30"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Protocolo Copiado!' : 'Copiar Protocolo Completo'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en pasos, errores, CSV..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
          />
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Mostrando <span className="font-semibold text-slate-900 dark:text-white">{filteredSteps.length}</span> fases y procedimientos
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-6">
        {filteredSteps.map((step) => {
          const isCompleted = completedSteps[step.id] || false;
          const isExpanded = expandedPhases[step.phase] ?? true;

          return (
            <div
              key={step.id}
              className={`rounded-2xl border transition-all bg-white dark:bg-slate-900 shadow-sm overflow-hidden ${
                isCompleted 
                  ? 'border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/10' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Header */}
              <div 
                className="p-5 sm:p-6 flex items-center justify-between cursor-pointer bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800"
                onClick={() => togglePhase(step.phase)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isCompleted ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  }`}>
                    {step.phase}
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {step.phaseTitle}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {step.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStep(step.id);
                    }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <span>{isCompleted ? 'Completado' : 'Marcar hecho'}</span>
                  </button>

                  <span className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </span>
                </div>
              </div>

              {/* Content Body */}
              {isExpanded && (
                <div className="p-6 space-y-6">
                  <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed font-medium">
                    {step.description}
                  </p>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Pasos Detallados del Procedimiento:
                    </h4>
                    <ul className="space-y-2.5">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {step.tips && step.tips.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start space-x-3">
                      <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1">
                          Consejo Clave del Operador
                        </h5>
                        <ul className="space-y-1">
                          {step.tips.map((tip, idx) => (
                            <li key={idx} className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                              • {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {step.warning && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl p-4 flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-0.5">
                          Atención / Prevención de Errores
                        </h5>
                        <p className="text-xs sm:text-sm text-rose-900 dark:text-rose-200 leading-relaxed">
                          {step.warning}
                        </p>
                      </div>
                    </div>
                  )}

                  {step.imageHint && (
                    <div className="bg-slate-100 dark:bg-slate-800/60 rounded-xl p-3.5 flex items-center space-x-3 border border-slate-200 dark:border-slate-700">
                      <ImageIcon className="w-5 h-5 text-blue-500 shrink-0" />
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Referencia visual en video: </span>
                        {step.imageHint}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
