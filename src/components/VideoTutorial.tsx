import React, { useState } from 'react';
import { VIDEO_TIMESTAMPS } from '../data/protocolData';
import { VideoTimestamp } from '../types';
import { Clock, Film, Volume2, Youtube } from 'lucide-react';
import { HeroHeader } from './HeroHeader';

export const VideoTutorial: React.FC = () => {
  const [phases] = useState<VideoTimestamp[]>(() => {
    const saved = localStorage.getItem('esalud_video_phases');
    return saved ? JSON.parse(saved) : VIDEO_TIMESTAMPS;
  });

  const [activeTimestamp, setActiveTimestamp] = useState<VideoTimestamp>(phases[0] || VIDEO_TIMESTAMPS[0]);

  const jumpToPhase = (ts: VideoTimestamp) => {
    setActiveTimestamp(ts);
  };

  return (
    <div className="space-y-8 pb-12">
      <HeroHeader
        badgeText="Video Tutorial Oficial en YouTube"
        badgeIcon={<Youtube className="w-3.5 h-3.5 inline text-red-400" />}
        badgeVariant="red"
        title="Video Tutorial Oficial ESalud (Ministerio de Salud de Mendoza)"
        description="Reproduzca el video institucional de YouTube y explore o seleccione cada una de las 5 fases del protocolo de matriculación masiva en Moodle."
      />

      {/* Main Grid: YouTube Player (Left) & Synchronized Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: YouTube Video Player */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative group">
            <div className="aspect-video relative bg-slate-900 flex items-center justify-center">
              <iframe
                key={activeTimestamp.id}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/JcJcKJiUqQg?enablejsapi=1&start=${activeTimestamp.seconds}`}
                title="Protocolo de Matriculación Moodle - ESalud Mendoza"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>

              {/* Overlay active chapter badge */}
              <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/60 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg z-10 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span>Fase {activeTimestamp.phase}: {activeTimestamp.title}</span>
              </div>
            </div>

            {/* Custom Interactive Player Info Bar */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center space-x-3">
                <div>
                  <p className="font-semibold text-white text-sm">Reproductor Oficial de YouTube</p>
                  <p className="text-xs text-slate-400">ID: JcJcKJiUqQg</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-blue-400 font-mono text-xs border border-slate-700 flex items-center space-x-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeTimestamp.timeFormatted}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Current Chapter Description Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
              <Film className="w-4 h-4" />
              <span>Detalle de la Fase Seleccionada</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeTimestamp.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {activeTimestamp.description}
            </p>
          </div>
        </div>

        {/* Right: Synchronized Timeline */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>Índice de las 5 Fases</span>
              </h3>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 font-bold border border-blue-100 dark:border-blue-900">
                {phases.length} Fases
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {phases.map((ts) => {
                const isActive = activeTimestamp.id === ts.id;
                return (
                  <div
                    key={ts.id}
                    onClick={() => jumpToPhase(ts)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-3.5 group ${
                      isActive 
                        ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-md shadow-blue-500/10' 
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-mono text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 group-hover:text-blue-600'
                    }`}>
                      {ts.timeFormatted}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-bold transition-colors ${isActive ? 'text-blue-900 dark:text-blue-200' : 'text-slate-900 dark:text-white group-hover:text-blue-600'}`}>
                          {ts.title}
                        </h4>
                        {isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white animate-pulse">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {ts.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
