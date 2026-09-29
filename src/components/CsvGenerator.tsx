import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_SAMPLE_CSV } from '../data/protocolData';
import { CsvRow } from '../types';
import { Toast, ToastMessage } from './Toast';
import { 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Table, 
  Upload, 
  Settings2, 
  ArrowRight, 
  FileUp,
  Check,
  History,
  Clock,
  Trash2,
  Wand2,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { sanitizeRow } from '../utils/sanitize';

export const CsvGenerator: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Step management persisted in localStorage: 1 = Upload, 2 = Mapping & Config, 3 = Preview & Download
  const [step, setStep] = useState<1 | 2 | 3>(() => {
    const saved = localStorage.getItem('esalud_csv_step');
    return saved ? JSON.parse(saved) : 1;
  });

  const [excelHeaders, setExcelHeaders] = useState<string[]>(() => {
    const saved = localStorage.getItem('esalud_excel_headers');
    return saved ? JSON.parse(saved) : [];
  });

  const [excelRows, setExcelRows] = useState<any[]>(() => {
    const saved = localStorage.getItem('esalud_excel_rows');
    return saved ? JSON.parse(saved) : [];
  });

  const [fileName, setFileName] = useState<string>(() => {
    return localStorage.getItem('esalud_file_name') || 'Planilla_ESalud.xlsx';
  });

  // Mapping state persisted in localStorage
  const [mapping, setMapping] = useState<{
    username: string;
    firstname: string;
    lastname: string;
    email: string;
  }>(() => {
    const saved = localStorage.getItem('esalud_mapping');
    return saved ? JSON.parse(saved) : { username: '', firstname: '', lastname: '', email: '' };
  });

  // Default password persisted in localStorage
  const [defaultPassword, setDefaultPassword] = useState<string>(() => {
    return localStorage.getItem('esalud_default_password') || 'Capacitaciones2026*';
  });

  // Course name persisted in localStorage
  const [courseName, setCourseName] = useState<string>(() => {
    return localStorage.getItem('esalud_course_name') || 'REDLAB2026';
  });

  // Group name (Grupo1) persisted in localStorage
  const [groupName, setGroupName] = useState<string>(() => {
    return localStorage.getItem('esalud_group_name') || '';
  });

  const [csvText, setCsvText] = useState<string>(() => {
    return localStorage.getItem('esalud_csv_text') || DEFAULT_SAMPLE_CSV;
  });

  // Error Summary Modal visibility
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);

  // Upload history (last 5 sessions) persisted in localStorage
  const [uploadHistory, setUploadHistory] = useState<Array<{
    id: string;
    date: string;
    fileName: string;
    recordCount: number;
    courseName: string;
    groupName?: string;
  }>>(() => {
    const saved = localStorage.getItem('esalud_upload_history');
    return saved ? JSON.parse(saved) : [];
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('esalud_csv_step', JSON.stringify(step));
  }, [step]);

  useEffect(() => {
    localStorage.setItem('esalud_excel_headers', JSON.stringify(excelHeaders));
  }, [excelHeaders]);

  useEffect(() => {
    localStorage.setItem('esalud_excel_rows', JSON.stringify(excelRows));
  }, [excelRows]);

  useEffect(() => {
    localStorage.setItem('esalud_file_name', fileName);
  }, [fileName]);

  useEffect(() => {
    localStorage.setItem('esalud_mapping', JSON.stringify(mapping));
  }, [mapping]);

  useEffect(() => {
    localStorage.setItem('esalud_default_password', defaultPassword);
  }, [defaultPassword]);

  useEffect(() => {
    localStorage.setItem('esalud_course_name', courseName);
  }, [courseName]);

  useEffect(() => {
    localStorage.setItem('esalud_group_name', groupName);
  }, [groupName]);

  useEffect(() => {
    localStorage.setItem('esalud_csv_text', csvText);
  }, [csvText]);

  useEffect(() => {
    localStorage.setItem('esalud_upload_history', JSON.stringify(uploadHistory));
  }, [uploadHistory]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        if (!data || data.length === 0) {
          addToast('El archivo Excel está vacío.', 'error');
          return;
        }

        processRawData(data);
        setStep(2);
        addToast(`Archivo "${file.name}" cargado y procesado exitosamente.`, 'success');
      } catch (err) {
        console.error(err);
        addToast('Error al leer el archivo Excel. Formato inválido.', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Smart detection of header row and columns in first 30 rows
  const processRawData = (data: any[][]) => {
    let headerIdx = 0;
    let maxScore = -1;

    const scanLimit = Math.min(data.length, 30);
    for (let i = 0; i < scanLimit; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      let score = 0;
      const rowStr = row.map(cell => String(cell || '').toLowerCase());
      
      if (rowStr.some(c => c.includes('dni') || c.includes('documento') || c.includes('usuario') || c.includes('cuil'))) score += 5;
      if (rowStr.some(c => c.includes('nombre') || c.includes('firstname'))) score += 3;
      if (rowStr.some(c => c.includes('apellido') || c.includes('lastname'))) score += 3;
      if (rowStr.some(c => c.includes('correo') || c.includes('email') || c.includes('mail'))) score += 3;

      if (score > maxScore) {
        maxScore = score;
        headerIdx = i;
      }
    }

    const headers = (data[headerIdx] || []).map((h, idx) => String(h || `Columna ${idx + 1}`).trim());
    setExcelHeaders(headers);

    const rows: any[] = [];
    for (let i = headerIdx + 1; i < data.length; i++) {
      const r = data[i];
      if (!r || r.length === 0) continue;
      const isNotEmpty = r.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
      if (isNotEmpty) {
        const obj: any = {};
        headers.forEach((h, hIdx) => {
          obj[h] = r[hIdx] !== undefined ? r[hIdx] : '';
        });
        rows.push(sanitizeRow(obj));
      }
    }
    setExcelRows(rows);
    autoMapColumns(headers, rows);
  };

  const autoMapColumns = (headers: string[], rows: any[]) => {
    let bestUsername = '';
    let bestFirstname = '';
    let bestLastname = '';
    let bestEmail = '';

    let foundByContent = false;
    for (const h of headers) {
      let matchCount = 0;
      const sampleCheckLimit = Math.min(rows.length, 10);
      for (let i = 0; i < sampleCheckLimit; i++) {
        const val = String(rows[i][h] || '').trim();
        if (/^\d{8}$/.test(val) || /^\d{7,8}$/.test(val)) {
          matchCount++;
        }
      }
      if (matchCount >= Math.min(2, sampleCheckLimit)) {
        bestUsername = h;
        foundByContent = true;
        break;
      }
    }

    if (!foundByContent) {
      for (const h of headers) {
        const lower = h.toLowerCase();
        if (
          lower.includes('dni') || 
          lower.includes('documento') || 
          lower.includes('cuil') || 
          lower.includes('cuit') || 
          lower.includes('legajo') || 
          lower.includes('matricula') || 
          lower.includes('username') || 
          lower.includes('usuario')
        ) {
          bestUsername = h;
          break;
        }
      }
    }

    for (const h of headers) {
      const lower = h.toLowerCase();
      if (!bestFirstname && (lower.includes('nombre') || lower.includes('firstname') || lower === 'name')) {
        bestFirstname = h;
      }
      if (!bestLastname && (lower.includes('apellido') || lower.includes('lastname') || lower === 'surname')) {
        bestLastname = h;
      }
      if (!bestEmail && (lower.includes('email') || lower.includes('e-mail') || lower.includes('correo') || lower.includes('mail'))) {
        bestEmail = h;
      }
    }

    if (!bestUsername && headers.length > 0) bestUsername = headers[0];
    if (!bestFirstname && headers.length > 1) bestFirstname = headers[1];
    if (!bestLastname && headers.length > 2) bestLastname = headers[2];
    if (!bestEmail && headers.length > 3) bestEmail = headers[3];

    setMapping({
      username: bestUsername,
      firstname: bestFirstname,
      lastname: bestLastname,
      email: bestEmail
    });
  };

  const sanitizeUsername = (val: string): string => {
    if (!val) return '';
    return String(val)
      .toLowerCase()
      .replace(/[.\-\s]/g, '')
      .trim();
  };

  const isValidDni = (val: string): boolean => {
    const cleaned = String(val || '').trim().replace(/[.\-\s]/g, '');
    return /^\d{8}$/.test(cleaned);
  };

  const isValidEmail = (email: string): boolean => {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const fixEmailTypo = (email: string): { corrected: string; wasFixed: boolean } => {
    if (!email) return { corrected: '', wasFixed: false };
    let cleaned = email.trim().toLowerCase();
    let wasFixed = false;

    const typos: Record<string, string> = {
      'gmail.con': 'gmail.com',
      'gamil.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'hotmial.com': 'hotmail.com',
      'hotmai.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
      'outook.com': 'outlook.com',
      'yahoo.con': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      '.comm': '.com'
    };

    for (const [typo, correct] of Object.entries(typos)) {
      if (cleaned.endsWith(typo) || cleaned.includes(typo)) {
        cleaned = cleaned.replace(typo, correct);
        wasFixed = true;
      }
    }

    return { corrected: cleaned, wasFixed };
  };

  const handleAutoFixEmails = () => {
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) return;

    let fixedCount = 0;
    const newLines = [lines[0]];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(';');
      if (parts.length > 4) {
        let email = parts[4].replace(/^"|"$/g, '').trim();
        const { corrected, wasFixed } = fixEmailTypo(email);
        if (wasFixed) {
          parts[4] = `"${corrected}"`;
          fixedCount++;
        }
      }
      newLines.push(parts.join(';'));
    }

    if (fixedCount > 0) {
      setCsvText(newLines.join('\n'));
      addToast(`Se autocorrigieron ${fixedCount} errores tipográficos en correos electrónicos.`, 'success');
    } else {
      addToast('No se detectaron errores tipográficos comunes en los correos electrónicos.', 'info');
    }
  };

  const countFailedRows = (): number => {
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) return 0;
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const rawValues = lines[i].split(';').map(v => v.replace(/^"|"$/g, '').trim());
      const username = rawValues[0] || '';
      const email = rawValues[4] || '';
      if (!isValidDni(username) || !isValidEmail(email)) {
        count++;
      }
    }
    return count;
  };

  const handleDownloadFailedCsv = () => {
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) return;

    const header = lines[0];
    const failedLines = [header];

    for (let i = 1; i < lines.length; i++) {
      const rawValues = lines[i].split(';').map(v => v.replace(/^"|"$/g, '').trim());
      const username = rawValues[0] || '';
      const email = rawValues[4] || '';

      if (!isValidDni(username) || !isValidEmail(email)) {
        failedLines.push(lines[i]);
      }
    }

    if (failedLines.length <= 1) {
      addToast('No hay registros con errores para exportar.', 'info');
      return;
    }

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + failedLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `registros_con_errores_esalud_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Se exportaron ${failedLines.length - 1} registros con errores para corrección.`, 'success');
  };

  const fixEncodingAndAccents = (str: string): string => {
    if (!str) return '';
    let cleaned = String(str)
      .replace(/([aeiouáéíóú])['’]([aeiou])/gi, (match, v1, v2) => {
        const accents: Record<string, string> = {
          'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú'
        };
        return v1.toLowerCase() + (accents[v2.toLowerCase()] || v2);
      })
      .replace(/anal['’]ia/gi, 'Analía')
      .replace(/anal['’]a/gi, 'Analía')
      .replace(/mar['’]ia/gi, 'María')
      .replace(/n['’]estor/gi, 'Néstor')
      .replace(/angel['’]ica/gi, 'Angélica')
      .replace(/m[oó]['’]nica/gi, 'Mónica');

    try {
      cleaned = cleaned.normalize('NFC');
    } catch (e) {
      // ignore
    }

    return cleaned;
  };

  const toTitleCase = (str: string): string => {
    if (!str) return '';
    const fixed = fixEncodingAndAccents(str);
    return fixed
      .toLowerCase()
      .split(' ')
      .map(word => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  // Generate CSV with strict required fields validation & Toast notifications
  const handleGenerateCsv = () => {
    if (!mapping.username || !mapping.firstname || !mapping.lastname || !mapping.email) {
      addToast('Error: Todos los campos del mapeo (DNI, Nombre, Apellido y Correo) son obligatorios.', 'error');
      return;
    }

    if (!defaultPassword.trim()) {
      addToast('Error: La contraseña predeterminada es obligatoria.', 'error');
      return;
    }

    if (!courseName.trim()) {
      addToast('Error: El nombre del curso es obligatorio.', 'error');
      return;
    }

    const headerLine = groupName.trim() 
      ? 'username;password;firstname;lastname;email;course1;group1'
      : 'username;password;firstname;lastname;email;course1';
    
    const lines: string[] = [headerLine];

    excelRows.forEach((r) => {
      let rawUser = String(r[mapping.username] || '').trim();
      let firstname = toTitleCase(String(r[mapping.firstname] || '').trim());
      let lastname = toTitleCase(String(r[mapping.lastname] || '').trim());
      let email = String(r[mapping.email] || '').trim().toLowerCase();

      let username = sanitizeUsername(rawUser);

      if (!username && firstname && lastname) {
        username = sanitizeUsername(`${firstname}${lastname}`);
      }
      if (!username) return;

      const password = defaultPassword.trim();
      const course = courseName.trim();
      const group = groupName.trim();

      const escapedLine = group 
        ? `"${username}";"${password}";"${firstname}";"${lastname}";"${email}";"${course}";"${group}"`
        : `"${username}";"${password}";"${firstname}";"${lastname}";"${email}";"${course}"`;

      lines.push(escapedLine);
    });

    setCsvText(lines.join('\n'));
    setStep(3);

    // Save to upload history (last 5 sessions)
    const newSession = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      fileName: fileName || 'Planilla_Excel.xlsx',
      recordCount: excelRows.length,
      courseName: courseName.trim(),
      groupName: groupName.trim() || undefined
    };
    setUploadHistory(prev => [newSession, ...prev.filter(s => s.fileName !== newSession.fileName)].slice(0, 5));

    addToast('Archivo CSV generado y validado con éxito.', 'success');
  };

  // Parse CSV text for validation and preview in Step 3
  const parseCsvText = (text: string) => {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length <= 1) return { rows: [], errors: [], typoCount: 0 };

    const headers = lines[0].split(';').map(h => h.replace(/^"|"$/g, '').trim());
    const hasGroup = headers.includes('group1');

    const rows: CsvRow[] = [];
    const errors: string[] = [];
    const emailSet = new Set<string>();
    const userSet = new Set<string>();
    let typoCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const rawValues = lines[i].split(';').map(v => v.replace(/^"|"$/g, '').trim());
      const username = rawValues[0] || '';
      const password = rawValues[1] || '';
      const firstname = rawValues[2] || '';
      const lastname = rawValues[3] || '';
      const email = rawValues[4] || '';
      const course1 = rawValues[5] || '';
      const group1 = hasGroup ? rawValues[6] || '' : '';

      if (!username || !isValidDni(username)) {
        errors.push(`Línea ${i}: DNI (Username) no válido (debe tener exactamente 8 dígitos numéricos: "${username}").`);
      }

      if (!email || !isValidEmail(email)) {
        const { wasFixed } = fixEmailTypo(email);
        if (wasFixed) {
          typoCount++;
          errors.push(`Línea ${i}: Correo con posible error tipográfico (${email}).`);
        } else {
          errors.push(`Línea ${i}: Correo electrónico inválido (${email || 'vacío'}).`);
        }
      }

      if (email && email !== `${username}@noreply.com`) {
        if (emailSet.has(email)) {
          errors.push(`Línea ${i}: Advertencia de correo duplicado (${email}).`);
        }
        emailSet.add(email);
      }

      if (userSet.has(username)) {
        errors.push(`Línea ${i}: DNI (Username) duplicado (${username}).`);
      }
      userSet.add(username);

      rows.push({
        username,
        password,
        firstname,
        lastname,
        email,
        course1,
        group1
      });
    }

    return { rows, errors, typoCount };
  };

  const parsedResult = parseCsvText(csvText);

  const handleDownload = () => {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `matriculacion_esalud_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Archivo CSV descargado correctamente.', 'success');
  };

  const handleResetAll = () => {
    localStorage.removeItem('esalud_csv_step');
    localStorage.removeItem('esalud_excel_headers');
    localStorage.removeItem('esalud_excel_rows');
    localStorage.removeItem('esalud_mapping');
    localStorage.removeItem('esalud_csv_text');
    localStorage.removeItem('esalud_file_name');
    setStep(1);
    setExcelHeaders([]);
    setExcelRows([]);
    setMapping({ username: '', firstname: '', lastname: '', email: '' });
    setCsvText(DEFAULT_SAMPLE_CSV);
    addToast('Se ha reiniciado la sesión correctamente.', 'info');
  };

  const clearHistory = () => {
    setUploadHistory([]);
    localStorage.removeItem('esalud_upload_history');
    addToast('Historial de cargas borrado.', 'info');
  };

  return (
    <div className="space-y-8 pb-12 relative">
      {/* Toast Container */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-blue-900/50">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-4">
          Subida por Lotes (Batch Upload con Persistencia & Historial)
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
          Procesador Inteligente de Excel para ESalud
        </h2>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Cargue su planilla institucional (.xls o .xlsx). El sistema guarda automáticamente su progreso, mapeos e histórico de sesiones en el navegador.
        </p>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-slate-800 text-xs font-medium">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>1</span>
            <span>Cargar Archivo Excel</span>
          </div>
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>2</span>
            <span>Mapeo y Configuración</span>
          </div>
          <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>3</span>
            <span>Resultado y Exportación CSV</span>
          </div>
        </div>
      </div>

      {/* STEP 1: CARGAR ARCHIVO */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6 text-center">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center border border-blue-100 dark:border-blue-900">
              <FileUp className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Subir Archivo Excel (.xls o .xlsx)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Arrastre y suelte su planilla o seleccione un archivo. Su sesión se guardará automáticamente.
            </p>

            <div className="pt-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 mx-auto"
              >
                <Upload className="w-4 h-4" />
                <span>Seleccionar Archivo Excel</span>
              </button>
            </div>

            {excelRows.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setStep(2);
                    addToast('Sesión anterior restaurada.', 'info');
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center justify-center space-x-1 mx-auto"
                >
                  <span>Restaurar última sesión guardada ({excelRows.length} registros - {fileName})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: CONFIGURAR ASOCIACIÓN (MAPEO INTELIGENTE) */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mapping Controls */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Settings2 className="w-5 h-5 text-blue-600" />
                <span>Mapeo Inteligente</span>
              </h3>
              <span className="text-xs bg-emerald-500/10 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">
                {excelRows.length} regs
              </span>
            </div>

            <p className="text-xs text-slate-500 font-mono">Archivo: {fileName}</p>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  DNI / Username (Requerido) *
                </label>
                <select
                  value={mapping.username}
                  onChange={e => setMapping({ ...mapping, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Seleccione columna DNI</option>
                  {excelHeaders.map((h, i) => (
                    <option key={i} value={h}>{h}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-0.5">Debe tener 8 dígitos numéricos.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Nombre (Requerido) *
                </label>
                <select
                  value={mapping.firstname}
                  onChange={e => setMapping({ ...mapping, firstname: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Seleccione columna Nombre</option>
                  {excelHeaders.map((h, i) => (
                    <option key={i} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Apellido (Requerido) *
                </label>
                <select
                  value={mapping.lastname}
                  onChange={e => setMapping({ ...mapping, lastname: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Seleccione columna Apellido</option>
                  {excelHeaders.map((h, i) => (
                    <option key={i} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Correo Electrónico (Requerido) *
                </label>
                <select
                  value={mapping.email}
                  onChange={e => setMapping({ ...mapping, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Seleccione columna Correo *</option>
                  {excelHeaders.map((h, i) => (
                    <option key={i} value={h}>{h}</option>
                  ))}
                </select>
                <p className="text-[11px] text-red-500 mt-0.5">Obligatorio: No puede faltar.</p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Contraseña Predeterminada *
                  </label>
                  <input
                    type="text"
                    required
                    value={defaultPassword}
                    onChange={e => setDefaultPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">Obligatorio (Guardado en navegador).</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Nombre del curso *
                  </label>
                  <input
                    type="text"
                    required
                    value={courseName}
                    onChange={e => setCourseName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">Obligatorio (Course1 en Moodle).</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Grupo1 (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: ComisionA_2026"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">Nombre del grupo para acción masiva.</p>
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-all"
                >
                  Volver
                </button>
                <button
                  onClick={handleGenerateCsv}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all flex items-center justify-center space-x-2 shadow-md shadow-blue-600/30"
                >
                  <span>Generar Archivo CSV</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Raw Data Preview Table */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Table className="w-5 h-5 text-blue-600" />
              <span>Previsualización del Archivo Excel Cargado ({fileName})</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Mostrando las primeras filas leídas del archivo. Las celdas con DNI inválido mostrarán una advertencia.
            </p>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                    <th className="p-2.5 font-semibold">#</th>
                    {excelHeaders.map((h, i) => (
                      <th key={i} className={`p-2.5 font-semibold ${h === mapping.username || h === mapping.firstname || h === mapping.lastname || h === mapping.email ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-950/30' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {excelRows.slice(0, 25).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2.5 text-slate-400 font-medium">{idx + 1}</td>
                      {excelHeaders.map((h, hIdx) => {
                        const cellVal = String(row[h] || '');
                        const isDniCol = h === mapping.username;
                        const isDniValid = !isDniCol || isValidDni(cellVal);
                        return (
                          <td key={hIdx} className={`p-2.5 text-slate-700 dark:text-slate-300 ${isDniCol ? 'font-mono' : ''}`}>
                            <div className="flex items-center space-x-1.5">
                              <span>{cellVal}</span>
                              {isDniCol && !isDniValid && (
                                <span title="DNI no válido: Debe ser numérico y tener exactamente 8 dígitos" className="inline-flex items-center text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900 shrink-0">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span className="text-[10px] ml-1 font-sans">No 8 dígitos</span>
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: RESULTADO Y DESCARGA */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Export Actions & Summary */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Exportación Lista</span>
              </h3>

              <div className="space-y-4 text-sm">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Total Registros:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{parsedResult.rows.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Archivo Origen:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{fileName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Codificación:</span>
                    <span className="font-mono text-emerald-600 font-bold">UTF-8 con BOM</span>
                  </div>
                </div>

                {parsedResult.typoCount > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-xl space-y-3">
                    <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{parsedResult.typoCount} correos con errores tipográficos detectados</span>
                    </div>
                    <button
                      onClick={handleAutoFixEmails}
                      className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Auto-corregir sugeridos</span>
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Editor de Texto CSV (Raw):
                  </label>
                  <textarea
                    value={csvText}
                    onChange={e => setCsvText(e.target.value)}
                    rows={6}
                    className="w-full font-mono text-[11px] p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar .CSV para Moodle</span>
                  </button>

                  {countFailedRows() > 0 && (
                    <button
                      onClick={handleDownloadFailedCsv}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-all flex items-center justify-center space-x-2 shadow-md shadow-amber-600/30"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Exportar solo registros con errores ({countFailedRows()})</span>
                    </button>
                  )}

                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={handleResetAll}
                      className="w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-all flex items-center justify-center space-x-1.5"
                      title="Reiniciar y limpiar almacenamiento local"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reiniciar Sesión</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Validation & Preview Table */}
            <div className="lg:col-span-2 space-y-6">
              {/* Validation Box */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Estado de Validación Moodle & Correos:</h4>
                  <div className="flex items-center space-x-2">
                    {parsedResult.errors.length > 0 && (
                      <button
                        onClick={() => setShowErrorModal(true)}
                        className="text-xs bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 font-semibold px-3 py-1 rounded-lg border border-blue-500/20 flex items-center space-x-1 transition-all"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Ver Resumen de Errores ({parsedResult.errors.length})</span>
                      </button>
                    )}
                    {parsedResult.typoCount > 0 && (
                      <button
                        onClick={handleAutoFixEmails}
                        className="text-xs bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 font-semibold px-3 py-1 rounded-lg border border-amber-500/20 flex items-center space-x-1 transition-all"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Auto-corregir ({parsedResult.typoCount})</span>
                      </button>
                    )}
                  </div>
                </div>

                {parsedResult.errors.length === 0 ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-3.5 rounded-xl flex items-center space-x-3 text-emerald-800 dark:text-emerald-300 text-sm">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Todos los registros están limpios y listos para importar sin conflictos.</span>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-xl space-y-2 text-amber-900 dark:text-amber-200 text-sm">
                    <div className="flex items-center space-x-2 font-semibold justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <span>Observaciones detectadas ({parsedResult.errors.length}):</span>
                      </div>
                      <button
                        onClick={() => setShowErrorModal(true)}
                        className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                      >
                        Abrir Modal de Resumen &rarr;
                      </button>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs max-h-32 overflow-y-auto">
                      {parsedResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Table Preview */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Vista Previa Tabular ({parsedResult.rows.length} usuarios)
                </h3>
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                        <th className="p-2 font-semibold">#</th>
                        <th className="p-2 font-semibold">Username (DNI)</th>
                        <th className="p-2 font-semibold">Password</th>
                        <th className="p-2 font-semibold">Nombre</th>
                        <th className="p-2 font-semibold">Apellido</th>
                        <th className="p-2 font-semibold">Email</th>
                        <th className="p-2 font-semibold">Course1</th>
                        {groupName && <th className="p-2 font-semibold">Group1</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedResult.rows.map((row, idx) => {
                        const { corrected: fixedEmail, wasFixed } = fixEmailTypo(row.email);
                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-2.5 px-2 text-slate-400 font-medium">{idx + 1}</td>
                            <td className="py-2.5 px-2 font-mono font-semibold">
                              <div className="flex items-center space-x-1.5">
                                <span className={isValidDni(row.username) ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}>
                                  {row.username}
                                </span>
                                {!isValidDni(row.username) && (
                                  <span title="DNI no válido: Debe ser numérico y tener exactamente 8 dígitos" className="inline-flex items-center text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span className="text-[10px] ml-1 font-sans">DNI Inválido</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 font-mono text-slate-500">{row.password}</td>
                            <td className="py-2.5 px-2 text-slate-800 dark:text-slate-200">{row.firstname}</td>
                            <td className="py-2.5 px-2 text-slate-800 dark:text-slate-200">{row.lastname}</td>
                            <td className="py-2.5 px-2 font-mono">
                              {isValidEmail(row.email) ? (
                                <span className="text-slate-600 dark:text-slate-400">{row.email}</span>
                              ) : wasFixed ? (
                                <span className="inline-flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 rounded px-2 py-0.5" title={`Sugerencia: corregir a ${fixedEmail}`}>
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>{row.email} (Sugerido: {fixedEmail})</span>
                                </span>
                              ) : (
                                <span className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 rounded px-2 py-0.5 inline-flex items-center space-x-1 font-semibold" title="Formato de correo electrónico inválido">
                                  <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                                  <span>{row.email || '(Vacío)'}</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 font-mono text-emerald-600 dark:text-emerald-400">{row.course1}</td>
                            {groupName && <td className="py-2.5 px-2 font-mono text-purple-600 dark:text-purple-400">{row.group1}</td>}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* HISTORIAL DE ÚLTIMAS 5 SESIONES EXITOSAS */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <History className="w-5 h-5 text-blue-600" />
                <span>Historial de Sesiones Exitosas (Últimas 5)</span>
              </h3>
              {uploadHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar Historial</span>
                </button>
              )}
            </div>

            {uploadHistory.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                Aún no hay registros en el historial de cargas exitosas.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
                      <th className="p-3 font-semibold">Fecha y Hora</th>
                      <th className="p-3 font-semibold">Archivo Origen</th>
                      <th className="p-3 font-semibold">Registros</th>
                      <th className="p-3 font-semibold">Curso (Course1)</th>
                      <th className="p-3 font-semibold">Grupo1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {uploadHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{item.date}</span>
                        </td>
                        <td className="p-3 font-medium text-slate-900 dark:text-white font-mono">{item.fileName}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600">{item.recordCount}</td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{item.courseName}</td>
                        <td className="p-3 font-mono text-purple-600 dark:text-purple-400">{item.groupName || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ERROR SUMMARY & QUICK FIX MODAL */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resumen de Errores & Corrección Rápida</h3>
                  <p className="text-xs text-slate-500">Revise y aplique correcciones a los registros detectados antes de la exportación.</p>
                </div>
              </div>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-200 text-xs">Acción Rápida Disponible</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">Se detectaron {parsedResult.typoCount} correos con errores de dominio comunes (.con, .gmal, etc.).</p>
                </div>
                {parsedResult.typoCount > 0 && (
                  <button
                    onClick={() => {
                      handleAutoFixEmails();
                      addToast('Correcciones aplicadas desde el modal.', 'success');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-md transition-all flex items-center space-x-1.5 shrink-0"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>Aplicar Todas ({parsedResult.typoCount})</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Detalle de Observaciones ({parsedResult.errors.length}):</h4>
                {parsedResult.errors.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-semibold py-4 text-center">¡No hay errores reportados!</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {parsedResult.errors.map((err, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-mono">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="flex-1">{err}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end space-x-3">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all shadow-md"
              >
                Cerrar e Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
