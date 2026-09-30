import React, { useState, useRef } from 'react';
import { 
  FileCheck2, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  FileDown, 
  FileSpreadsheet, 
  Wand2, 
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Archive
} from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { Toast, ToastMessage } from './Toast';
import { cleanDni, cleanEmail, validateEmail } from '../utils/sanitize';

interface AuditIssue {
  row: number;
  column: string;
  value: string;
  type: 'error' | 'warning';
  message: string;
}

export const CsvAuditor: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [delimiter, setDelimiter] = useState<string>(';');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [issues, setIssues] = useState<AuditIssue[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'error' | 'warning'>('all');
  const [batchSize, setBatchSize] = useState<number>(500);
  const [isAudited, setIsAudited] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const detectDelimiter = (text: string): string => {
    const firstLine = text.trim().split('\n')[0] || '';
    const semicolons = (firstLine.match(/;/g) || []).length;
    const commas = (firstLine.match(/,/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;
    const pipes = (firstLine.match(/\|/g) || []).length;

    if (semicolons >= commas && semicolons >= tabs && semicolons >= pipes && semicolons > 0) return ';';
    if (commas >= semicolons && commas >= tabs && commas > 0) return ',';
    if (tabs > 0) return '\t';
    if (pipes > 0) return '|';
    return ';';
  };

  const parseAndAuditCsv = (text: string, customDelimiter?: string) => {
    if (!text || !text.trim()) {
      addToast('El archivo o texto está vacío.', 'error');
      return;
    }

    const delim = customDelimiter || detectDelimiter(text);
    setDelimiter(delim);

    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) {
      addToast('El archivo debe tener al menos una cabecera y una fila de datos.', 'error');
      return;
    }

    const headerCols = lines[0].split(delim).map(h => h.replace(/^["']|["']$/g, '').trim());
    setHeaders(headerCols);

    const dataRows: string[][] = [];
    const auditIssues: AuditIssue[] = [];

    const usernameIdx = headerCols.findIndex(h => /^(username|dni|usuario|documento)$/i.test(h));
    const firstnameIdx = headerCols.findIndex(h => /^(firstname|nombre)$/i.test(h));
    const lastnameIdx = headerCols.findIndex(h => /^(lastname|apellido)$/i.test(h));
    const emailIdx = headerCols.findIndex(h => /^(email|correo|mail)$/i.test(h));
    const course1Idx = headerCols.findIndex(h => /^(course1|curso1|course)$/i.test(h));
    const passwordIdx = headerCols.findIndex(h => /^(password|clave|contrase[nñ]a)$/i.test(h));

    // Check essential headers
    if (usernameIdx === -1) {
      auditIssues.push({
        row: 1,
        column: 'Cabecera',
        value: 'Falta username/dni',
        type: 'error',
        message: 'No se detectó la columna obligatoria "username" o "dni".'
      });
    }
    if (firstnameIdx === -1) {
      auditIssues.push({
        row: 1,
        column: 'Cabecera',
        value: 'Falta firstname/nombre',
        type: 'error',
        message: 'No se detectó la columna obligatoria "firstname" o "nombre".'
      });
    }
    if (lastnameIdx === -1) {
      auditIssues.push({
        row: 1,
        column: 'Cabecera',
        value: 'Falta lastname/apellido',
        type: 'error',
        message: 'No se detectó la columna obligatoria "lastname" o "apellido".'
      });
    }
    if (emailIdx === -1) {
      auditIssues.push({
        row: 1,
        column: 'Cabecera',
        value: 'Falta email/correo',
        type: 'error',
        message: 'No se detectó la columna obligatoria "email" o "correo".'
      });
    }
    if (course1Idx === -1) {
      auditIssues.push({
        row: 1,
        column: 'Cabecera',
        value: 'Falta course1',
        type: 'warning',
        message: 'No se detectó la columna "course1". Moodle creará usuarios sin matricularlos en cursos.'
      });
    }

    const userSet = new Map<string, number>();
    const emailSet = new Map<string, number>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cells = line.split(delim).map(c => c.replace(/^["']|["']$/g, '').trim());
      dataRows.push(cells);

      const rowNum = i + 1;

      // Row length mismatch
      if (cells.length !== headerCols.length) {
        auditIssues.push({
          row: rowNum,
          column: 'Estructura',
          value: `${cells.length} columnas (esperadas ${headerCols.length})`,
          type: 'error',
          message: `La fila tiene ${cells.length} columnas en lugar de ${headerCols.length}. Posible coma o punto y coma dentro de un texto sin comillas.`
        });
      }

      // Check username / DNI
      if (usernameIdx !== -1) {
        const uVal = cells[usernameIdx] || '';
        const cleanU = cleanDni(uVal);
        if (!uVal) {
          auditIssues.push({
            row: rowNum,
            column: headerCols[usernameIdx],
            value: '(Vacío)',
            type: 'error',
            message: 'El nombre de usuario (DNI) está vacío.'
          });
        } else if (!/^\d{7,8}$/.test(cleanU)) {
          auditIssues.push({
            row: rowNum,
            column: headerCols[usernameIdx],
            value: uVal,
            type: 'warning',
            message: `El DNI "${uVal}" no tiene entre 7 y 8 dígitos numéricos válidos.`
          });
        }

        if (cleanU) {
          if (userSet.has(cleanU)) {
            auditIssues.push({
              row: rowNum,
              column: headerCols[usernameIdx],
              value: uVal,
              type: 'error',
              message: `DNI / Username duplicado. Ya apareció en la fila ${userSet.get(cleanU)}.`
            });
          } else {
            userSet.set(cleanU, rowNum);
          }
        }
      }

      // Check firstname & lastname
      if (firstnameIdx !== -1 && !cells[firstnameIdx]) {
        auditIssues.push({
          row: rowNum,
          column: headerCols[firstnameIdx],
          value: '(Vacío)',
          type: 'error',
          message: 'El nombre está vacío.'
        });
      }

      if (lastnameIdx !== -1 && !cells[lastnameIdx]) {
        auditIssues.push({
          row: rowNum,
          column: headerCols[lastnameIdx],
          value: '(Vacío)',
          type: 'error',
          message: 'El apellido está vacío.'
        });
      }

      // Check email
      if (emailIdx !== -1) {
        const eVal = cells[emailIdx] || '';
        if (!eVal) {
          auditIssues.push({
            row: rowNum,
            column: headerCols[emailIdx],
            value: '(Vacío)',
            type: 'error',
            message: 'El correo electrónico está vacío.'
          });
        } else if (!validateEmail(eVal)) {
          auditIssues.push({
            row: rowNum,
            column: headerCols[emailIdx],
            value: eVal,
            type: 'error',
            message: `Formato de correo inválido: "${eVal}".`
          });
        } else {
          const cleanE = cleanEmail(eVal);
          if (cleanE !== `${cells[usernameIdx]}@noreply.com`) {
            if (emailSet.has(cleanE)) {
              auditIssues.push({
                row: rowNum,
                column: headerCols[emailIdx],
                value: eVal,
                type: 'warning',
                message: `Correo duplicado. Ya registrado en la fila ${emailSet.get(cleanE)}.`
              });
            } else {
              emailSet.set(cleanE, rowNum);
            }
          }
        }
      }
    }

    setRows(dataRows);
    setIssues(auditIssues);
    setIsAudited(true);

    const errorCount = auditIssues.filter(iss => iss.type === 'error').length;
    if (errorCount === 0) {
      addToast(`Auditoría completada: ${dataRows.length} registros analizados sin errores críticos.`, 'success');
    } else {
      addToast(`Auditoría completada: Se encontraron ${errorCount} errores críticos que deben resolverse.`, 'warning');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = String(evt.target?.result || '');
      setRawText(content);
      parseAndAuditCsv(content);
    };
    reader.readAsText(file, 'utf-8');
  };

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const totalRows = rows.length;
  const healthScore = totalRows > 0 
    ? Math.max(0, Math.round(100 - (errorCount * 15 + warningCount * 3) / Math.max(1, totalRows / 10))) 
    : 100;

  const filteredIssues = issues.filter(i => {
    if (filterType === 'error') return i.type === 'error';
    if (filterType === 'warning') return i.type === 'warning';
    return true;
  });

  const handleDownloadExcelReport = () => {
    if (!isAudited || issues.length === 0) {
      addToast('No hay observaciones para exportar.', 'info');
      return;
    }

    const reportData = issues.map(iss => ({
      'Fila': iss.row,
      'Columna': iss.column,
      'Tipo de Observación': iss.type === 'error' ? 'ERROR CRÍTICO' : 'ADVERTENCIA',
      'Valor Detectado': iss.value,
      'Diagnóstico / Solución': iss.message
    }));

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Auditoría');
    XLSX.writeFile(wb, `auditoria_moodle_${new Date().toISOString().slice(0, 10)}.xlsx`);
    addToast('Reporte de auditoría Excel descargado.', 'success');
  };

  const handleDownloadBatchesZip = async () => {
    if (!rawText.trim() || rows.length === 0) {
      addToast('No hay datos para segmentar en lotes.', 'error');
      return;
    }

    const zip = new JSZip();
    const BOM = '\uFEFF';
    const lines = rawText.trim().split('\n');
    const header = lines[0];
    const dataLines = lines.slice(1);

    const totalBatches = Math.ceil(dataLines.length / batchSize);

    for (let b = 0; b < totalBatches; b++) {
      const chunk = dataLines.slice(b * batchSize, (b + 1) * batchSize);
      const batchCsv = BOM + [header, ...chunk].join('\n');
      const batchFileName = `lote_${b + 1}_de_${totalBatches}_(${chunk.length}_alumnos).csv`;
      zip.file(batchFileName, batchCsv);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lotes_matriculacion_${totalBatches}_archivos.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Archivo ZIP generado con ${totalBatches} lotes numerados.`, 'success');
  };

  return (
    <div className="space-y-8 pb-12">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-4">
          Auditoría de Calidad & Segmentador de Lotes
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
          Diagnóstico y Auditor de Archivos CSV Moodle
        </h2>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Arrastre o pegue cualquier archivo CSV para auditar su compatibilidad con el Campus Virtual Moodle antes de subirlo, detectar duplicados y segmentar en lotes seguros.
        </p>
      </div>

      {/* Upload or Paste Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Cargar CSV para Diagnóstico</h3>
              <p className="text-xs text-slate-500">Detecta automáticamente delimitadores (, ; \t |) y codificación</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Cargar Archivo CSV</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
            O pegue el contenido de texto CSV directamente:
          </label>
          <textarea
            value={rawText}
            onChange={e => {
              setRawText(e.target.value);
              if (e.target.value.trim()) {
                parseAndAuditCsv(e.target.value);
              }
            }}
            placeholder={`username;password;firstname;lastname;email;course1\n35123456;Capacitacion2026*;Juan;Pérez;juan.perez@salud.mendoza.gov.ar;REDLAB2026`}
            rows={5}
            className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Audit Results Dashboard */}
      {isAudited && (
        <div className="space-y-6">
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Puntaje de Calidad</span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className={`text-3xl font-extrabold ${healthScore >= 90 ? 'text-emerald-500' : healthScore >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                  {healthScore}%
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Registros</span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {rows.length}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Errores Críticos</span>
              <div className="text-3xl font-extrabold text-red-600 dark:text-red-400 mt-2">
                {errorCount}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Advertencias</span>
              <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
                {warningCount}
              </div>
            </div>
          </div>

          {/* Batch Splitter Tool Box */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Segmentador de Lotes Masivos (Evitar Timeout de Moodle)</span>
              </h4>
              <p className="text-xs text-slate-500">
                Divide planillas grandes en archivos más pequeños listos para subir individualmente sin saturar el servidor.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Tamaño de lote:</span>
                <select
                  value={batchSize}
                  onChange={e => setBatchSize(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                >
                  <option value={100}>100 alumnos</option>
                  <option value={250}>250 alumnos</option>
                  <option value={500}>500 alumnos (Recomendado)</option>
                  <option value={1000}>1000 alumnos</option>
                </select>
              </div>

              <button
                onClick={handleDownloadBatchesZip}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 transition-all"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Descargar Lotes en ZIP</span>
              </button>
            </div>
          </div>

          {/* Issues List & Diagnostic Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Detalle de Observaciones Encontradas ({issues.length})
                </h4>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-md transition-all ${filterType === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    Todos ({issues.length})
                  </button>
                  <button
                    onClick={() => setFilterType('error')}
                    className={`px-2.5 py-1 rounded-md transition-all ${filterType === 'error' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    Errores ({errorCount})
                  </button>
                  <button
                    onClick={() => setFilterType('warning')}
                    className={`px-2.5 py-1 rounded-md transition-all ${filterType === 'warning' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    Alertas ({warningCount})
                  </button>
                </div>

                {issues.length > 0 && (
                  <button
                    onClick={handleDownloadExcelReport}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Reporte Excel (.xlsx)</span>
                  </button>
                )}
              </div>
            </div>

            {issues.length === 0 ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl flex items-center space-x-3 text-emerald-800 dark:text-emerald-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>¡Excelente! El archivo cumple con el 100% de las normas de matriculación masiva Moodle.</span>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                      <th className="p-2.5 font-semibold">Fila</th>
                      <th className="p-2.5 font-semibold">Columna</th>
                      <th className="p-2.5 font-semibold">Severidad</th>
                      <th className="p-2.5 font-semibold">Valor Detectado</th>
                      <th className="p-2.5 font-semibold">Motivo y Solución Sugerida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredIssues.map((iss, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-mono text-slate-500 font-semibold">{iss.row}</td>
                        <td className="p-2.5 font-mono text-indigo-600 dark:text-indigo-400 font-medium">{iss.column}</td>
                        <td className="p-2.5">
                          {iss.type === 'error' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                              ERROR CRÍTICO
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                              ADVERTENCIA
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300 truncate max-w-xs">{iss.value}</td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300">{iss.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
