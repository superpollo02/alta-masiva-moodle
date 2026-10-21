import React, { useState, useMemo } from 'react';
import { PROTOCOL_STEPS } from '../data/protocolData';
import { CheckCircle2, AlertCircle, Lightbulb, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { HeroHeader } from './HeroHeader';
import { FilterSearchBar } from './FilterSearchBar';

export const ProtocolViewer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('esalud_completed_steps');
    return saved ? JSON.parse(saved) : {};
  });
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true, 4: true, 5: true });
  const [copied, setCopied] = useState(false);

  const toggleStep = (id: string) => {
    setCompletedSteps(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem('esalud_completed_steps', JSON.stringify(next));
      return next;
    });
  };

  const togglePhase = (phase: number) => {
    setExpandedPhases(prev => ({ ...prev, [phase]: !prev[phase] }));
  };

  // Memorización de filtrado
  const filteredSteps = useMemo(() => {
    if (!searchQuery.trim()) return PROTOCOL_STEPS;
    const q = searchQuery.toLowerCase().trim();
    return PROTOCOL_STEPS.filter(step => 
      step.title.toLowerCase().includes(q) ||
      step.description.toLowerCase().includes(q) ||
      step.phaseTitle.toLowerCase().includes(q) ||
      step.details.some(d => d.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const handleCopyProtocol = () => {
    const text = PROTOCOL_STEPS.map(s => `## ${s.phaseTitle}: ${s.title}\n${s.description}\n\nPasos:\n` + s.details.map(d => `- ${d}`).join('\n')).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completedCount = useMemo(() => {
    return Object.values(completedSteps).filter(Boolean).length;
  }, [completedSteps]);

  const progressPercent = Math.round((completedCount / PROTOCOL_STEPS.length) * 100);

  // Agrupamiento por fases memorizado
  const groupedSteps = useMemo(() => {
    const groups: Record<number, typeof PROTOCOL_STEPS> = {};
    for (const step of filteredSteps) {
      if (!groups[step.phase]) groups[step.phase] = [];
      groups[step.phase].push(step);
    }
    return groups;
  }, [filteredSteps]);

  return (
    <div className="space-y-8 pb-12">
      <HeroHeader
        badgeText="Instructivo Oficial Basado en Videotutorial"
        badgeVariant="blue"
        title="Protocolo de Matriculación Masiva y Control de Calidad"
        description="Este manual técnico detalla el procedimiento exacto para procesar formularios de inscripción en Google Sheets, depurar datos pendientes, formatear archivos CSV y ejecutar la matriculación masiva en el Campus Virtual ESalud del Ministerio de Salud de Mendoza, resolviendo duplicidades y excepciones sin pérdida de datos."
      >
        <div className="flex flex-wrap items-center gap-4 mt-2">
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
      </HeroHeader>

      <FilterSearchBar
        placeholder="Buscar en pasos, errores, CSV..."
        value={searchQuery}
        onChange={setSearchQuery}
        count={filteredSteps.length}
        countLabel="fases y procedimientos"
      />

      <div className="space-y-6">
        {Object.entries(groupedSteps).map(([phaseStr, steps]) => {
          const phase = Number(phaseStr);
          const isExpanded = expandedPhases[phase] !== false;

          return (
            <div key={phase} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <button
                onClick={() => togglePhase(phase)}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-left border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {phase}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {steps[0]?.phaseTitle || `Fase ${phase}`}
                  </h3>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>

              {isExpanded && (
                <div className="p-6 space-y-6 divide-y divide-slate-100 dark:divide-slate-800">
                  {steps.map(step => {
                    const isDone = !!completedSteps[step.id];

                    return (
                      <div key={step.id} className="pt-6 first:pt-0 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {step.title}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {step.description}
                            </p>
                          </div>

                          <button
                            onClick={() => toggleStep(step.id)}
                            className={`p-2 rounded-xl border flex items-center space-x-1.5 text-xs font-semibold shrink-0 transition-all ${
                              isDone
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isDone ? 'Completado' : 'Marcar'}</span>
                          </button>
                        </div>

                        <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Instrucciones Detalladas:</span>
                          <ul className="space-y-1.5">
                            {step.details.map((detail, dIdx) => (
                              <li key={dIdx} className="text-sm text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                                <span className="text-blue-500 font-bold">•</span>
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {step.tips && step.tips.length > 0 && (
                          <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              {step.tips.map((tip, tIdx) => (
                                <p key={tIdx}>{tip}</p>
                              ))}
                            </div>
                          </div>
                        )}

                        {step.warning && (
                          <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-medium">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>{step.warning}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
