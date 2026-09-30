import { BookOpen, FileSpreadsheet, AlertTriangle, PlayCircle, ShieldCheck, Film, Sun, Moon, CheckCircle2, FileCheck2 } from 'lucide-react';
import { SearchBar } from './SearchBar';

interface NavbarProps {
  activeTab: 'protocol' | 'csv' | 'auditor' | 'troubleshooting' | 'simulator' | 'glossary' | 'video';
  setActiveTab: (tab: 'protocol' | 'csv' | 'auditor' | 'troubleshooting' | 'simulator' | 'glossary' | 'video') => void;
  isDark: boolean;
  toggleTheme: () => void;
  visitedTabs: Set<string>;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isDark, toggleTheme, visitedTabs }) => {
  const coreSteps = ['protocol', 'video', 'csv', 'auditor', 'troubleshooting', 'simulator'];
  const visitedCount = coreSteps.filter(step => visitedTabs.has(step)).length;
  const progressPercent = Math.min(100, Math.round((visitedCount / coreSteps.length) * 100));

  return (
    <header className="bg-slate-900 text-white shadow-xl sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 truncate">
                  Ministerio de Salud de Mendoza
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">ESalud Campus Virtual</span>
              </div>
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white mt-0.5 truncate">
                Protocolo de Matriculación Masiva en Moodle
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {/* Global Search Bar */}
            <div className="hidden md:block">
              <SearchBar setActiveTab={setActiveTab} />
            </div>

            {/* Progress Badge */}
            <div className="hidden lg:flex flex-col items-end bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-300 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Progreso: <strong className="text-white">{progressPercent}%</strong></span>
              </div>
              <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center border border-slate-700 transition-all shadow-md group shrink-0"
              title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              aria-label="Cambiar tema de color"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-5 h-5 text-blue-400 group-hover:-rotate-12 transition-transform" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search & Progress Bar */}
        <div className="block md:hidden pb-2">
          <SearchBar setActiveTab={setActiveTab} />
        </div>

        <div className="flex lg:hidden items-center justify-between bg-slate-800/60 px-3 py-2 rounded-lg mb-2 border border-slate-700/60 text-xs">
          <span className="text-slate-300 font-medium">Progreso: <strong className="text-white">{progressPercent}%</strong> ({visitedCount}/5 pasos)</span>
          <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-3 pt-1 scrollbar-none" role="tablist" aria-label="Secciones del manual">
          <button
            role="tab"
            aria-selected={activeTab === 'protocol'}
            onClick={() => setActiveTab('protocol')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeTab === 'protocol'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Protocolo Instructivo</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'video'}
            onClick={() => setActiveTab('video')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeTab === 'video'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Video Tutorial Sincronizado</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'csv'}
            onClick={() => setActiveTab('csv')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeTab === 'csv'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Validador & Generador</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'auditor'}
            onClick={() => setActiveTab('auditor')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeTab === 'auditor'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Auditor de CSV & Lotes</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'troubleshooting'}
            onClick={() => setActiveTab('troubleshooting')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeTab === 'troubleshooting'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Solución de Errores</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'simulator'}
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeTab === 'simulator'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>Simulador Interactivo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
