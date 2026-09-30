/**
 * Central input sanitation utility for Excel/CSV data.
 * Strips script tags, HTML tags, and CSV formula injection vectors.
 */

export function sanitizeCell(value: any): string {
  if (value === null || value === undefined) return '';
  let str = String(value).trim();

  // Strip script tags and HTML tags
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/<\/?[^>]+(>|$)/g, '');

  // Neutralize CSV formula injection (=, +, -, @ at the start of cell content)
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  return str;
}

export function cleanDni(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  // Remove prefix letters like "DNI", "D.N.I.", "LC", "CI", dots, commas, spaces, dashes
  const digits = str.replace(/^(?:dni|d\.n\.i\.|lc|ci|cuil|cuit)\s*[:.\-]?\s*/i, '').replace(/[^0-9]/g, '');
  return digits || str.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
}

export function cleanEmail(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase();
}

export function validateEmail(email: string): boolean {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function toTitleCase(value: string): string {
  if (!value) return '';
  const lowercaseWords = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'o', 'u', 'da', 'do', 'dos', 'das', 'van', 'von']);
  
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (word.length === 0) return '';
      if (index > 0 && lowercaseWords.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function splitFullName(fullName: string): { firstname: string; lastname: string } {
  if (!fullName) return { firstname: '', lastname: '' };
  const clean = fullName.trim();
  
  // Format: "APELLIDO, NOMBRE" or "APELLIDO, NOMBRE SEGUNDO"
  if (clean.includes(',')) {
    const parts = clean.split(',').map(p => p.trim()).filter(Boolean);
    const lastname = parts[0] || '';
    const firstname = parts.slice(1).join(' ') || '';
    return { firstname, lastname };
  }

  // Format without comma: "NOMBRE APELLIDO" or "APELLIDO NOMBRE"
  // Default heuristic: first word is firstname, remainder is lastname (or viceversa)
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstname: parts[0], lastname: '' };
  }
  if (parts.length === 2) {
    return { firstname: parts[0], lastname: parts[1] };
  }
  if (parts.length === 3) {
    // e.g. "JUAN CARLOS PEREZ" -> firstname "JUAN CARLOS", lastname "PEREZ"
    return { firstname: `${parts[0]} ${parts[1]}`, lastname: parts[2] };
  }
  // 4 or more words: e.g. "MARIA DE LOS ANGELES PEREZ GOMEZ" -> split in middle
  const mid = Math.floor(parts.length / 2);
  return {
    firstname: parts.slice(0, mid).join(' '),
    lastname: parts.slice(mid).join(' ')
  };
}

export interface SanitizedRow extends Record<string, any> {
  Sanitized: boolean;
}

export function sanitizeRow(row: Record<string, any>): SanitizedRow {
  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(row)) {
    const cleanKey = sanitizeCell(key);
    sanitized[cleanKey] = sanitizeCell(val);
  }
  sanitized.Sanitized = true;
  return sanitized as SanitizedRow;
}

export function sanitizeRows(rows: Record<string, any>[]): SanitizedRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => sanitizeRow(row));
}
