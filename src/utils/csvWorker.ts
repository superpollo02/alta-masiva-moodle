import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { cleanDni, cleanEmail, validateEmail, toTitleCase, splitFullName, sanitizeCell } from './sanitize';

export interface ColumnMapping {
  usernameCol?: string;
  firstnameCol?: string;
  lastnameCol?: string;
  fullNameCol?: string;
  emailCol?: string;
  courseCol?: string;
  roleCol?: string;
  passwordCol?: string;
}

export interface WorkerParseMessage {
  type: 'PARSE_FILE';
  fileData: ArrayBuffer;
  fileName: string;
  defaultPassword?: string;
  defaultCourse?: string;
  defaultRole?: string;
  mapping?: ColumnMapping;
}

export interface WorkerReAuditMessage {
  type: 'RE_AUDIT';
  mapping: ColumnMapping;
  defaultPassword?: string;
  defaultCourse?: string;
  defaultRole?: string;
}

export interface WorkerZipMessage {
  type: 'GENERATE_ZIP';
  rows: any[];
  batchSize: number;
  delimiter: string;
  baseFileName: string;
}

export interface AuditSummary {
  totalRows: number;
  validRows: number;
  warningCount: number;
  errorCount: number;
  duplicateEmails: number;
  duplicateUsernames: number;
  emptyDniCount: number;
  emptyEmailCount: number;
  invalidEmailCount: number;
  unalignedCount: number;
}

let cachedRawRows: Record<string, any>[] = [];
let cachedHeaders: string[] = [];

function generatePassword(pattern: string | undefined, username: string): string {
  const pat = pattern?.trim() || '{dni}*Mendoza';
  if (pat.includes('{dni}')) {
    return pat.replace(/\{dni\}/gi, username || '12345678');
  }
  return pat;
}

function auditData(
  rawRows: Record<string, any>[],
  headers: string[],
  mapping?: ColumnMapping,
  defaultCourse?: string,
  defaultRole?: string,
  defaultPasswordPattern?: string
) {
  // Auto-detección inteligente de columnas
  const findHeader = (patterns: RegExp[]): string | undefined => {
    return headers.find(h => patterns.some(p => p.test(h.trim())));
  };

  const userCol = mapping?.usernameCol || findHeader([/^(username|dni|documento|nro_doc|nro documento|cuil)$/i]) || '';
  const fnCol = mapping?.firstnameCol || findHeader([/^(firstname|nombre|nombres)$/i]) || '';
  const lnCol = mapping?.lastnameCol || findHeader([/^(lastname|apellido|apellidos)$/i]) || '';
  const fullCol = mapping?.fullNameCol || findHeader([/^(nombre_completo|apellido y nombre|nombre y apellido|alumno|estudiante)$/i]) || '';
  const emCol = mapping?.emailCol || findHeader([/^(email|correo|mail|e-mail|correo electronico|correo electrónico)$/i]) || '';
  const crsCol = mapping?.courseCol || findHeader([/^(course1|course|curso|cod_curso|id_curso)$/i]) || '';
  const rolCol = mapping?.roleCol || findHeader([/^(role1|role|rol)$/i]) || '';
  const pwdCol = mapping?.passwordCol || findHeader([/^(password|clave|contrase[nñ]a)$/i]) || '';

  const processedRows: any[] = [];
  const issues: any[] = [];
  const seenEmails = new Map<string, number>();
  const seenUsernames = new Map<string, number>();

  let warningCount = 0;
  let errorCount = 0;
  let emptyDniCount = 0;
  let emptyEmailCount = 0;
  let invalidEmailCount = 0;
  let unalignedCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const rowNum = i + 2; // +1 cabecera, +1 base 1
    
    const rawUsername = userCol ? raw[userCol] : '';
    const rawFn = fnCol ? raw[fnCol] : '';
    const rawLn = lnCol ? raw[lnCol] : '';
    const rawFull = fullCol ? raw[fullCol] : '';
    const rawEmail = emCol ? raw[emCol] : '';

    let username = cleanDni(rawUsername);
    let firstname = String(rawFn ?? '').trim();
    let lastname = String(rawLn ?? '').trim();
    
    // Si hay columna de nombre completo y faltan nombres/apellidos separados
    if ((!firstname || !lastname) && rawFull) {
      const split = splitFullName(String(rawFull));
      if (!firstname) firstname = split.firstname;
      if (!lastname) lastname = split.lastname;
    }

    firstname = toTitleCase(firstname);
    lastname = toTitleCase(lastname);

    let email = cleanEmail(rawEmail);
    let course1 = crsCol && raw[crsCol] ? String(raw[crsCol]).trim() : (defaultCourse?.trim() || '');
    let role1 = rolCol && raw[rolCol] ? String(raw[rolCol]).trim().toLowerCase() : (defaultRole?.trim() || 'student');
    
    // Contraseña: de la columna si existe, o generada según el patrón/password especificado
    let password = pwdCol && raw[pwdCol] 
      ? String(raw[pwdCol]).trim() 
      : generatePassword(defaultPasswordPattern, username);

    // Validaciones
    const rowErrors: string[] = [];
    const rowWarnings: string[] = [];

    // 1. Validación de DNI
    if (!username) {
      rowErrors.push('Falta DNI / Username en planilla original');
      emptyDniCount++;
    } else if (!/^\d{7,8}$/.test(username)) {
      rowWarnings.push(`DNI "${username}" con longitud inusual (esperado 7 u 8 dígitos)`);
    } else {
      const prevRow = seenUsernames.get(username);
      if (prevRow !== undefined) {
        rowErrors.push(`DNI duplicado (ya presente en fila ${prevRow})`);
      } else {
        seenUsernames.set(username, rowNum);
      }
    }

    // 2. Validación de Email
    if (!email) {
      rowErrors.push('Falta correo electrónico');
      emptyEmailCount++;
    } else if (!validateEmail(email)) {
      rowErrors.push(`Email con formato inválido o desalineado: "${email}"`);
      invalidEmailCount++;
    } else {
      const prevRow = seenEmails.get(email);
      if (prevRow !== undefined) {
        rowWarnings.push(`Correo repetido (aparece en fila ${prevRow})`);
      } else {
        seenEmails.set(email, rowNum);
      }
    }

    // 3. Detección de Desalineación entre DNI, Apellido, Nombre y Email
    if (/@/.test(firstname) || /@/.test(lastname) || /^\d{7,11}$/.test(firstname)) {
      rowErrors.push('Posible desalineación de columnas: se detectó formato incorrecto en Nombre o Apellido');
      unalignedCount++;
    }
    if (/^\d{6,11}$/.test(email) && !email.includes('@')) {
      rowErrors.push('Posible desalineación de columnas: la columna de email contiene números de documento');
      unalignedCount++;
    }

    if (!firstname) rowWarnings.push('Nombre vacío en planilla');
    if (!lastname) rowWarnings.push('Apellido vacío en planilla');
    if (!course1) rowErrors.push('Falta código corto de curso (course1)');

    if (rowErrors.length > 0) errorCount += rowErrors.length;
    if (rowWarnings.length > 0) warningCount += rowWarnings.length;

    if (rowErrors.length > 0 || rowWarnings.length > 0) {
      issues.push({
        row: rowNum,
        username,
        email,
        firstname,
        lastname,
        errors: rowErrors,
        warnings: rowWarnings,
        raw
      });
    }

    processedRows.push({
      _rowNum: rowNum,
      username,
      password,
      firstname,
      lastname,
      email,
      course1,
      role1,
      _status: rowErrors.length > 0 ? 'error' : rowWarnings.length > 0 ? 'warning' : 'valid',
      _errors: rowErrors,
      _warnings: rowWarnings,
      _raw: raw
    });
  }

  const summary: AuditSummary = {
    totalRows: rawRows.length,
    validRows: processedRows.filter(r => r._status === 'valid').length,
    warningCount,
    errorCount,
    duplicateEmails: Array.from(seenEmails.values()).filter(v => v > 1).length,
    duplicateUsernames: Array.from(seenUsernames.values()).filter(v => v > 1).length,
    emptyDniCount,
    emptyEmailCount,
    invalidEmailCount,
    unalignedCount
  };

  return {
    headers,
    detectedMapping: { userCol, fnCol, lnCol, fullCol, emCol, crsCol, rolCol, pwdCol },
    rows: processedRows,
    issues,
    summary
  };
}

// Escuchar mensajes del hilo principal
self.onmessage = async (e: MessageEvent<WorkerParseMessage | WorkerReAuditMessage | WorkerZipMessage>) => {
  const data = e.data;

  try {
    if (data.type === 'PARSE_FILE') {
      const { fileData, defaultPassword, defaultCourse, defaultRole, mapping } = data;
      
      const workbook = XLSX.read(fileData, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convertir a objetos JSON con cabeceras de la primera fila
      cachedRawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (cachedRawRows.length === 0) {
        self.postMessage({ type: 'ERROR', message: 'La planilla no contiene filas de datos.' });
        return;
      }

      cachedHeaders = Object.keys(cachedRawRows[0] || {});
      const result = auditData(cachedRawRows, cachedHeaders, mapping, defaultCourse, defaultRole, defaultPassword);

      self.postMessage({
        type: 'PARSE_COMPLETE',
        headers: cachedHeaders,
        detectedMapping: result.detectedMapping,
        rows: result.rows,
        issues: result.issues,
        summary: result.summary,
        sampleRaw: cachedRawRows.slice(0, 5)
      });
    }

    if (data.type === 'RE_AUDIT') {
      const { mapping, defaultCourse, defaultRole, defaultPassword } = data;
      if (cachedRawRows.length === 0) {
        self.postMessage({ type: 'ERROR', message: 'No hay datos cargados en memoria para reauditar.' });
        return;
      }

      const result = auditData(cachedRawRows, cachedHeaders, mapping, defaultCourse, defaultRole, defaultPassword);

      self.postMessage({
        type: 'PARSE_COMPLETE',
        headers: cachedHeaders,
        detectedMapping: result.detectedMapping,
        rows: result.rows,
        issues: result.issues,
        summary: result.summary,
        sampleRaw: cachedRawRows.slice(0, 5)
      });
    }

    if (data.type === 'GENERATE_ZIP') {
      const { rows, batchSize, delimiter, baseFileName } = data;
      const zip = new JSZip();

      const csvHeaders = ['username', 'password', 'firstname', 'lastname', 'email', 'course1', 'role1'];
      const escapeCsvCell = (val: any) => {
        const sanitized = sanitizeCell(val);
        const escaped = sanitized.replace(/"/g, '""');
        return `"${escaped}"`;
      };

      const totalBatches = Math.ceil(rows.length / batchSize);

      for (let b = 0; b < totalBatches; b++) {
        const start = b * batchSize;
        const end = Math.min(start + batchSize, rows.length);
        const chunk = rows.slice(start, end);

        let csvContent = '\uFEFF' + csvHeaders.join(delimiter) + '\r\n'; // Con BOM UTF-8

        for (const row of chunk) {
          const line = [
            escapeCsvCell(row.username),
            escapeCsvCell(row.password),
            escapeCsvCell(row.firstname),
            escapeCsvCell(row.lastname),
            escapeCsvCell(row.email),
            escapeCsvCell(row.course1),
            escapeCsvCell(row.role1 || 'student')
          ].join(delimiter);
          csvContent += line + '\r\n';
        }

        const partNum = String(b + 1).padStart(2, '0');
        zip.file(`${baseFileName}_lote_${partNum}.csv`, csvContent);
      }

      // Generar ZIP comprimido
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      self.postMessage({
        type: 'ZIP_COMPLETE',
        blob: zipBlob,
        totalBatches
      });
    }

  } catch (err: any) {
    self.postMessage({ type: 'ERROR', message: err.message || 'Error en el procesamiento del Web Worker' });
  }
};
