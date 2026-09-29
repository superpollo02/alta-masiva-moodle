export interface SearchResultItem {
  id: string;
  title: string;
  category: 'Protocolo' | 'Solución de Errores' | 'Glosario' | 'Video Tutorial' | 'Herramientas';
  targetTab: 'protocol' | 'csv' | 'troubleshooting' | 'simulator' | 'glossary' | 'video';
  description: string;
  keywords: string[];
}

export const SEARCH_INDEX: SearchResultItem[] = [
  {
    id: 'fase-1-sheets',
    title: 'Fase 1: Preparación de Google Sheets',
    category: 'Protocolo',
    targetTab: 'protocol',
    description: 'Filtrado de planillas de inscripción, separación de alumnos matriculados (amarillo) y pendientes (gris).',
    keywords: ['google sheets', 'planilla', 'filtrar', 'amarillo', 'gris', 'inscripcion', 'fase 1']
  },
  {
    id: 'fase-2-csv',
    title: 'Fase 2: Exportación a Formato CSV',
    category: 'Protocolo',
    targetTab: 'protocol',
    description: 'Configuración de cabeceras obligatorias (username, password, firstname, lastname, email, course1) con delimitador punto y coma y UTF-8.',
    keywords: ['csv', 'excel', 'delimitador', 'punto y coma', 'utf-8', 'cabeceras', 'fase 2']
  },
  {
    id: 'fase-3-moodle',
    title: 'Fase 3: Carga en Campus Virtual Moodle',
    category: 'Protocolo',
    targetTab: 'protocol',
    description: 'Subida del archivo CSV desde Administración del sitio > Usuarios > Subir usuarios.',
    keywords: ['moodle', 'campus virtual', 'subir usuarios', 'administracion', 'fase 3']
  },
  {
    id: 'fase-4-audit',
    title: 'Fase 4: Auditoría y Resolución de Errores',
    category: 'Protocolo',
    targetTab: 'protocol',
    description: 'Control de calidad post-carga y resolución de excepciones de correo duplicado.',
    keywords: ['auditoria', 'control de calidad', 'errores', 'fase 4']
  },
  {
    id: 'err-duplicate',
    title: 'Error: Dirección de correo duplicada',
    category: 'Solución de Errores',
    targetTab: 'troubleshooting',
    description: 'El correo ya está registrado en Moodle. Solución: búsqueda cruzada o matriculación manual.',
    keywords: ['correo duplicado', 'duplicate email', 'error', 'solucion']
  },
  {
    id: 'err-delimiter',
    title: 'Error: Campos aglutinados por delimitador incorrecto',
    category: 'Solución de Errores',
    targetTab: 'troubleshooting',
    description: 'El archivo CSV usaba comas en lugar de punto y coma (;).',
    keywords: ['coma', 'delimitador', 'aglutinados', 'separador']
  },
  {
    id: 'err-utf8',
    title: 'Error: Caracteres ilegibles o tildes rotas (Ñ / acentos)',
    category: 'Solución de Errores',
    targetTab: 'troubleshooting',
    description: 'Falta de codificación UTF-8 al guardar el archivo CSV.',
    keywords: ['utf-8', 'ñ', 'tildes', 'caracteres extraños', 'codificacion']
  },
  {
    id: 'term-csv',
    title: 'Archivo CSV (Comma-Separated Values)',
    category: 'Glosario',
    targetTab: 'glossary',
    description: 'Formato de texto plano con valores separados por delimitador para importar usuarios en lote.',
    keywords: ['csv', 'glosario', 'definicion']
  },
  {
    id: 'term-utf8',
    title: 'Codificación UTF-8',
    category: 'Glosario',
    targetTab: 'glossary',
    description: 'Estándar de codificación para soportar acentos, eñes y caracteres especiales.',
    keywords: ['utf8', 'codificacion', 'glosario']
  },
  {
    id: 'term-cohort',
    title: 'Cohorte (Cohorts)',
    category: 'Glosario',
    targetTab: 'glossary',
    description: 'Agrupación global de usuarios para matriculación simultánea en múltiples aulas.',
    keywords: ['cohorte', 'cohorts', 'glosario']
  },
  {
    id: 'tool-csvgen',
    title: 'Validador & Generador CSV Interactivo',
    category: 'Herramientas',
    targetTab: 'csv',
    description: 'Herramienta web para generar y auditar el archivo CSV institucional antes de subirlo a Moodle.',
    keywords: ['generador csv', 'validador', 'herramienta', 'descargar csv']
  },
  {
    id: 'tool-simulator',
    title: 'Simulador de Carga Masiva',
    category: 'Herramientas',
    targetTab: 'simulator',
    description: 'Simulador paso a paso del proceso de subida y auditoría en el campus virtual.',
    keywords: ['simulador', 'practica', 'simulacion']
  },
  {
    id: 'tool-video',
    title: 'Video Tutorial Sincronizado',
    category: 'Video Tutorial',
    targetTab: 'video',
    description: 'Videotutorial oficial sincronizado con marcas de tiempo para cada fase del protocolo.',
    keywords: ['video', 'tutorial', 'reproductor', 'youtube']
  }
];
