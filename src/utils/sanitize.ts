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
