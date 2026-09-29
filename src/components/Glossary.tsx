import React, { useState, useMemo } from 'react';
import { BookOpen, Search, ShieldAlert, Cpu, Database, CheckCircle2 } from 'lucide-react';

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  protocolContext: string;
  category: 'Moodle & Aulas' | 'Datos & CSV' | 'Seguridad & Roles' | 'Administración';
  icon: keyof typeof iconMap;
}

const iconMap = {
  moodle: BookOpen,
  data: Database,
  security: ShieldAlert,
  admin: Cpu,
};

const glossaryData: GlossaryTerm[] = [
  {
    id: 'csv',
    term: 'Archivo CSV (Comma-Separated Values)',
    definition: 'Formato de archivo de texto plano en el que los valores están separados por delimitadores (comas o punto y coma). Es el estándar utilizado por Moodle para importar y matricular masivamente cientos de usuarios.',
    protocolContext: 'En el protocolo de ESalud, se genera desde Excel y se guarda con codificación UTF-8 y delimitador punto y coma (;).',
    category: 'Datos & CSV',
    icon: 'data',
  },
  {
    id: 'utf8',
    term: 'Codificación UTF-8',
    definition: 'Codificación de caracteres estándar que soporta múltiples idiomas y símbolos especiales. En la importación de Moodle es indispensable para evitar caracteres ilegibles en tildes y eñes.',
    protocolContext: 'Se configura obligatoriamente en el selector de codificación antes de hacer clic en "Subir usuarios".',
    category: 'Datos & CSV',
    icon: 'data',
  },
  {
    id: 'cohorte',
    term: 'Cohorte (Cohorts)',
    definition: 'Agrupación global de usuarios a nivel de sitio o categoría que facilita la matriculación sincronizada o masiva en múltiples cursos de forma simultánea.',
    protocolContext: 'Mencionado en la auditoría general de inscripciones y gestión de listas institucionales.',
    category: 'Moodle & Aulas',
    icon: 'moodle',
  },
  {
    id: 'matriculacion-manual',
    term: 'Matriculación Manual',
    definition: 'Método de inscripción en un curso donde el administrador o profesor agrega directamente a los usuarios participantes desde el panel del aula.',
    protocolContext: 'Utilizado para resolver casos particulares o usuarios que no pudieron inscribirse por duplicidad de correo.',
    category: 'Moodle & Aulas',
    icon: 'moodle',
  },
  {
    id: 'direccion-duplicada',
    term: 'Dirección Duplicada (Duplicate Email)',
    definition: 'Error o advertencia de Moodle que ocurre cuando el correo electrónico ingresado en el CSV ya se encuentra registrado en el sistema para otro usuario diferente.',
    protocolContext: 'Uno de los errores más frecuentes detectados en la simulación; requiere verificar correos institucionales compartidos o dar de alta manualmente.',
    category: 'Administración',
    icon: 'security',
  },
  {
    id: 'rol-usuario',
    term: 'Rol de Usuario (Student / Teacher)',
    definition: 'Conjunto de permisos asignados a un usuario dentro de un curso (ej. Estudiante / Student, Docente / Teacher) que delimitan sus capacidades de interacción.',
    protocolContext: 'Por defecto en el archivo CSV se asigna el curso con el sufijo de rol (ej. `REDLAB2026` con rol de estudiante).',
    category: 'Seguridad & Roles',
    icon: 'security',
  },
  {
    id: 'username',
    term: 'Username (Nombre de usuario / DNI)',
    definition: 'Identificador único alfanumérico que utiliza el usuario para autenticarse en el campus virtual. En este protocolo corresponde al número de DNI sin puntos.',
    protocolContext: 'Se extrae directamente de la columna de DNI del formulario de Google Sheets.',
    category: 'Seguridad & Roles',
    icon: 'security',
  },
  {
    id: 'password-inicial',
    term: 'Password Inicial (Contraseña temporal)',
    definition: 'Clave provisoria generada de manera masiva (ej. Capacitaciones2026*) para permitir el primer acceso de los alumnos al campus virtual.',
    protocolContext: 'Moodle se configura para forzar al usuario a cambiar esta contraseña en su primer inicio de sesión por motivos de seguridad.',
    category: 'Seguridad & Roles',
    icon: 'security',
  },
  {
    id: 'admin-sitio',
    term: 'Administración del Sitio',
    definition: 'Panel de control central de Moodle con privilegios elevados (Administrador) que permite gestionar usuarios, cursos, plugins, autenticación y políticas de privacidad.',
    protocolContext: 'Punto de partida en ESalud (`Administración del sitio > Usuarios > Subir usuarios`).',
    category: 'Administración',
    icon: 'admin',
  },
  {
    id: 'validador-subida',
    term: 'Vista Previa / Validador de Subida',
    definition: 'Pantalla previa generada por Moodle antes de ejecutar la importación masiva, mostrando las primeras filas de datos detectados y posibles errores de sintaxis.',
    protocolContext: 'Permite configurar los parámetros de actualización de cuentas existentes antes de pulsar "Subir usuarios".',
    category: 'Administración',
    icon: 'admin',
  },
];

export const Glossary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const categories = ['Todos', 'Moodle & Aulas', 'Datos & CSV', 'Seguridad & Roles', 'Administración'];

  // Memoize filtered terms to avoid recalculating on unrelated renders
  const filteredTerms = useMemo(() => {
    return glossaryData.filter((item) => {
      const matchesSearch =
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.protocolContext.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-blue-900/30">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-500/30">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Referencia Técnica</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Glosario de Términos Moodle & ESalud</h2>
          <p className="text-slate-300 mt-2 text-sm sm:text-base leading-relaxed">
            Diccionario oficial de conceptos técnicos, parámetros de importación CSV y terminología administrativa utilizada en el protocolo de matriculación masiva del Ministerio de Salud de Mendoza.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar término, concepto o contexto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-inner"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Mostrando <span className="font-bold text-slate-900 dark:text-white">{filteredTerms.length}</span> términos técnicos
        </p>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Limpiar búsqueda
          </button>
        )}
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTerms.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.term}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                    {item.category}
                  </span>
                </div>

                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4">
                  {item.definition}
                </p>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                <div className="flex items-start space-x-2 text-xs text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">En el protocolo ESalud: </span>
                    <span>{item.protocolContext}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTerms.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No se encontraron términos</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            Intente buscar con otros términos o seleccione la categoría "Todos".
          </p>
        </div>
      )}
    </div>
  );
};
