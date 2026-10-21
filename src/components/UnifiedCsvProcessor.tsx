import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, 
  FileDown, 
  FileSpreadsheet, 
  RefreshCw, 
  Search, 
  Archive, 
  ArrowRight,
  Sliders,
  ChevronDown,
  ChevronUp,
  KeyRound,
  GraduationCap,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { Toast, ToastMessage } from './Toast';

export const UnifiedCsvProcessor: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  
  // Parámetros de curso, contraseña y rol (persistidos o por defecto)
  const [defaultCourse, setDefaultCourse] = useState<string>(() => {
    return localStorage.getItem('esalud_course1') || 'REDLAB2026';
  });
  const [defaultRole, setDefaultRole] = useState<string>(() => {
    return localStorage.getItem('esalud_role1') || 'student';
  });
  const [defaultPasswordPattern, setDefaultPasswordPattern] = useState<string>(() => {
    return localStorage.getItem('esalud_default_password') || 'Capacitaciones2026*';
  });
  
  // Mapeo de columnas de la planilla Excel / insumo
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [showMappingPanel, setShowMappingPanel] = useState<boolean>(true);
  const [isSingleNameCol, setIsSingleNameCol] = useState<boolean>(false);
  const [columnMapping, setColumnMapping] = useState({
    usernameCol: '',
    firstnameCol: '',
    lastnameCol: '',
    fullNameCol: '',
    emailCol: '',
    courseCol: '',
    roleCol: '',
    passwordCol: ''
  });

  // Datos procesados
  const [rows, setRows] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  
  // Filtros de tabla
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'warning' | 'error' | 'unaligned'>('all');
  
  // Opciones de exportación
  const [delimiter, setDelimiter] = useState<string>(';');
  const [batchSize, setBatchSize] = useState<number>(500);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);

  // Persistir configuraciones clave en localStorage
  useEffect(() => {
    localStorage.setItem('esalud_course1', defaultCourse);
  }, [defaultCourse]);

  useEffect(() => {
    localStorage.setItem('esalud_role1', defaultRole);
  }, [defaultRole]);

  useEffect(() => {
    localStorage.setItem('esalud_default_password', defaultPasswordPattern);
  }, [defaultPasswordPattern]);

  // Inicializar Web Worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('../utils/csvWorker.ts', import.meta.url), { type: 'module' });
    
    workerRef.current.onmessage = (e: MessageEvent) => {
      const data = e.data;
      setIsProcessing(false);

      if (data.type === 'ERROR') {
        addToast(data.message, 'error');
        return;
      }

      if (data.type === 'PARSE_COMPLETE') {
        setRawHeaders(data.headers);
        setRows(data.rows);
        setIssues(data.issues);
        setSummary(data.summary);
        
        // Sincronizar el mapeo detectado automáticamente
        if (data.detectedMapping) {
          setColumnMapping({
            usernameCol: data.detectedMapping.userCol || '',
            firstnameCol: data.detectedMapping.fnCol || '',
            lastnameCol: data.detectedMapping.lnCol || '',
            fullNameCol: data.detectedMapping.fullCol || '',
            emailCol: data.detectedMapping.emCol || '',
            courseCol: data.detectedMapping.crsCol || '',
            roleCol: data.detectedMapping.rolCol || '',
            passwordCol: data.detectedMapping.pwdCol || ''
          });
          if (data.detectedMapping.fullCol && (!data.detectedMapping.fnCol || !data.detectedMapping.lnCol)) {
            setIsSingleNameCol(true);
          }
        }

        setActiveStep(2);
        addToast(`Planilla analizada: ${data.summary.totalRows} filas auditadas.`, 'success');
      }

      if (data.type === 'ZIP_COMPLETE') {
        const url = URL.createObjectURL(data.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName ? fileName.replace(/\.[^/.]+$/, '') : 'moodle_matriculacion'}_lotes_moodle.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast(`¡Lotes generados con éxito! (${data.totalBatches} archivos CSV en ZIP)`, 'success');
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [fileName]);

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de seguridad de tamaño máximo (15 MB)
    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      addToast('El archivo supera el límite de seguridad permitido (15 MB).', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const arrayBuffer = evt.target?.result as ArrayBuffer;
      if (arrayBuffer && workerRef.current) {
        workerRef.current.postMessage({
          type: 'PARSE_FILE',
          fileData: arrayBuffer,
          fileName: file.name,
          defaultCourse,
          defaultRole,
          defaultPassword: defaultPasswordPattern
        });
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      addToast('Error al leer el archivo en el navegador.', 'error');
    };
    reader.readAsArrayBuffer(file);
  };

  // Re-auditar si el usuario modifica los campos mapeados, el curso, el rol o la clave
  const handleApplyMapping = () => {
    if (!workerRef.current) return;
    setIsProcessing(true);
    workerRef.current.postMessage({
      type: 'RE_AUDIT',
      mapping: {
        usernameCol: columnMapping.usernameCol,
        firstnameCol: isSingleNameCol ? '' : columnMapping.firstnameCol,
        lastnameCol: isSingleNameCol ? '' : columnMapping.lastnameCol,
        fullNameCol: isSingleNameCol ? columnMapping.fullNameCol : '',
        emailCol: columnMapping.emailCol,
        courseCol: columnMapping.courseCol,
        roleCol: columnMapping.roleCol,
        passwordCol: columnMapping.passwordCol
      },
      defaultCourse,
      defaultRole,
      defaultPassword: defaultPasswordPattern
    });
    addToast('Parámetros actualizados y re-auditados con éxito.', 'info');
  };

  const handleResetAll = () => {
    setFileName('');
    setRawHeaders([]);
    setRows([]);
    setIssues([]);
    setSummary(null);
    setSearchTerm('');
    setStatusFilter('all');
    setActiveStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    addToast('Sesión limpiada. Listo para cargar una nueva planilla.', 'info');
  };

  const handleDownloadSingleCsv = () => {
    if (rows.length === 0) return;

    const csvHeaders = ['username', 'password', 'firstname', 'lastname', 'email', 'course1', 'role1'];
    const escapeCsvCell = (val: any) => {
      const sanitized = String(val ?? '').replace(/^[=+\-@\t\r]/, '\'$&');
      return `"${sanitized.replace(/"/g, '""')}"`;
    };

    let csvContent = '\uFEFF' + csvHeaders.join(delimiter) + '\r\n'; // Con UTF-8 BOM
    for (const r of rows) {
      csvContent += [
        escapeCsvCell(r.username),
        escapeCsvCell(r.password),
        escapeCsvCell(r.firstname),
        escapeCsvCell(r.lastname),
        escapeCsvCell(r.email),
        escapeCsvCell(r.course1),
        escapeCsvCell(r.role1)
      ].join(delimiter) + '\r\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName ? fileName.replace(/\.[^/.]+$/, '') : 'matriculacion'}_moodle.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Archivo CSV oficial descargado correctamente.', 'success');
  };

  const handleDownloadZipBatches = () => {
    if (rows.length === 0 || !workerRef.current) return;
    setIsProcessing(true);

    const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'moodle_matriculacion';
    workerRef.current.postMessage({
      type: 'GENERATE_ZIP',
      rows,
      batchSize,
      delimiter,
      baseFileName: baseName
    });
  };

  // Filtrado de filas
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (statusFilter === 'unaligned') {
        const hasUnaligned = (r._errors || []).some((e: string) => e.includes('desalineación'));
        if (!hasUnaligned) return false;
      } else if (statusFilter !== 'all' && r._status !== statusFilter) {
        return false;
      }

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.username?.toLowerCase().includes(term) ||
        r.firstname?.toLowerCase().includes(term) ||
        r.lastname?.toLowerCase().includes(term) ||
        r.email?.toLowerCase().includes(term) ||
        r.course1?.toLowerCase().includes(term)
      );
    });
  }, [rows, statusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Barra de progreso de flujo (Wizard) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              {activeStep}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Asistente de Matriculación Masiva & Auditor de Insumos
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium">
                  Web Worker
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audita campos preexistentes en planillas Excel, configura contraseñas, cursos y roles, y exporta lotes CSV para Moodle.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => rows.length > 0 && setActiveStep(step as any)}
                disabled={step > 1 && rows.length === 0}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeStep === step
                    ? 'bg-blue-600 text-white shadow-sm'
                    : rows.length > 0
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    : 'opacity-40 cursor-not-allowed text-slate-400'
                }`}
              >
                {step === 1 ? '1. Insumo Excel' : step === 2 ? '2. Configurar & Auditar' : '3. Exportar Lotes'}
              </button>
            ))}

            {rows.length > 0 && (
              <button
                onClick={handleResetAll}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center space-x-1.5 transition-all ml-1"
                title="Limpiar datos cargados y comenzar con otra planilla"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar e Iniciar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PASO 1: CARGA DE ARCHIVO INSUMO */}
      {activeStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center border-dashed border-2 min-h-[320px]">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
            />
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-inner">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Cargue la planilla Excel (.xlsx, .xls) o CSV de origen
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6">
              El motor escaneará las columnas preexistentes (DNI, Email, Nombre, Apellido, Curso) y revisará que no existan filas desalineadas ni correos mal formateados.
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center space-x-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Procesando en segundo plano...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Seleccionar archivo local</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Configuración Inicial Predeterminada
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Código Corto de Curso Moodle (course1)
              </label>
              <input 
                type="text" 
                value={defaultCourse} 
                onChange={(e) => setDefaultCourse(e.target.value)} 
                placeholder="ej: REDLAB2026"
                className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-500">Se usará si el Excel no contiene una columna explícita de curso.</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rol Moodle
              </label>
              <select
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="student">Estudiante (student)</option>
                <option value="editingteacher">Profesor con permiso de edición (editingteacher)</option>
                <option value="teacher">Profesor sin permiso de edición (teacher)</option>
                <option value="coursecreator">Creador de curso (coursecreator)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Contraseña Predeterminada o Patrón
              </label>
              <input 
                type="text" 
                value={defaultPasswordPattern} 
                onChange={(e) => setDefaultPasswordPattern(e.target.value)} 
                placeholder="ej: Capacitaciones2026* o {dni}*Mendoza"
                className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <span className="text-[10px] text-slate-500">Puedes ingresar una contraseña fija (ej. <code className="text-blue-500 font-semibold">Capacitaciones2026*</code>) o usar <code className="text-blue-500">{'{dni}'}</code>.</span>
            </div>
          </div>
        </div>
      )}

      {/* PASO 2: VALIDACIÓN DE CAMPOS PREEXISTENTES, CONFIGURACIÓN & AUDITORÍA */}
      {activeStep === 2 && summary && (
        <div className="space-y-6">
          {/* Panel de Configuración de Mapeo, Curso, Contraseña y Rol */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Sliders className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Configuración de Mapeo y Parámetros Moodle
                  </h3>
                  <p className="text-xs text-slate-500">
                    Archivo: <strong>{fileName}</strong> ({rawHeaders.length} columnas detectadas en la planilla insumo)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowMappingPanel(!showMappingPanel)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center space-x-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span>{showMappingPanel ? 'Ocultar Opciones' : 'Modificar Opciones'}</span>
                {showMappingPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showMappingPanel && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-5">
                {/* 1. SECCIÓN DE PARÁMETROS MOODLE (PASSWORD, CURSO, ROL) */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                    1. Parámetros de Matriculación (Curso, Password y Rol)
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                        <span>Nombre Corto del Curso (Course 1) *</span>
                      </label>
                      <input 
                        type="text" 
                        value={defaultCourse} 
                        onChange={(e) => setDefaultCourse(e.target.value)} 
                        placeholder="ej: REDLAB2026"
                        className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                        <span>Contraseña Inicial (Password) *</span>
                      </label>
                      <input 
                        type="text" 
                        value={defaultPasswordPattern} 
                        onChange={(e) => setDefaultPasswordPattern(e.target.value)} 
                        placeholder="ej: Capacitaciones2026*"
                        className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Rol Asignado (Role 1)</span>
                      </label>
                      <select
                        value={defaultRole}
                        onChange={(e) => setDefaultRole(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                      >
                        <option value="student">Estudiante (student)</option>
                        <option value="editingteacher">Profesor con permiso de edición</option>
                        <option value="teacher">Profesor sin permiso de edición</option>
                        <option value="coursecreator">Creador de curso (coursecreator)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. SECCIÓN DE ASOCIACIÓN DE COLUMNAS PREEXISTENTES DE LA PLANILLA */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    2. Mapeo de Columnas Preexistentes en la Planilla Insumo
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Columna DNI */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Columna DNI / Username *
                      </label>
                      <select
                        value={columnMapping.usernameCol}
                        onChange={(e) => setColumnMapping(prev => ({ ...prev, usernameCol: e.target.value }))}
                        className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="">-- Seleccionar columna --</option>
                        {rawHeaders.map((h, i) => (
                          <option key={i} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {/* Columna Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Columna Correo Electrónico *
                      </label>
                      <select
                        value={columnMapping.emailCol}
                        onChange={(e) => setColumnMapping(prev => ({ ...prev, emailCol: e.target.value }))}
                        className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="">-- Seleccionar columna --</option>
                        {rawHeaders.map((h, i) => (
                          <option key={i} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {/* Modo de Nombre */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Estructura de Nombre y Apellido
                        </label>
                        <div className="flex items-center space-x-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setIsSingleNameCol(false)}
                            className={`px-2 py-0.5 rounded ${!isSingleNameCol ? 'bg-blue-600 text-white font-bold' : 'text-slate-500'}`}
                          >
                            Columnas Separadas
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsSingleNameCol(true)}
                            className={`px-2 py-0.5 rounded ${isSingleNameCol ? 'bg-blue-600 text-white font-bold' : 'text-slate-500'}`}
                          >
                            Columna Única (Juntos)
                          </button>
                        </div>
                      </div>

                      {!isSingleNameCol ? (
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={columnMapping.firstnameCol}
                            onChange={(e) => setColumnMapping(prev => ({ ...prev, firstnameCol: e.target.value }))}
                            className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                          >
                            <option value="">Columna Nombre</option>
                            {rawHeaders.map((h, i) => (
                              <option key={i} value={h}>{h}</option>
                            ))}
                          </select>
                          <select
                            value={columnMapping.lastnameCol}
                            onChange={(e) => setColumnMapping(prev => ({ ...prev, lastnameCol: e.target.value }))}
                            className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                          >
                            <option value="">Columna Apellido</option>
                            {rawHeaders.map((h, i) => (
                              <option key={i} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <select
                          value={columnMapping.fullNameCol}
                          onChange={(e) => setColumnMapping(prev => ({ ...prev, fullNameCol: e.target.value }))}
                          className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        >
                          <option value="">Seleccione columna con Nombre y Apellido juntos</option>
                          {rawHeaders.map((h, i) => (
                            <option key={i} value={h}>{h}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500">
                    Al cambiar el curso, password, rol o columnas, pulsa "Actualizar y Re-auditar" para aplicar los cambios a todo el lote.
                  </span>
                  <button
                    onClick={handleApplyMapping}
                    disabled={isProcessing}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
                  >
                    {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Actualizar y Re-auditar</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* KPI Tiles según reglas de visualización y control de desalineación */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Filas</span>
              <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white mt-1">
                {summary.totalRows}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-emerald-500/20 p-4 rounded-xl shadow-sm">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Aptas para Moodle</span>
              <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                {summary.validRows}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-amber-500/20 p-4 rounded-xl shadow-sm">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Emails Inválidos/Vacíos</span>
              <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                {summary.emptyEmailCount + summary.invalidEmailCount}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-rose-500/20 p-4 rounded-xl shadow-sm">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Desalineadas</span>
              <div className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400 mt-1">
                {summary.unalignedCount}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-rose-500/20 p-4 rounded-xl shadow-sm">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Errores Críticos</span>
              <div className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400 mt-1">
                {summary.errorCount}
              </div>
            </div>
          </div>

          {/* Filtros y Buscador */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por DNI, Nombre o Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">Todas las filas ({rows.length})</option>
                <option value="unaligned">Filas Desalineadas ({summary.unalignedCount})</option>
                <option value="error">Solo errores ({issues.filter(i => i.errors.length > 0).length})</option>
                <option value="warning">Solo advertencias ({issues.filter(i => i.warnings.length > 0).length})</option>
                <option value="valid">Solo válidas ({summary.validRows})</option>
              </select>

              <button
                onClick={() => setActiveStep(3)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-500/20 shrink-0"
              >
                <span>Avanzar a Exportación</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tabla de Resultados con Validación de Columnas */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-3 py-2.5">Fila</th>
                    <th className="px-3 py-2.5">Estado</th>
                    <th className="px-3 py-2.5">DNI (Username)</th>
                    <th className="px-3 py-2.5">Contraseña (Password)</th>
                    <th className="px-3 py-2.5">Nombre</th>
                    <th className="px-3 py-2.5">Apellido</th>
                    <th className="px-3 py-2.5">Correo Electrónico (Email)</th>
                    <th className="px-3 py-2.5">Curso (Course 1)</th>
                    <th className="px-3 py-2.5">Rol (Role 1)</th>
                    <th className="px-3 py-2.5">Diagnóstico / Errores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {filteredRows.slice(0, 100).map((r, idx) => (
                    <tr 
                      key={idx}
                      className={r._status === 'error' ? 'bg-rose-500/5 hover:bg-rose-500/10' : r._status === 'warning' ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                    >
                      <td className="px-3 py-2 text-slate-400 font-sans">{r._rowNum}</td>
                      <td className="px-3 py-2">
                        {r._status === 'error' && <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-500 font-sans font-bold">Error</span>}
                        {r._status === 'warning' && <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-500 font-sans font-medium">Revisar</span>}
                        {r._status === 'valid' && <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-500 font-sans">Apto</span>}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {r.username ? r.username : <span className="text-rose-500 italic">vacío</span>}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {r.password}
                      </td>
                      <td className="px-3 py-2 font-sans">
                        {r.firstname ? r.firstname : <span className="text-amber-500 italic">vacío</span>}
                      </td>
                      <td className="px-3 py-2 font-sans">
                        {r.lastname ? r.lastname : <span className="text-amber-500 italic">vacío</span>}
                      </td>
                      <td className="px-3 py-2">
                        {r.email ? (
                          <span className={!r.email.includes('@') ? 'text-rose-600 font-bold' : ''}>{r.email}</span>
                        ) : (
                          <span className="text-rose-500 italic">vacío</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-emerald-600 dark:text-emerald-400 font-semibold">{r.course1}</td>
                      <td className="px-3 py-2 text-blue-600 dark:text-blue-400">{r.role1}</td>
                      <td className="px-3 py-2 font-sans text-[11px]">
                        {r._errors && r._errors.length > 0 && (
                          <span className="text-rose-600 dark:text-rose-400 font-medium block">
                            {r._errors.join(', ')}
                          </span>
                        )}
                        {r._warnings && r._warnings.length > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 block">
                            {r._warnings.join(', ')}
                          </span>
                        )}
                        {(!r._errors?.length && !r._warnings?.length) && (
                          <span className="text-emerald-600 dark:text-emerald-400">Correcto</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredRows.length > 100 && (
              <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                Mostrando las primeras 100 filas de {filteredRows.length} para preservar la fluidez de renderizado en equipos de 32 bits.
              </div>
            )}
          </div>
        </div>
      )}

      {/* PASO 3: EXPORTACIÓN MOODLE */}
      {activeStep === 3 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Opciones de Exportación para Campus Virtual Moodle
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Todos los archivos se exportan estrictamente con codificación <strong>UTF-8 con BOM</strong> para garantizar compatibilidad con acentos y caracteres especiales en Moodle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Parámetros de Formato CSV
              </h4>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Separador de Columnas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDelimiter(';')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border ${
                      delimiter === ';'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Punto y coma (;) [Recomendado]
                  </button>
                  <button
                    onClick={() => setDelimiter(',')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border ${
                      delimiter === ','
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Coma (,)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tamaño de Lote por Archivo
                </label>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value={200}>200 filas por archivo (Servidores lentos)</option>
                  <option value={500}>500 filas por archivo (Estándar recomendado)</option>
                  <option value={1000}>1000 filas por archivo</option>
                  <option value={5000}>5000 filas por archivo</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Dividir en lotes evita que el servidor Moodle agote su tiempo de ejecución (PHP timeout).
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                  Descarga Inmediata
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Total de registros listos: <strong className="text-blue-600 dark:text-blue-400">{rows.length}</strong>
                </p>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p>• Curso: <span className="font-semibold text-slate-800 dark:text-slate-200">{defaultCourse}</span></p>
                  <p>• Rol: <span className="font-semibold text-slate-800 dark:text-slate-200">{defaultRole}</span></p>
                  <p>• Clave: <span className="font-mono text-slate-800 dark:text-slate-200">{defaultPasswordPattern}</span></p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDownloadZipBatches}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
                  <span>Descargar Paquete ZIP con Lotes ({Math.ceil(rows.length / batchSize)} archivos)</span>
                </button>

                <button
                  onClick={handleDownloadSingleCsv}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-700 transition-all"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Descargar Archivo CSV Único Completo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Componente Toast */}
      {toasts.length > 0 && (
        <Toast toasts={toasts} removeToast={removeToast} />
      )}
    </div>
  );
};
