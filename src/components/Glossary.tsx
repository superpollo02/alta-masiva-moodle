import React, { useState, useMemo } from 'react';
import { BookOpen, Search, ShieldAlert, Cpu, Database, CheckCircle2 } from 'lucide-react';
import { HeroHeader } from './HeroHeader';
import { FilterSearchBar } from './FilterSearchBar';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    return ['all', 'Moodle & Aulas', 'Datos & CSV', 'Seguridad & Roles', 'Administración'];
  }, []);

  const filteredTerms = useMemo(() => {
    return glossaryData.filter(item => {
      const matchesSearch = 
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.protocolContext.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="space-y-8 pb-12">
      <HeroHeader
        badgeText="Glosario Institucional"
        badgeVariant="blue"
        title="Glosario de Términos Clave en Moodle y Datos"
        description="Conceptos técnicos y normativos esenciales para la matriculación de usuarios, codificaciones y arquitectura del Campus Virtual ESalud."
      />

      <div className="space-y-4">
        <FilterSearchBar
          placeholder="Buscar concepto, sigla o definición..."
          value={searchTerm}
          onChange={setSearchTerm}
          count={filteredTerms.length}
          countLabel="términos"
        />

        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat === 'all' ? 'Todas las categorías' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTerms.map((term) => {
          const IconComponent = iconMap[term.icon] || BookOpen;

          return (
            <div
              key={term.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {term.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {term.term}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {term.definition}
                </p>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <strong className="text-blue-600 dark:text-blue-400 block mb-1">Contexto en Protocolo:</strong>
                  {term.protocolContext}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Estándar ESalud
                </span>
                <span>ID: {term.id}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
