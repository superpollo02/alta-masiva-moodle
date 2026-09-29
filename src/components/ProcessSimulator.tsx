import React, { useState } from 'react';
import { PlayCircle, ArrowRight, CheckCircle, Database, FileText, Globe, Layers, RefreshCw } from 'lucide-react';

export const ProcessSimulator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const simulationSteps = [
    {
      title: 'Paso 1: Google Sheets y Filtrado',
      icon: FileText,
      description: 'El operador abre la planilla de respuestas del formulario de Google "Aula Red de Laboratorios 2026".',
      details: [
        'Los alumnos ya matriculados están pintados en AMARILLO.',
        'Los alumnos pendientes de matriculación están en GRIS.',
        'Se seleccionan únicamente los correos y datos de las filas en GRIS para evitar duplicidades.'
      ],
      mockScreen: 'Google Sheets | Vista de Respuestas de Formulario (Filtro Amarillo vs Gris)'
    },
    {
      title: 'Paso 2: Exportación a CSV',
      icon: Database,
      description: 'Los datos filtrados se copian a una planilla limpia con las cabeceras requeridas.',
      details: [
        'Cabeceras obligatorias: username, password, firstname, lastname, email, course1.',
        'Se asigna la contraseña inicial estándar (Capacitaciones2020*) y el nombre corto del curso (REDLAB2026).',
        'Se guarda el archivo en formato CSV delimitado por punto y coma (;).'
      ],
      mockScreen: 'Excel / LibreOffice | Guardar como CSV (Delimitado por punto y coma)'
    },
    {
      title: 'Paso 3: Carga en Campus ESalud Moodle',
      icon: Globe,
      description: 'Ingreso como Administrador al Campus Virtual de Capacitación del Ministerio de Salud de Mendoza.',
      details: [
        'Menú: Administración del sitio > Usuarios > Subir usuarios.',
        'Carga del archivo CSV y configuración del separador (Punto y coma).',
        'Configuración del tipo de subida: "Agregar nuevos y actualizar usuarios existentes".'
      ],
      mockScreen: 'Moodle ESalud | Administración > Usuarios > Subir usuarios (CSV)'
    },
    {
      title: 'Paso 4: Auditoría y Excepciones',
      icon: CheckCircle,
      description: 'Revisión del reporte de resultados y tratamiento de errores por correo duplicado.',
      details: [
        'El sistema notifica cuentas creadas con éxito y filas con aviso "Dirección duplicada".',
        'Se realiza una búsqueda cruzada en la lista de participantes del curso (ej. Depto Bioquímica > Aula Red de Laboratorios 2026).',
        'Se confirma si el agente ya estaba matriculado previamente bajo otro alias o correo personal.'
      ],
      mockScreen: 'Moodle ESalud | Reporte de Resultados y Verificación en Participantes del Curso'
    }
  ];

  const active = simulationSteps[currentStep];

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-blue-900/50">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-4">
          Simulador Interactivo de Flujo
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
          Recorrido Visual del Protocolo de Matriculación
        </h2>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Experimenta el flujo de trabajo completo paso a paso, desde la extracción en Google Sheets hasta la validación de altas y errores en Moodle.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {simulationSteps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = currentStep === idx;
          const isDone = currentStep > idx;

          return (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                  : isDone
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-slate-800 dark:text-slate-200'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isActive ? 'bg-white/20 text-white' : isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold opacity-80">Paso 0{idx + 1}</span>
              </div>
              <div>
                <h4 className="font-bold text-sm leading-snug mb-1">{s.title}</h4>
                <p className="text-xs opacity-80 line-clamp-2">{s.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Detailed Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <active.icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Fase Activa 0{currentStep + 1} de 4
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {active.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentStep(prev => Math.min(simulationSteps.length - 1, prev + 1))}
              disabled={currentStep === simulationSteps.length - 1}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-md shadow-blue-600/30 disabled:opacity-40 transition-all flex items-center space-x-1.5"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed font-medium">
              {active.description}
            </p>
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Puntos Clave del Proceso:</h4>
              <ul className="space-y-2.5">
                {active.details.map((d, i) => (
                  <li key={i} className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mock Visual Screen representation */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs font-mono text-slate-400">ESalud / Google Sheets Simulator</span>
            </div>

            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800/80 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mx-auto flex items-center justify-center">
                <active.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase text-blue-400 font-semibold mb-1">Vista de Pantalla</p>
                <h5 className="text-sm font-bold text-white">{active.mockScreen}</h5>
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Este paso simula la interfaz real grabada en el video de capacitación del Ministerio de Salud de Mendoza.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
