import { ProtocolStep, TroubleshootingItem, VideoTimestamp } from '../types';

export const PROTOCOL_STEPS: ProtocolStep[] = [
  {
    id: 'fase-1-filtrado',
    phase: 1,
    phaseTitle: 'Fase 1: Preparación y Filtrado en Google Sheets',
    title: 'Filtrado de usuarios pendientes (Gris vs Amarillo)',
    description: 'Identificación y selección exclusiva de los usuarios que aún no han sido matriculados en el curso.',
    details: [
      'Abrir la planilla de respuestas del formulario de Google ("Aula Red de Laboratorios 2026").',
      'Verificar el código de colores: Los usuarios ya matriculados se marcan en color AMARILLO, mientras que los pendientes de matriculación se encuentran en color GRIS.',
      'Seleccionar únicamente los datos de las filas en GRIS para evitar duplicidades innecesarias en el campus.',
      'Prestar especial atención al campo de correo electrónico: asegurarse de extraer el correo personal del usuario y no un correo genérico institucional (ej. de un hospital o servicio como bacteriología) que pueda estar compartido por varios agentes.'
    ],
    tips: [
      'Si un usuario no posee correo personal registrado, se generará un conflicto o bloqueo que requerirá intervención manual posterior.',
      'Copiar los campos clave en orden: DNI (Username), Contraseña inicial, Nombre, Apellido, Correo electrónico y Nombre corto del curso.'
    ],
    warning: 'Nunca procesar filas ya matriculadas (amarillas) para evitar sobreescrituras erróneas.',
    imageHint: 'Visualización de Google Sheets con filas amarillas (matriculados) y grises (pendientes).'
  },
  {
    id: 'fase-2-csv',
    phase: 2,
    phaseTitle: 'Fase 2: Creación y Formato del Archivo CSV',
    title: 'Estructuración de columnas y guardado en CSV',
    description: 'Traspaso de datos a una hoja de cálculo limpia y exportación al formato compatible con Moodle.',
    details: [
      'Pegar los datos copiados de Google Sheets en una planilla de trabajo limpia (sin formato para evitar rastros de celdas).',
      'Configurar las cabeceras obligatorias requeridas por Moodle: username, password, firstname, lastname, email, course1.',
      'Definir los valores estándar para todos los usuarios: Password inicial (ej. Capacitaciones2020*) y Course1 (ej. REDLAB2026).',
      'Revisar y ordenar la tabla de punta a punta para verificar que no existan celdas vacías o desalineadas entre DNI, Apellido y Nombre.',
      'Guardar el archivo seleccionando el formato CSV (delimitado por comas o punto y coma según configuración regional).'
    ],
    tips: [
      'Mantener el archivo CSV guardado con la fecha del día para llevar un control estricto de las remesas de capacitación.'
    ],
    warning: 'Verificar la codificación UTF-8 al exportar para evitar errores con tildes y caracteres especiales (ñ, á, é, etc.).',
    imageHint: 'Vista de Excel con las columnas username, password, firstname, lastname, email y course1.'
  },
  {
    id: 'fase-3-moodle',
    phase: 3,
    phaseTitle: 'Fase 3: Carga Masiva en el Campus Moodle (ESalud)',
    title: 'Acceso como Administrador y ejecución de subida',
    description: 'Ingreso al Campus Virtual de Capacitación del Ministerio de Salud de Mendoza y ejecución del asistente de subida masiva.',
    details: [
      'Ingresar al Campus ESalud (esalud.mendoza.gov.ar) con credenciales de Administrador.',
      'Navegar en el menú superior a: Administración del sitio > Usuarios > Subir usuarios.',
      'Hacer clic en "Seleccione un archivo" y cargar el archivo CSV generado en la fase anterior.',
      'Configurar el delimitador CSV como "Punto y coma" (o el utilizado al guardar el archivo).',
      'Hacer clic en "Subir usuarios" para realizar la previsualización de los registros.'
    ],
    tips: [
      'La previsualización mostrará los primeros 10 registros para confirmar que las columnas coinciden correctamente antes de confirmar la acción.'
    ],
    warning: 'Asegurarse de estar en el rol Administrador Global o Gestor con permisos de subida de usuarios.',
    imageHint: 'Pantalla de Moodle "Subir usuarios" con el selector de archivos y opciones de formato CSV.'
  },
  {
    id: 'fase-4-parametros',
    phase: 4,
    phaseTitle: 'Fase 4: Configuración de Parámetros de Alta',
    title: 'Ajustes avanzados para cuentas nuevas y existentes',
    description: 'Definición del comportamiento del sistema ante usuarios que ya existían previamente en el campus.',
    details: [
      'En la sección "Ajustes", configurar el tipo de subida como: "Agregar nuevos y actualizar usuarios existentes".',
      'Establecer "Crear contraseña si es necesario y enviarla por correo" o definir campo requerido en archivo según preferencia institucional (ej. usar contraseña del archivo).',
      'Configurar "Detalles de usuario existente" en "Sin cambios" o actualizar según necesidad.',
      'Definir "Valores por defecto" si fuese necesario (ciudad: Mendoza, visibilidad del correo visible para participantes).',
      'Hacer clic en el botón inferior "Subir usuarios" para procesar la cola completa.'
    ],
    tips: [
      'El sistema emitirá un reporte detallado al finalizar indicando cuántos usuarios fueron creados, cuántos actualizados y si hubo errores.'
    ],
    warning: 'Revisar detenidamente las opciones de actualización para no sobrescribir datos de usuarios que ya participan en otros cursos.',
    imageHint: 'Panel de ajustes de subida masiva en Moodle con opciones de actualización y contraseña.'
  },
  {
    id: 'fase-5-errores',
    phase: 5,
    phaseTitle: 'Fase 5: Resolución de Errores y Verificación',
    title: 'Tratamiento de direcciones duplicadas y excepciones',
    description: 'Protocolo para resolver avisos de error como "Dirección duplicada" o usuarios que no aparecen en el listado.',
    details: [
      'Identificar en el reporte final las filas marcadas en rojo (ej. "Usuario no actualizado: Dirección duplicada").',
      'Causa habitual: El agente ya posee cuenta en Moodle con otro correo o el correo de servicio fue ingresado para más de una persona.',
      'Método de resolución: Abrir otra ventana del campus, ir a Administración del sitio > Cursos > Buscar el curso específico (ej. Depto Bioquímica > Aula Red de Laboratorios 2026).',
      'Hacer clic en "Usuarios matriculados" y buscar al participante por Apellido o DNI.',
      'Si el usuario ya se encuentra matriculado (ej. Silvana Longedo), el sistema bloquea la duplicación por seguridad pero confirma su participación activa.',
      'Si no aparece o hay un error de tipeo en el nombre/apellido (ej. García vs cruz garcía), verificar manualmente y matricular desde el botón "Matricular usuarios".'
    ],
    tips: [
      'Mantener siempre abierto el acceso al curso en una pestaña secundaria para no perder el hilo de verificación de alumnos durante el proceso.'
    ],
    warning: 'Nunca ignorar los errores en rojo sin antes verificar en la lista de participantes del curso si el alumno efectivamente tiene acceso.',
    imageHint: 'Reporte de resultados de Moodle con alertas rojas de dirección duplicada y búsqueda cruzada.'
  }
];

export const TROUBLESHOOTING_ITEMS: TroubleshootingItem[] = [
  {
    id: 'err-dup-email',
    problem: 'Error: "Dirección duplicada" o "Usuario no actualizado"',
    cause: 'El correo electrónico ingresado en el CSV ya está registrado en el sistema bajo otro usuario, o se intentó usar un correo compartido (ej. de un servicio u hospital).',
    solution: [
      'Ir al curso en Moodle > Participantes > Buscar al alumno por DNI o Apellido.',
      'Comprobar si el usuario ya está matriculado previamente.',
      'Si ya está matriculado, el sistema omite la creación por seguridad. Si el correo es correcto pero pertenece a otra persona, solicitar correo personal individual.'
    ],
    severity: 'warning'
  },
  {
    id: 'err-encoding',
    problem: 'Caracteres extraños o signos de interrogación en nombres y apellidos',
    cause: 'El archivo CSV no fue guardado con codificación UTF-8 estándar.',
    solution: [
      'Volver a la planilla de cálculo original.',
      'Guardar o exportar nuevamente el archivo asegurando seleccionar codificación "CSV (delimitado por comas) UTF-8".',
      'Volver a realizar la carga en Moodle.'
    ],
    severity: 'error'
  },
  {
    id: 'err-separator',
    problem: 'Todos los datos de la fila aparecen en una sola columna en Moodle',
    cause: 'Incompatibilidad entre el separador configurado en Moodle (coma o punto y coma) y el delimitador real del archivo CSV.',
    solution: [
      'En el paso de carga de Moodle, desplegar las opciones avanzadas.',
      'Cambiar el campo "Separador CSV" entre Coma (,) y Punto y coma (;) según corresponda al sistema operativo y hoja de cálculo utilizada.'
    ],
    severity: 'info'
  },
  {
    id: 'err-missing-user',
    problem: 'El alumno reclama que no puede ingresar aunque figura en la planilla',
    cause: 'El usuario fue creado en el campus pero hubo un error en la asignación del curso (course1) o la contraseña inicial no fue comunicada.',
    solution: [
      'Buscar el usuario en la administración de usuarios globales.',
      'Verificar su matriculación explícita en el curso correspondiente con rol "Estudiante".',
      'Restablecer contraseña temporal si es necesario.'
    ],
    severity: 'warning'
  }
];

export const DEFAULT_SAMPLE_CSV = `username;password;firstname;lastname;email;course1
24500901;Capacitaciones2020*;Ana Carolina;García;anacarolina.mendoza@gmail.com;REDLAB2026
25468902;Capacitaciones2020*;Pablo;Pérez;pabloperez.lab@yahoo.com.ar;REDLAB2026
26789103;Capacitaciones2020*;María Laura;López;marialauralopez@gmail.com;REDLAB2026`;

export const VIDEO_TIMESTAMPS: VideoTimestamp[] = [
  {
    id: 't-1',
    phase: 1,
    title: 'Fase 1: Filtrado en Google Sheets',
    seconds: 0,
    timeFormatted: '00:00',
    description: 'Explicación del listado de respuestas, diferenciación entre matriculados (amarillo) y pendientes (gris).'
  },
  {
    id: 't-2',
    phase: 2,
    title: 'Fase 2: Creación de Planilla CSV',
    seconds: 45,
    timeFormatted: '00:45',
    description: 'Copia de datos personales, eliminación de formato y preparación de columnas obligatorias.'
  },
  {
    id: 't-3',
    phase: 3,
    title: 'Fase 3: Carga en Campus ESalud',
    seconds: 135,
    timeFormatted: '02:15',
    description: 'Acceso como administrador, navegación a Administración del sitio > Usuarios > Subir usuarios.'
  },
  {
    id: 't-4',
    phase: 4,
    title: 'Fase 4: Configuración de Alta y Parámetros',
    seconds: 220,
    timeFormatted: '03:40',
    description: 'Ajuste de tipos de subida, actualización de cuentas existentes y contraseña obligatoria.'
  },
  {
    id: 't-5',
    phase: 5,
    title: 'Fase 5: Errores y Verificación en Curso',
    seconds: 310,
    timeFormatted: '05:10',
    description: 'Tratamiento de direcciones duplicadas y búsqueda de alumnos en participantes del curso.'
  }
];

