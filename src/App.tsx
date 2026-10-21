import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Breadcrumb } from './components/Breadcrumb';
import { ProtocolViewer } from './components/ProtocolViewer';
import { UnifiedCsvProcessor } from './components/UnifiedCsvProcessor';
import { Troubleshooting } from './components/Troubleshooting';
import { ProcessSimulator } from './components/ProcessSimulator';
import { Glossary } from './components/Glossary';
import { VideoTutorial } from './components/VideoTutorial';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'protocol' | 'csv' | 'troubleshooting' | 'simulator' | 'glossary' | 'video'>('csv');
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('esalud_theme');
    if (saved) return saved === 'dark';
    return true; // default dark mode
  });

  // Track visited protocol steps/tabs in session storage
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => {
    const saved = sessionStorage.getItem('esalud_visited_tabs');
    return saved ? new Set(JSON.parse(saved)) : new Set(['protocol', 'csv']);
  });

  useEffect(() => {
    localStorage.setItem('esalud_theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    setVisitedTabs(prev => {
      const next = new Set(prev);
      next.add(activeTab);
      sessionStorage.setItem('esalud_visited_tabs', JSON.stringify(Array.from(next)));
      return next;
    });
  }, [activeTab]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isDark={isDark} 
        toggleTheme={toggleTheme} 
        visitedTabs={visitedTabs}
      />

      <Breadcrumb activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        {activeTab === 'protocol' && <ProtocolViewer />}
        {activeTab === 'video' && <VideoTutorial />}
        {activeTab === 'csv' && <UnifiedCsvProcessor />}
        {activeTab === 'troubleshooting' && <Troubleshooting />}
        {activeTab === 'simulator' && <ProcessSimulator />}
        {activeTab === 'glossary' && <Glossary />}
      </main>

      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <span>Campus Virtual de Capacitación | Ministerio de Salud de Mendoza</span>
          </div>
          <div className="text-center sm:text-right">
            <p>Protocolo oficial de matriculación masiva y control de calidad en Moodle (ESalud).</p>
            <p className="text-slate-500 mt-1">Generado a partir del análisis de videotutorial institucional.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
