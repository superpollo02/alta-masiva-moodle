import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

const TAB_NAMES: Record<string, string> = {
  protocol: 'Protocolo Instructivo',
  video: 'Video Tutorial Sincronizado',
  csv: 'Validador & Generador CSV',
  troubleshooting: 'Solución de Errores',
  simulator: 'Simulador Interactivo',
  glossary: 'Glosario'
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav aria-label="Breadcrumb" className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1">
      <ol className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
        <li>
          <button 
            onClick={() => setActiveTab('protocol')}
            className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
          >
            <Home className="w-4 h-4" />
            <span>Inicio</span>
          </button>
        </li>
        <li className="flex items-center space-x-2" aria-hidden="true">
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 dark:text-slate-500 font-medium">Campus Virtual</span>
        </li>
        <li className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="font-semibold text-slate-900 dark:text-slate-200" aria-current="page">
            {TAB_NAMES[activeTab] || 'Sección Actual'}
          </span>
        </li>
      </ol>
    </nav>
  );
};
